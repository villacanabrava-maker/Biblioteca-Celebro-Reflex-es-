/**
 * Agente Auditor Crítico Independente
 * Avalia o rascunho produzido contra a taxonomia, dimensões metodológicas, catálogo de regras e evidências.
 * Emite veredito, notas por pilar, aponta infrações e recomendações concretas.
 *
 * Idioma: Português do Brasil
 */

import { z } from "zod";
import { criarClienteAdmin } from "@/infraestrutura/supabase/cliente-admin";
import { executarChamadaEstruturada, protegerEntradaDeDados, PAPEIS_IA } from "@/ia/orquestrador";


const EsquemaAuditoriaZod = z.object({
  veredito: z.enum(["aprovado", "ressalvas", "rejeitado"]).describe("Veredito final do auditor"),
  pontuacao_geral: z.number().min(0).max(1).describe("Nota geral de fidelidade e rigor (0.0 a 1.0)"),
  pontuacao_fidelidade_ontologica: z.number().min(0).max(1).describe("Aderência aos conceitos e taxonomia do autor"),
  pontuacao_fidelidade_metodologica: z.number().min(0).max(1).describe("Aderência ao método de argumentação e pensamento"),
  pontuacao_precisao_evidencias: z.number().min(0).max(1).describe("Ausência de alucinação e rigor nas referências"),
  pontuacao_expressao_estilo: z.number().min(0).max(1).describe("Voz autoral, ritmo e ausência de chavões de IA"),
  pontuacao_anti_regras: z.number().min(0).max(1).describe("Respeito aos vetos e proscrições absolutas"),
  regras_violadas: z.array(
    z.object({
      enunciado: z.string().describe("Regra ou anti-regra infringida"),
      trecho_infrator: z.string().describe("Trecho específico do texto que cometeu o desvio"),
      motivo: z.string().describe("Por que esse trecho viola a regra"),
      gravidade: z.enum(["alta", "media", "baixa"]),
    })
  ),
  riscos_alucinacao: z.array(
    z.object({
      trecho_afirmacao: z.string().describe("Afirmação que carece de evidência ou extrapola o corpus autoral"),
      explicacao: z.string().describe("Análise do risco de inconsistência empírica ou teórica"),
      grau_risco: z.enum(["alto", "medio", "baixo"]),
    })
  ),
  recomendacoes_melhoria: z.array(
    z.object({
      foco: z.string().describe("Ex: Ritmo frasal, Conceituação, Clareza do clímax"),
      sugestao: z.string().describe("Como o autor pode refinar o trecho para atingir perfeição autoral"),
      prioridade: z.enum(["imediata", "desejavel"]),
    })
  ),
  analise_critica_completa: z.string().describe("Parecer dissertativo detalhado do auditor sobre o ensaio"),
});

