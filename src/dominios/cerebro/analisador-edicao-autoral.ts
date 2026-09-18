import { z } from "zod";
import { criarClienteAdmin } from "@/infraestrutura/supabase/cliente-admin";
import {
  executarChamadaEstruturada,
  protegerEntradaDeDados,
  PAPEIS_IA,
} from "@/ia/orquestrador";
import { calcularDiffEdicaoAutor } from "@/dominios/reflexoes/diff-edicao";
import type { DiffEdicaoAutor } from "@/tipos/reflexoes";
import type {
  DadosPropostaAtualizacao,
  EvidenciaEdicaoAutoral,
  TipoPropostaAtualizacaoCerebro,
  TipoRegra,
} from "@/tipos/cerebro";

const EsquemaAprendizadoEdicaoZod = z.object({
  propostas: z.array(
    z.object({
      tipo_proposta: z.enum([
        "nova_caracteristica",
        "atualizacao_regra",
        "nova_metodologia",
      ]),
      dimensao_codigo: z.string(),
      titulo: z.string(),
      descricao: z.string(),
      enunciado_regra: z.string().nullable(),
      tipo_regra: z
        .enum(["prescritiva", "proscritiva", "preferencia", "restricao_estilo"])
        .nullable(),
      alteracoes_referencia: z.array(z.number().int().nonnegative()),
      justificativa: z.string(),
      confianca: z.number().min(0).max(1),
    })
  ),
});

export interface PropostaAprendizadoModelo {
  tipo_proposta: Exclude<TipoPropostaAtualizacaoCerebro, "depreciacao">;
  dimensao_codigo: string;
  titulo: string;
  descricao: string;
  enunciado_regra: string | null;
  tipo_regra: TipoRegra | null;
  alteracoes_referencia: number[];
  justificativa: string;
  confianca: number;
}

export interface DimensaoAprendizado {
  id: string;
  codigo: string;
  nome: string;
  descricao: string;
}

export interface PropostaAprendizadoValidada {
  tipo_proposta: PropostaAprendizadoModelo["tipo_proposta"];
  dimensao: DimensaoAprendizado;
  titulo: string;
  descricao: string;
  enunciado_regra: string | null;
  tipo_regra: TipoRegra | null;
  alteracoes_referencia: number[];
  evidencias_edicao: EvidenciaEdicaoAutoral[];
  justificativa: string;
  confianca: number;
}

function limitarTexto(texto: string, limite = 900): string {
  const limpo = texto.trim();
  return limpo.length <= limite ? limpo : `${limpo.slice(0, limite)}…`;
}

export function validarPropostasAprendizado({
  propostas,
  dimensoes,
  diff,
}: {
  propostas: PropostaAprendizadoModelo[];
  dimensoes: DimensaoAprendizado[];
  diff: DiffEdicaoAutor;
}): PropostaAprendizadoValidada[] {
  const dimensoesPorCodigo = new Map(
    dimensoes.map((dimensao) => [dimensao.codigo, dimensao])
  );

  const validadas: PropostaAprendizadoValidada[] = [];

  for (const proposta of propostas.slice(0, 6)) {
    const dimensao = dimensoesPorCodigo.get(proposta.dimensao_codigo);
    if (!dimensao) continue;

    const titulo = proposta.titulo.trim();
    const descricao = proposta.descricao.trim();
    const justificativa = proposta.justificativa.trim();

    if (!titulo || !descricao || !justificativa) continue;
    if (proposta.confianca < 0.55) continue;

    const indices = Array.from(
      new Set(
        proposta.alteracoes_referencia.filter(
          (indice) =>
            Number.isInteger(indice) &&
            indice >= 0 &&
            indice < diff.alteracoes.length
        )
      )
    ).sort((a, b) => a - b);

    if (indices.length === 0) continue;

    const enunciadoRegra = proposta.enunciado_regra?.trim() || null;
    const tipoRegra = proposta.tipo_regra || null;

    if (
      proposta.tipo_proposta === "atualizacao_regra" &&
      (!enunciadoRegra || !tipoRegra)
    ) {
      continue;
    }

    const evidencias = indices.map((indice) => {
      const alteracao = diff.alteracoes[indice];

      return {
        indice,
        tipo: alteracao.tipo,
        antes: alteracao.antes,
        depois: alteracao.depois,
        palavras_removidas: alteracao.palavras_removidas,
        palavras_adicionadas: alteracao.palavras_adicionadas,
      };
    });

    validadas.push({
      tipo_proposta: proposta.tipo_proposta,
      dimensao,
      titulo,
      descricao,
      enunciado_regra: enunciadoRegra,
      tipo_regra: tipoRegra,
      alteracoes_referencia: indices,
      evidencias_edicao: evidencias,
      justificativa,
      // Uma única edição é evidência útil, mas não prova uma regra universal.
      confianca: Math.min(0.75, proposta.confianca),
    });
  }

  return validadas;
}

