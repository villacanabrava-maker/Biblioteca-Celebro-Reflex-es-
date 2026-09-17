/**
 * Motor Cognitivo: Redator Autoral de Reflexão
 * Dá corpo e voz ao plano aprovado pelo autor, vinculando citações e proveniência estrita.
 *
 * Idioma: Português do Brasil
 */

import { z } from "zod";
import { criarClienteAdmin } from "@/infraestrutura/supabase/cliente-admin";
import { executarChamadaEstruturada, protegerEntradaDeDados, PAPEIS_IA } from "@/ia/orquestrador";

const EsquemaRedacaoZod = z.object({
  titulo_gerado: z.string().describe("Título definitivo, autoral, impactante e expressivo para a reflexão"),
  sumario_executivo: z.string().describe("Síntese executiva densa e provocativa do ensaio"),
  conteudo_markdown: z.string().describe("Texto integral da reflexão redigido em Markdown"),
  citacoes_identificadas: z.array(
    z.object({
      fragmento_index: z.number().describe("Índice do fragmento autoral (1-based) que embasa este trecho"),
      trecho_afirmacao_gerada: z.string().describe("Trecho ou argumento formulado no texto gerado"),
      trecho_original_citado: z.string().describe("Trecho correspondente da memória original do autor"),
      grau_aderencia: z.number().min(0).max(1).describe("Grau de correspondência conceitual (0.0 a 1.0)"),
    })
  ),
});