export async function auditarVersaoReflexao({
  versaoId,
  usuarioId,
}: {
  versaoId: string;
  usuarioId: string;
}) {
  const admin = criarClienteAdmin();

  // 1. Carregar a versão do texto e os dados da entrada e plano
  const { data: versao, error: errVersao } = await admin
    .schema("reflexoes")
    .from("versoes_reflexao")
    .select("*")
    .eq("id", versaoId)
    .single();

  if (errVersao || !versao) {
    throw new Error("Versão da reflexão não encontrada para auditoria.");
  }

  // 2. Carregar regras e anti-regras ativas
  const { data: regras } = await admin
    .from("v_cerebro_regras_ativas")
    .select("tipo_regra, enunciado, explicacao, peso")
    .eq("usuario_id", usuarioId);

  const regrasFormatadas = (regras || [])
    .map((r) => `- [${r.tipo_regra.toUpperCase()}] (Peso ${r.peso}/10): "${r.enunciado}" (${r.explicacao || ""})`)
    .join("\n");

  // 3. Carregar citações / evidências vinculadas
  const { data: citacoes } = await admin
    .schema("reflexoes")
    .from("citacoes_evidencias")
    .select("*")
    .eq("versao_reflexao_id", versaoId);

  const citacoesFormatadas = (citacoes || [])
    .map(
      (c, idx) =>
        `[Evidência ${idx + 1}]\nAfirmação no texto: "${c.trecho_afirmacao_gerada}"\nOriginal citado: "${c.trecho_original_citado}" (Obra: ${c.obra_titulo || "Autoral"})`
    )
    .join("\n\n");

  // 4. Prompt do Auditor Crítico Independente
  const promptSistema = `Você é o Auditor Crítico Independente da plataforma "Cérebro Autoral / Memória Reflexiva".
Sua missão NÃO É ser complacente ou elogioso. Você atua como o crítico mais rigoroso, atento e implacável do autor.

SEU OBJETIVO:
Garantir que NADA que desrespeite a metodologia, o vocabulário, a taxonomia, as regras ou a verdade factual do autor passe despercebido.

CRITÉRIOS DE AUDITORIA:
1. Fidelidade Ontológica: Os conceitos utilizados preservam o sentido autêntico do autor ou foram vulgarizados?
2. Fidelidade Metodológica: A argumentação avança com a cadência e rigor autoral ou caiu em esquemas previsíveis?
3. Precisão de Evidências: Cada tese tem lastro nos fragmentos? Há risco de extrapolação ou alucinação factual?
4. Expressão & Estilo: Há cacoetes de linguagem genérica de LLM (ex: "Em suma", "É imperativo considerar", "Uma tapeçaria de ideias")? Se houver, aponte e puna a nota.
5. Anti-regras: Houve violação de qualquer proscrição ou veto explícito? Se sim, marque a infração e considere veredito de ressalva ou rejeição.

VEREDITOS:
- "aprovado": Se nota geral >= 0.85 e sem violações graves.
- "ressalvas": Se nota geral entre 0.65 e 0.84, exigindo refinamentos pontuais.
- "rejeitado": Se nota geral < 0.65 ou qualquer anti-regra for quebrada diretamente.`;

  const promptUsuario = `AUDITE A SEGUINTE VERSÃO GERADA:
Título: "${versao.titulo_gerado}"
Total de Palavras: ${versao.total_palavras}

TEXTO DA REFLEXÃO:
${protegerEntradaDeDados(versao.conteudo_markdown, "TEXTO_REFLEXAO_AUDITADA")}

CATÁLOGO DE REGRAS E ANTI-REGRAS A VERIFICAR:
${regrasFormatadas || "Nenhuma regra cadastrada. Aplicar padrão autoral de alta densidade e rigor crítico."}

EVIDÊNCIAS DE SUPORTE APRESENTADAS:
${citacoesFormatadas || "Nenhuma evidência vinculada formalmente."}

Emita seu relatório de auditoria completo e objetivo conforme o schema estruturado.`;

  const auditoria = await executarChamadaEstruturada({
    papel: PAPEIS_IA.AUDITORIA,
    sistema: promptSistema,
    usuario: promptUsuario,
    esquemaZod: EsquemaAuditoriaZod,
    nomeEsquema: "relatorio_auditoria",
    temperatura: 0.15,
  });

  // 5. Gravar o Relatório de Auditoria no Supabase Postgres
  const { data: relatorioSalvo, error: errRelatorio } = await admin
    .schema("auditoria")
    .from("relatorios_auditoria")
    .insert({
      versao_reflexao_id: versaoId,
      usuario_id: usuarioId,
      veredito: auditoria.veredito,
      pontuacao_geral: auditoria.pontuacao_geral,
      pontuacao_fidelidade_ontologica: auditoria.pontuacao_fidelidade_ontologica,
      pontuacao_fidelidade_metodologica: auditoria.pontuacao_fidelidade_metodologica,
      pontuacao_precisao_evidencias: auditoria.pontuacao_precisao_evidencias,
      pontuacao_expressao_estilo: auditoria.pontuacao_expressao_estilo,
      pontuacao_anti_regras: auditoria.pontuacao_anti_regras,
      regras_violadas: auditoria.regras_violadas,
      riscos_alucinacao: auditoria.riscos_alucinacao,
      recomendacoes_melhoria: auditoria.recomendacoes_melhoria,
      analise_critica_completa: auditoria.analise_critica_completa,
    })
    .select()
    .single();

  if (errRelatorio || !relatorioSalvo) {
    throw new Error(`Falha ao salvar relatório de auditoria: ${errRelatorio?.message}`);
  }

  // 6. Atualizar estado da versão
  const novoEstadoVersao = auditoria.veredito === "aprovado" ? "aprovado" : "auditado";
  await admin
    .schema("reflexoes")
    .from("versoes_reflexao")
    .update({ estado: novoEstadoVersao })
    .eq("id", versaoId);

  return relatorioSalvo;
}
