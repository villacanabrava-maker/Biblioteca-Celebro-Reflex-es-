/**
 * Motor Cognitivo: Planejador Metodológico de Reflexão
 * Mobiliza a taxonomia, regras ativas e o repertório autoral para desenhar a arquitetura de raciocínio prévia.
 *
 * Idioma: Português do Brasil
 */

import { z } from "zod";
import { criarClienteAdmin } from "@/infraestrutura/supabase/cliente-admin";
import { executarChamadaEstruturada, protegerEntradaDeDados, PAPEIS_IA } from "@/ia/orquestrador";
import type { ConflitoDetectado, DossieContextual, FormatoReflexao } from "@/tipos/reflexoes";

const EsquemaPlanoZod = z.object({
  tese_central: z.string().describe("Tese autoral profunda, assertiva e provocativa que o autor defenderá"),
  movimentos_argumentativos: z.array(
    z.object({
      ordem: z.number(),
      tipo: z.string().describe("Ex: (1) Ponto de Partida, (2) Observação do Fenômeno, (3) Tensão Dialética, (4) Questionamento Radical, (5) Associação Conceitual, (6) Argumentação Rigorosa, (7) Elaboração, (8) Síntese Autoral, (9) Provocação Conclusiva"),
      descricao: z.string().describe("Como o autor desenvolve esse movimento específico de forma densa"),
      dimensao_metodologica: z.string().nullable().describe("Dimensão metodológica mobilizada: formas_de_abertura, padroes_de_tensao, etc."),
      conceitos_chave: z.array(z.string()).nullable().describe("Conceitos da taxonomia mobilizados nesta etapa"),
    })
  ),
  conceitos_mobilizados: z.array(z.string()).describe("Lista de termos conceituais da taxonomia ativados"),
  regras_acionadas: z.array(z.string()).describe("Enunciados de regras prescritivas e anti-regras que regem a reflexão"),
  contra_argumentos_antecipados: z.array(
    z.object({
      objecao: z.string().describe("Objeção ou contra-argumento previsível de interlocutores críticos"),
      resposta_autoral: z.string().describe("Como o autor refuta ou incorpora a objeção mantendo sua postura epistemológica"),
      grau_relevancia: z.enum(["alta", "media", "baixa"]),
    })
  ),
});

