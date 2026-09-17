/**
 * Motor Cognitivo: Redator Autoral de Reflexão
 * Redige a reflexão completa seguindo o plano de raciocínio, voz autoral e vinculando proveniência de evidências.
 * Idioma: Português do Brasil
 */

import { OpenAI } from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { criarClienteAdmin } from "@/infraestrutura/supabase/cliente-admin";

const EsquemaRedacaoZod = z.object({
  titulo_gerado: z.string().describe("Título definitivo, autoral e expressivo para a reflexão"),
  sumario_executivo: z.string().describe("Síntese executiva densa e provocativa do ensaio"),
  conteudo_markdown: z.string().describe("Texto integral da reflexão redigido em Markdown"),
  citacoes_identificadas: z.array(
    z.object({
      fragmento_index: z.number().describe("Índice do fragmento autoral (1-based) que embasa este trecho"),
      trecho_afirmacao_gerada: z.string().describe("Trecho ou argumento formulado no texto gerado"),
      trecho_original_citado: z.string().describe("Trecho correspondente do fragmento original do autor"),
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

  // Se não houver fragmentos específicos no plano, buscar os fragmentos autorais mais recentes
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
        `[Fragmento ${idx + 1} - ID: ${f.id} - Obra: "${f.obra_titulo || "Autoral"}"]\n${f.conteudo}`
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

  // 4. Prompt de Redação Autoral
  const promptSistema = `Você é o Redator Central do sistema "Memória Reflexiva" (motor "Cérebro Autoral").
Sua tarefa é dar corpo e voz escrita a uma reflexão autoral a partir do plano cognitivo concebido pelo autor.

DIRETRIZES ESTILÍSTICAS E ÉTICAS INEGOCIÁVEIS:
1. Idioma: Português do Brasil com altíssimo refinamento estilístico, clareza e ritmo cadenciado.
2. Não utilize clichês de inteligência artificial (como "Em um mundo em constante mudança", "Mergulhe conosco", "Em suma", "É imperativo notar").
3. Desenvolva o raciocínio através de tensões produtivas, metáforas precisas e encadeamento lógico rigoroso.
4. Respeite as regras prescritivas e jamais viole as anti-regras.
5. VINCULE EXPLICITAMENTE suas afirmações aos fragmentos autorais de referência fornecidos. Cada tese de peso deve ancorar-se no pensamento já registrado pelo autor.`;

  const promptUsuario = `REDIGIR A REFLEXÃO:
Tema: "${entrada.tema_central}"
Provocação Original: "${entrada.provocacao_inicial}"
Formato Desejado: "${entrada.formato_desejado}"
Público-Alvo: "${entrada.publico_alvo || "Geral reflexivo"}"

PLANO COGNITIVO APROVADO:
- Tese Central: "${plano.tese_central}"
- Movimentos Argumentativos:
${JSON.stringify(plano.movimentos_argumentativos, null, 2)}
- Conceitos Mobilizados: ${JSON.stringify(plano.conceitos_mobilizados)}
- Regras Acionadas: ${JSON.stringify(plano.regras_acionadas)}
- Contra-argumentos a Antecipar:
${JSON.stringify(plano.contra_argumentos_antecipados, null, 2)}

FRAGMENTOS AUTORAIS DISPONÍVEIS PARA EMBASAMENTO E CITAÇÃO:
${fragmentosFormatados || "Nenhum fragmento registrado. Escreva em tom ensaístico rigoroso."}

Gere o texto completo em Markdown e aponte os trechos de proveniência correspondentes.`;

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const resposta = await openai.beta.chat.completions.parse({
    model: "gpt-4o",
    messages: [
      { role: "system", content: promptSistema },
      { role: "user", content: promptUsuario },
    ],
    response_format: zodResponseFormat(EsquemaRedacaoZod, "redacao_reflexao"),
    temperature: 0.5,
  });

  const redacao = resposta.choices[0]?.message.parsed;

  if (!redacao) {
    throw new Error("O redator não retornou uma redação estruturada válida.");
  }

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
        obra_titulo: fragRef?.obra_titulo || "Corpus Autoral",
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