export async function gerarPropostasAprendizadoDaEdicao({
  entradaId,
  versaoEditadaId,
  usuarioId,
}: {
  entradaId: string;
  versaoEditadaId: string;
  usuarioId: string;
}) {
  const admin = criarClienteAdmin();

  // Idempotência pragmática usando a origem persistida no JSONB existente.
  // A documentação do Supabase suporta contains() para filtros em jsonb.
  const origem = {
    origem: {
      tipo: "edicao_reflexao",
      versao_editada_id: versaoEditadaId,
    },
  };

  const { data: propostasExistentes, error: erroExistentes } = await admin
    .schema("cerebro_autoral")
    .from("propostas_atualizacao")
    .select("*")
    .eq("usuario_id", usuarioId)
    .contains("dados_propostos", origem);

  if (erroExistentes) {
    throw new Error(
      `Falha ao verificar propostas já geradas: ${erroExistentes.message}`
    );
  }

  if (propostasExistentes && propostasExistentes.length > 0) {
    return {
      sucesso: true,
      reutilizadas: true,
      totalPropostas: propostasExistentes.length,
      propostas: propostasExistentes,
    };
  }

  const { data: versaoEditada, error: erroEditada } = await admin
    .schema("reflexoes")
    .from("versoes_reflexao")
    .select("*")
    .eq("id", versaoEditadaId)
    .eq("entrada_id", entradaId)
    .eq("usuario_id", usuarioId)
    .single();

  if (
    erroEditada ||
    !versaoEditada ||
    versaoEditada.origem_versao !== "edicao_autor" ||
    !versaoEditada.versao_base_id
  ) {
    throw new Error("Versão editada pelo autor não encontrada ou sem versão-base.");
  }

  const { data: versaoBase, error: erroBase } = await admin
    .schema("reflexoes")
    .from("versoes_reflexao")
    .select("*")
    .eq("id", versaoEditada.versao_base_id)
    .eq("entrada_id", entradaId)
    .eq("usuario_id", usuarioId)
    .single();

  if (erroBase || !versaoBase) {
    throw new Error("Versão-base da edição não encontrada.");
  }

  const diff = calcularDiffEdicaoAutor({
    versaoBaseId: versaoBase.id,
    versaoEditadaId: versaoEditada.id,
    antes: versaoBase.conteudo_markdown,
    depois: versaoEditada.conteudo_markdown,
  });

  if (diff.alteracoes.length === 0) {
    return {
      sucesso: true,
      reutilizadas: false,
      totalPropostas: 0,
      propostas: [],
    };
  }

  const { data: dimensoes, error: erroDimensoes } = await admin
    .schema("cerebro_autoral")
    .from("dimensoes")
    .select("id, codigo, nome, descricao")
    .eq("ativa", true)
    .order("ordem", { ascending: true });

  if (erroDimensoes || !dimensoes?.length) {
    throw new Error("Dimensões do Cérebro indisponíveis para analisar a edição.");
  }

  const { data: versaoCerebro } = await admin
    .schema("cerebro_autoral")
    .from("versoes_cerebro")
    .select("id")
    .eq("usuario_id", usuarioId)
    .eq("estado", "ativa")
    .maybeSingle();

  const alteracoesParaAnalise = diff.alteracoes.slice(0, 40).map((alteracao, indice) => ({
    indice,
    tipo: alteracao.tipo,
    antes: limitarTexto(alteracao.antes),
    depois: limitarTexto(alteracao.depois),
    palavras_removidas: alteracao.palavras_removidas,
    palavras_adicionadas: alteracao.palavras_adicionadas,
  }));

  const dimensoesParaAnalise = (dimensoes as DimensaoAprendizado[]).map(
    (dimensao) => ({
      codigo: dimensao.codigo,
      nome: dimensao.nome,
      descricao: dimensao.descricao,
    })
  );

  const sistema = `
Você analisa EDIÇÕES FEITAS PELO PRÓPRIO AUTOR sobre um texto previamente gerado por IA.

Seu objetivo não é elogiar a edição nem transformar toda mudança local em regra.
Seu objetivo é detectar apenas CANDIDATOS REUTILIZÁVEIS de preferência, revisão,
expressão ou método que possam ajudar o Cérebro Autoral em reflexões futuras.

REGRAS OBRIGATÓRIAS:
1. Uma correção ortográfica, factual, de pontuação isolada ou ajuste puramente local não prova um padrão; não gere proposta nesses casos.
2. É permitido retornar zero propostas.
3. Toda proposta deve citar pelo menos um índice de alteração fornecido.
4. Use exclusivamente um codigo de dimensão da lista fornecida.
5. Nunca declare que a proposta já é uma regra do autor. Ela será submetida à decisão humana.
6. Não infira crenças, posições ideológicas ou preferências gerais a partir do assunto do texto. Analise a FORMA DA EDIÇÃO.
7. "atualizacao_regra" só é válida quando houver um enunciado reutilizável e um tipo_regra.
8. Prefira poucas propostas densas a muitas generalizações frágeis.
  `.trim();

  const dadosAnalise = protegerEntradaDeDados(
    JSON.stringify(
      {
        dimensoes_disponiveis: dimensoesParaAnalise,
        diff: {
          estrategia: diff.estrategia,
          total_palavras_base: diff.total_palavras_base,
          total_palavras_editada: diff.total_palavras_editada,
          percentual_alteracao: diff.percentual_alteracao,
          alteracoes: alteracoesParaAnalise,
        },
      },
      null,
      2
    ),
    "DADOS_DA_EDICAO_AUTORAL"
  );

  const resultado = await executarChamadaEstruturada({
    papel: PAPEIS_IA.CEREBRO,
    sistema,
    usuario: `Analise os dados da edição abaixo e proponha somente aprendizados sustentados pelas alterações.\n\n${dadosAnalise}`,
    esquemaZod: EsquemaAprendizadoEdicaoZod,
    nomeEsquema: "aprendizado_edicao_autoral",
    temperatura: 0.15,
  });

  const validadas = validarPropostasAprendizado({
    propostas: resultado.propostas as PropostaAprendizadoModelo[],
    dimensoes: dimensoes as DimensaoAprendizado[],
    diff,
  });

  if (validadas.length === 0) {
    return {
      sucesso: true,
      reutilizadas: false,
      totalPropostas: 0,
      propostas: [],
    };
  }

  const registros = validadas.map((proposta) => {
    const dadosPropostos: DadosPropostaAtualizacao = {
      origem: {
        tipo: "edicao_reflexao",
        entrada_id: entradaId,
        versao_base_id: versaoBase.id,
        versao_editada_id: versaoEditada.id,
      },
      dimensao: {
        id: proposta.dimensao.id,
        codigo: proposta.dimensao.codigo,
        nome: proposta.dimensao.nome,
      },
      aprendizado: {
        titulo: proposta.titulo,
        descricao: proposta.descricao,
        enunciado_regra: proposta.enunciado_regra,
        tipo_regra: proposta.tipo_regra,
      },
      alteracoes_referencia: proposta.alteracoes_referencia,
      evidencias_edicao: proposta.evidencias_edicao,
    };

    return {
      usuario_id: usuarioId,
      versao_cerebro_id: versaoCerebro?.id || null,
      tipo_proposta: proposta.tipo_proposta,
      estado_decisao: "pendente",
      dados_propostos: dadosPropostos,
      justificativa_ia: proposta.justificativa,
      confianca_calculada: proposta.confianca,
    };
  });

  const { data: inseridas, error: erroInsercao } = await admin
    .schema("cerebro_autoral")
    .from("propostas_atualizacao")
    .insert(registros)
    .select("*");

  if (erroInsercao) {
    throw new Error(
      `Falha ao registrar propostas de aprendizado: ${erroInsercao.message}`
    );
  }

  return {
    sucesso: true,
    reutilizadas: false,
    totalPropostas: inseridas?.length || 0,
    propostas: inseridas || [],
  };
}