export async function gerarPlanoReflexao({
  entradaId,
  usuarioId,
  titulo,
  temaCentral,
  provocacaoInicial,
  reflexaoExterna,
  comentarioAutor,
  objetivoComunicativo,
  publicoAlvo,
  formatoDesejado,
  restricoesEspecificas,
}: {
  entradaId: string;
  usuarioId: string;
  titulo: string;
  temaCentral: string;
  provocacaoInicial: string;
  reflexaoExterna?: string | null;
  comentarioAutor?: string | null;
  objetivoComunicativo?: string | null;
  publicoAlvo?: string | null;
  formatoDesejado: FormatoReflexao;
  restricoesEspecificas?: string | null;
}) {
  const admin = criarClienteAdmin();

  // 1. Obter entrada atual para recuperar dossiê e tensões pré-salvas
  const { data: entradaDb } = await admin
    .schema("reflexoes")
    .from("entradas")
    .select("reflexao_externa, comentario_autor, dossie_contexto, conflitos_detectados")
    .eq("id", entradaId)
    .single();

  const textoExterno = reflexaoExterna || entradaDb?.reflexao_externa || provocacaoInicial;
  const textoComentario = comentarioAutor || entradaDb?.comentario_autor || "";
  const conflitos = (
    (entradaDb?.conflitos_detectados as ConflitoDetectado[] | null) || []
  ).filter((conflito) => conflito.considerado_no_plano !== false);

  const dossie = (entradaDb?.dossie_contexto as DossieContextual | null) || null;

  // 2. Usar exatamente as memórias persistidas no dossiê desta reflexão.
  // Sem dossiê real, seguir com corpus vazio em vez de substituir por fragmentos genéricos.
  const fragmentosDossie = dossie?.fragmentos_selecionados || [];

  const corpusAmostra = fragmentosDossie
    .map((f, i) => `[Memória ${i + 1} - Obra: "${f.obra_titulo}"]\n${f.conteudo}`)
    .join("\n\n---\n\n");

  const fontesIds = fragmentosDossie.map((f) => f.id);

  // 3. Preservar os conceitos capturados no mesmo snapshot do dossiê.
  // Entradas antigas sem dossiê continuam podendo consultar a taxonomia atual.
  let conceitosDossie = dossie?.conceitos_chave || [];
  if (!dossie) {
    const { data: conceitosAtuais } = await admin
      .from("v_taxonomia_conceitos")
      .select("termo_preferencial, definicao, dominio")
      .limit(20);

    conceitosDossie = (conceitosAtuais || []).map((conceito) => ({
      termo: conceito.termo_preferencial,
      definicao: conceito.definicao || "",
      dominio: conceito.dominio || "Geral",
    }));
  }

  const conceitosTexto = conceitosDossie
    .map((conceito) => `- ${conceito.termo} (${conceito.dominio}): ${conceito.definicao}`)
    .join("\n");

  // 4. Preservar as regras sugeridas no mesmo snapshot do dossiê.
  // Entradas antigas sem dossiê continuam podendo consultar as regras atuais.
  let regrasDossie = dossie?.regras_sugeridas || [];
  if (!dossie) {
    const { data: regrasAtuais } = await admin
      .from("v_cerebro_regras_ativas")
      .select("tipo_regra, enunciado")
      .eq("usuario_id", usuarioId)
      .limit(15);

    regrasDossie = (regrasAtuais || []).map((regra) => ({
      tipo: regra.tipo_regra,
      enunciado: regra.enunciado,
    }));
  }

  const regrasTexto = regrasDossie
    .map((regra) => `- [${regra.tipo.toUpperCase()}]: ${regra.enunciado}`)
    .join("\n");

  const promptSistema = `Você é o Planejador Metodológico do "Cérebro Autoral".
Sua missão é conceber a arquitetura prévia de raciocínio de uma nova reflexão a partir da metodologia intelectual do autor.

GRAFO METODOLÓGICO DE 9 PASSOS:
Estruture os movimentos argumentativos contemplando a progressão autoral:
1. Ponto de Partida / Experiência Concreta
2. Observação Atenta do Fenômeno
3. Tensão Cognitiva / Paradoxo Identificado
4. Questionamento Radical
5. Associação e Conexão Inesperada
6. Argumentação Rigorosa e Fundamentação
7. Elaboração e Desdobramento Conceitual
8. Síntese Autoral Assertiva
9. Conclusão Aberta e Provocação Futura

REGRAS INEGOCIÁVEIS:
1. Formule tudo em Português do Brasil com altíssimo rigor conceitual.
2. O plano NÃO é o texto final, mas o esqueleto dialético e ontológico da reflexão.
3. Respeite as regras prescritivas e jamais incorra nas anti-regras.`;

  const conflitosTexto = conflitos.length > 0
    ? conflitos.map((c: any) => `- [${c.tipo}] ${c.descricao} (Atrito: "${c.posicao_externa}" vs "${c.posicao_autoral}")`).join("\n")
    : "Nenhum conflito explícito registrado. Explorar dialética interna.";

  const promptUsuario = `PLANEJE A ARQUITETURA COGNITIVA DA REFLEXÃO:
- Título Proposto: "${titulo}"
- Tema Central: "${temaCentral}"
- Formato Desejado: "${formatoDesejado}"
- Objetivo Comunicativo: "${objetivoComunicativo || "Desestabilizar certezas e fundar nova posição"}"
- Público-Alvo: "${publicoAlvo || "Leitores reflexivos e críticos"}"
- Restrições Específicas: "${restricoesEspecificas || "Nenhuma informada"}"

${protegerEntradaDeDados(textoExterno, "ESTIMULO_EXTERNO")}

${protegerEntradaDeDados(textoComentario, "PENSAMENTO_PRESENTE_DO_AUTOR")}

TENSÕES E CONFLITOS MAPEADOS:
${conflitosTexto}

TAXONOMIA DISPONÍVEL DO AUTOR:
${conceitosTexto || "Sem conceitos prévios."}

CATÁLOGO DE REGRAS E ANTI-REGRAS DO AUTOR:
${regrasTexto || "Escrita densa, sem clichês motivacionais, foco na ontologia das questões."}

MEMÓRIAS HISTÓRICAS DO AUTOR:
${corpusAmostra || "Sem memórias anteriores. Formule raciocínio analítico autônomo."}

Gere o Plano de Reflexão estruturado.`;

  const planoGerado = await executarChamadaEstruturada({
    papel: PAPEIS_IA.CEREBRO,
    sistema: promptSistema,
    usuario: promptUsuario,
    esquemaZod: EsquemaPlanoZod,
    nomeEsquema: "plano_reflexao",
    temperatura: 0.35,
  });

  // Gravar o plano no Supabase Postgres
  const { data: planoSalvo, error: errPlano } = await admin
    .schema("reflexoes")
    .from("planos_reflexao")
    .insert({
      entrada_id: entradaId,
      usuario_id: usuarioId,
      tese_central: planoGerado.tese_central,
      movimentos_argumentativos: planoGerado.movimentos_argumentativos,
      conceitos_mobilizados: planoGerado.conceitos_mobilizados,
      fontes_mobilizadas: fontesIds,
      regras_acionadas: planoGerado.regras_acionadas,
      contra_argumentos_antecipados: planoGerado.contra_argumentos_antecipados,
      estado: "proposto",
    })
    .select()
    .single();

  if (errPlano || !planoSalvo) {
    throw new Error(`Falha ao salvar plano de reflexão: ${errPlano?.message}`);
  }

  // Atualizar estado da entrada para 'planejada'
  await admin
    .schema("reflexoes")
    .from("entradas")
    .update({ estado: "planejada" })
    .eq("id", entradaId);

  return planoSalvo;
}
