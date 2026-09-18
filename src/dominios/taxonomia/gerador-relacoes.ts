import { z } from "zod";
import { criarClienteAdmin } from "@/infraestrutura/supabase/cliente-admin";
import {
  executarChamadaEstruturada,
  protegerEntradaDeDados,
  PAPEIS_IA,
} from "@/ia/orquestrador";
import type { TipoRelacaoOntologica } from "@/tipos/taxonomia";

const TIPOS_RELACAO = [
  "mais_amplo",
  "mais_especifico",
  "relacionado",
  "contrasta_com",
  "deriva_de",
  "evolui_para",
  "associado_a",
] as const;

const EsquemaRelacoesZod = z.object({
  relacoes: z.array(
    z.object({
      destino_codigo: z.string(),
      tipo_relacao: z.enum(TIPOS_RELACAO),
      confianca: z.number().min(0).max(1),
      justificativa: z.string(),
    })
  ),
});

export interface ConceitoParaRelacao {
  id: string;
  codigo: string;
  termo_preferencial: string;
  definicao: string;
  dominio: string;
}

export interface RelacaoTaxonomicaValidada {
  destinoId: string;
  destinoCodigo: string;
  tipoRelacao: TipoRelacaoOntologica;
  confianca: number;
  justificativa: string;
}

export function validarRelacoesTaxonomicas({
  origem,
  destinos,
  candidatas,
}: {
  origem: ConceitoParaRelacao;
  destinos: ConceitoParaRelacao[];
  candidatas: z.infer<typeof EsquemaRelacoesZod>["relacoes"];
}): RelacaoTaxonomicaValidada[] {
  const porCodigo = new Map(destinos.map((conceito) => [conceito.codigo, conceito]));
  const chaves = new Set<string>();
  const saida: RelacaoTaxonomicaValidada[] = [];

  for (const candidata of candidatas.slice(0, 10)) {
    if (candidata.confianca < 0.72) continue;

    const destino = porCodigo.get(candidata.destino_codigo);
    if (!destino || destino.id === origem.id) continue;

    const justificativa = candidata.justificativa.trim();
    if (!justificativa) continue;

    const chave = `${destino.id}::${candidata.tipo_relacao}`;
    if (chaves.has(chave)) continue;
    chaves.add(chave);

    saida.push({
      destinoId: destino.id,
      destinoCodigo: destino.codigo,
      tipoRelacao: candidata.tipo_relacao,
      confianca: Math.min(0.9, candidata.confianca),
      justificativa,
    });
  }

  return saida;
}

export async function gerarRelacoesParaConceitoConfirmado({
  conceitoId,
  usuarioId,
}: {
  conceitoId: string;
  usuarioId: string;
}) {
  const admin = criarClienteAdmin();

  const { data: origem, error: erroOrigem } = await admin
    .schema("taxonomia")
    .from("conceitos")
    .select("id, codigo, termo_preferencial, definicao, dominio, estado")
    .eq("id", conceitoId)
    .eq("usuario_id", usuarioId)
    .single();

  if (erroOrigem || !origem || origem.estado !== "ativo") {
    throw new Error("Conceito confirmado não encontrado para gerar relações.");
  }

  const { data: outros, error: erroOutros } = await admin
    .schema("taxonomia")
    .from("conceitos")
    .select("id, codigo, termo_preferencial, definicao, dominio")
    .eq("usuario_id", usuarioId)
    .eq("estado", "ativo")
    .neq("id", conceitoId)
    .limit(100);

  if (erroOutros) {
    throw new Error(`Falha ao carregar conceitos relacionados: ${erroOutros.message}`);
  }

  const destinos = (outros || []) as ConceitoParaRelacao[];
  if (destinos.length === 0) {
    return { totalPropostas: 0 };
  }

  const sistema = `
Você analisa relações ontológicas entre conceitos JÁ CONFIRMADOS pelo usuário.

REGRAS
1. Use somente as definições fornecidas.
2. É permitido retornar zero relações.
3. Não crie relação apenas porque dois conceitos compartilham palavras.
4. "mais_amplo"/"mais_especifico" exigem relação hierárquica real.
5. "contrasta_com" exige oposição conceitual sustentada pelas definições.
6. "deriva_de"/"evolui_para" exigem dependência ou transformação conceitual clara.
7. "relacionado"/"associado_a" devem ser usados com parcimônia; não são categorias de preenchimento.
8. Toda relação gerada será apenas uma proposta e dependerá de confirmação humana.
  `.trim();

  const dados = protegerEntradaDeDados(
    JSON.stringify(
      {
        conceito_origem: origem,
        conceitos_destino_disponiveis: destinos,
      },
      null,
      2
    ),
    "CONCEITOS_CONFIRMADOS"
  );

  const resposta = await executarChamadaEstruturada({
    papel: PAPEIS_IA.ANALISE,
    modelo: "gpt-4o-mini",
    sistema,
    usuario: `Proponha apenas relações semanticamente sustentadas.\n\n${dados}`,
    esquemaZod: EsquemaRelacoesZod,
    nomeEsquema: "relacoes_taxonomicas",
    temperatura: 0.1,
    maxTentativas: 2,
  });

  const validadas = validarRelacoesTaxonomicas({
    origem: origem as ConceitoParaRelacao,
    destinos,
    candidatas: resposta.relacoes,
  });

  let totalPropostas = 0;

  for (const relacao of validadas) {
    const { data: existente } = await admin
      .schema("taxonomia")
      .from("relacoes")
      .select("id")
      .eq("conceito_origem_id", conceitoId)
      .eq("conceito_destino_id", relacao.destinoId)
      .eq("tipo_relacao", relacao.tipoRelacao)
      .maybeSingle();

    if (existente) continue;

    const { error } = await admin
      .schema("taxonomia")
      .from("relacoes")
      .insert({
        conceito_origem_id: conceitoId,
        conceito_destino_id: relacao.destinoId,
        tipo_relacao: relacao.tipoRelacao,
        confianca: relacao.confianca,
        origem: "ia",
        estado: "revisao",
      });

    if (error) {
      throw new Error(`Falha ao registrar proposta de relação: ${error.message}`);
    }

    totalPropostas++;
  }

  return { totalPropostas };
}