export async function redigirReflexao({
  entradaId,
  planoId,
  usuarioId,
}: {
  entradaId: string;
  planoId: string;
  usuarioId: string;
}) {
  const admin = criarClienteAdmin();

  // 1. Carregar entrada e plano
  const { data: entrada, error: errEntrada } = await admin
    .schema("reflexoes")
    .from("entradas")
    .select("*")
    .eq("id", entradaId)
    .single();

  if (errEntrada || !entrada) {
    throw new Error("Entrada de reflexão não encontrada.");
  }

  const { data: plano, error: errPlano } = await admin
    .schema("reflexoes")
    .from("planos_reflexao")
    .select("*")
    .eq("id", planoId)
    .single();

  if (errPlano || !plano) {
    throw new Error("Plano de reflexão não encontrado.");
  }

  // 2. Carregar fragmentos vinculados
  const fontesIds: string[] = Array.isArray(plano.fontes_mobilizadas)
    ? plano.fontes_mobilizadas
    : [];

  let fragmentos: { id: string; conteudo: string; obra_titulo?: string }[] = [];
  if (fontesIds.length > 0) {
    const { data: frags } = await admin
      .from("v_fragmentos_detalhados")
      .select("id, conteudo, obra_titulo")
      .in("id", fontesIds);
    fragmentos = (frags as any) || [];
  }

  if (fragmentos.length === 0) {
    const { data: fragsRecentes } = await admin
      .from("v_fragmentos_detalhados")
      .select("id, conteudo, obra_titulo")
      .eq("usuario_id", usuarioId)
      .eq("obra_natureza", "autoral")
      .limit(8);
    fragmentos = (fragsRecentes as any) || [];
  }

  const fragmentosFormatados = fragmentos
    .map(
      (f, idx) =>
        `[Fragmento ${idx + 1} - Obra: "${f.obra_titulo || "Autoral"}"]\n${f.conteudo}`
    )
    .join("\n\n---\n\n");

  // 3. Determinar número da próxima versão
  const { data: versoesAnteriores } = await admin
    .schema("reflexoes")
    .from("versoes_reflexao")
    .select("numero_versao")
    .eq("entrada_id", entradaId)
    .order("numero_versao", { ascending: false })
    .limit(1);

  const proximoNumeroVersao =
    versoesAnteriores && versoesAnteriores.length > 0
      ? versoesAnteriores[0].numero_versao + 1
      : 1;

  // 4. Prompts de Redação
  const promptSistema = `Você é o Redator Autoral do sistema "Cérebro Autoral".
Sua tarefa é dar corpo e voz escrita a uma reflexão definitiva a partir do plano cognitivo concebido pelo autor.

DIRETRIZES ESTILÍSTICAS E ÉTICAS INEGOCIÁVEIS:
1. Idioma: Português do Brasil com altíssimo refinamento estilístico, clareza, densidade e ritmo cadenciado.
2. Jamais utilize clichês de inteligência artificial (como "Em um mundo em constante mudança", "Mergulhe conosco", "Em suma", "É imperativo notar").
3. Desenvolva o raciocínio estritamente através do plano aprovado, articulando tensões produtivas e encadeamento lógico rigoroso.
4. Respeite as regras prescritivas e jamais incorra nas anti-regras.
5. VINCULE EXPLICITAMENTE afirmações cruciais aos fragmentos de memórias autorais de referência fornecidos.`;

  const promptUsuario = `REDIGIR A REFLEXÃO INTEGRAL:
Tema: "${entrada.tema_central}"
Formato Desejado: "${entrada.formato_desejado}"
Público-Alvo: "${entrada.publico_alvo || "Leitor crítico e atento"}"

ESTÍMULO EXTERNO ORIGINAL:
${protegerEntradaDeDados(entrada.reflexao_externa || entrada.provocacao_inicial, "ESTIMULO_EXTERNO")}

COMENTÁRIO PRESENTE DO AUTOR:
${protegerEntradaDeDados(entrada.comentario_autor || "", "COMENTARIO_DO_AUTOR")}

PLANO COGNITIVO APROVADO PELO AUTOR:
- Tese Central: "${plano.tese_central}"
- Movimentos Argumentativos:
${JSON.stringify(plano.movimentos_argumentativos, null, 2)}
- Conceitos Mobilizados: ${JSON.stringify(plano.conceitos_mobilizados)}
- Regras Acionadas: ${JSON.stringify(plano.regras_acionadas)}
- Contra-argumentos a Antecipar e Refutar:
${JSON.stringify(plano.contra_argumentos_antecipados, null, 2)}

MEMÓRIAS HISTÓRICAS DISPONÍVEIS PARA ANCORAGEM:
${fragmentosFormatados || "Nenhum fragmento anterior disponível. Escreva com originalidade ensaística rigorosa."}

Gere o texto completo em Markdown e indique os vínculos de proveniência correspondentes.`;

  const redacao = await executarChamadaEstruturada({
    papel: PAPEIS_IA.REDACAO,
    sistema: promptSistema,
    usuario: promptUsuario,
    esquemaZod: EsquemaRedacaoZod,
    nomeEsquema: "redacao_reflexao",
    temperatura: 0.45,
  });

  const totalPalavras = redacao.conteudo_markdown
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  // 5. Inserir Versão no Banco
  const { data: versaoSalva, error: errVersao } = await admin
    .schema("reflexoes")
    .from("versoes_reflexao")
    .insert({
      entrada_id: entradaId,
      plano_id: planoId,
      usuario_id: usuarioId,
      numero_versao: proximoNumeroVersao,
      titulo_gerado: redacao.titulo_gerado,
      conteudo_markdown: redacao.conteudo_markdown,
      sumario_executivo: redacao.sumario_executivo,
      total_palavras: totalPalavras,
      estado: "em_auditoria",
    })
    .select()
    .single();

  if (errVersao || !versaoSalva) {
    throw new Error(`Falha ao salvar versão da reflexão: ${errVersao?.message}`);
  }

  // 6. Inserir Citações / Evidências de Proveniência
  if (redacao.citacoes_identificadas && redacao.citacoes_identificadas.length > 0) {
    for (const c of redacao.citacoes_identificadas) {
      const fragRef = fragmentos[c.fragmento_index - 1];

      await admin.schema("reflexoes").from("citacoes_evidencias").insert({
        versao_reflexao_id: versaoSalva.id,
        fragmento_id: fragRef ? fragRef.id : null,
        tipo_fonte: "nucleo_autoral",
        trecho_afirmacao_gerada: c.trecho_afirmacao_gerada,
        trecho_original_citado: c.trecho_original_citado,
        obra_titulo: fragRef?.obra_titulo || "Memória Autoral",
        grau_aderencia: c.grau_aderencia,
      });
    }
  }

  // 7. Atualizar estado da entrada para 'em_auditoria'
  await admin
    .schema("reflexoes")
    .from("entradas")
    .update({ estado: "em_auditoria" })
    .eq("id", entradaId);

  return versaoSalva;
}
