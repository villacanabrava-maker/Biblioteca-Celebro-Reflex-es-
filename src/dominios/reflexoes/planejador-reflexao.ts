/**
 * Motor Cognitivo: Planejador de Reflexão
 * Orquestra o repertório do autor, taxonomia e regras para desenhar a arquitetura prévia de raciocínio.
 * Idioma: Português do Brasil
 */

import { OpenAI } from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { criarClienteAdmin } from "@/infraestrutura/supabase/cliente-admin";
import type { FormatoReflexao, MovimentoArgumentativo, ContraArgumentoAntecipado } from "@/tipos/reflexoes";

const EsquemaPlanoZod = z.object({
  tese_central: z.string().describe("Tese autoral profunda e provocativa que o autor defenderá"),
  movimentos_argumentativos: z.array(
    z.object({
      ordem: z.number(),
      tipo: z.string().describe("Ex: Abertura provocativa, Problematização ontológica, Contraste conceitual, Clímax argumentativo, Fechamento reflexivo"),
      descricao: z.string().describe("Como o autor desenvolve esse movimento específico"),
      dimensao_metodologica: z.string().nullable().describe("Dimensão do cérebro mobilizada, ex: formas_de_abertura, padroes_de_tensao"),
      conceitos_chave: z.array(z.string()).nullable().describe("Conceitos da taxonomia mobilizados nesta etapa"),
    })
  ),
  conceitos_mobilizados: z.array(z.string()).describe("Lista de termos ou códigos conceituais da taxonomia ativados"),
  regras_acionadas: z.array(z.string()).describe("Enunciados de regras prescritivas e anti-regras que regem a reflexão"),
  contra_argumentos_antecipados: z.array(
    z.object({
      objecao: z.string().describe("Objeção ou contra-argumento previsível de um interlocutor crítico"),
      resposta_autoral: z.string().describe("Como o autor refuta ou incorpora a tensão mantendo sua postura original"),
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
  objetivoComunicativo?: string | null;
  publicoAlvo?: string | null;
  formatoDesejado: FormatoReflexao;
  restricoesEspecificas?: string | null;
}) {
  const admin = criarClienteAdmin();

  // 1. Obter fragmentos autorais para embasamento (busca híbrida ou mais recentes)
  const { data: fragmentos } = await admin
    .from("v_fragmentos_detalhados")
    .select("id, conteudo, obra_titulo")
    .eq("usuario_id", usuarioId)
    .eq("obra_natureza", "autoral")
    .limit(10);

  const corpusAmostra = (fragmentos || [])
    .map((f, i) => `[Fragmento ${i + 1} - Obra: "${f.obra_titulo}"]\n${f.conteudo}`)
    .join("\n\n---\n\n");

  const fontesIds = (fragmentos || []).map((f) => f.id);

  // 2. Obter conceitos da taxonomia
  const { data: conceitos } = await admin
    .from("v_taxonomia_conceitos")
    .select("termo_preferencial, definicao, dominio")
    .limit(20);

  const conceitosTexto = (conceitos || [])
    .map((c) => `- ${c.termo_preferencial} (${c.dominio}): ${c.definicao}`)
    .join("\n");

  // 3. Obter regras ativas do Cérebro
  const { data: regras } = await admin
    .from("v_cerebro_regras_ativas")
    .select("tipo_regra, enunciado, peso")
    .eq("usuario_id", usuarioId)
    .limit(15);

  const regrasTexto = (regras || [])
    .map((r) => `- [${r.tipo_regra.toUpperCase()}] (Peso ${r.peso}/10): ${r.enunciado}`)
    .join("\n");

  const promptSistema = `Você é o Planejador Cognitivo do sistema "Memória Reflexiva" (motor "Cérebro Autoral").
Sua missão é conceber a arquitetura prévia de raciocínio de uma nova reflexão autoral a partir da intenção e provocação do autor.

DIRETRIZES INEGOCIÁVEIS:
1. Toda resposta deve ser formulada em Português do Brasil com sofisticação conceitual e rigor epistemológico.
2. O plano NÃO é o texto final, mas o mapa mental e arquitetônico que estrutura a tese, os movimentos dialéticos, as tensões e os contra-argumentos.
3. Respeite as regras prescritivas e jamais incorra nas anti-regras (vetos absolutos).
4. Mobilize os conceitos canônicos da taxonomia do autor.

TAXONOMIA DISPONÍVEL:
${conceitosTexto || "Nenhum conceito cadastrado previamente."}

CATÁLOGO DE REGRAS E ANTI-REGRAS DO AUTOR:
${regrasTexto || "Regra geral: escrita densa, sem clichês motivacionais, foco na precisão conceitual."}

CORPUS DE FRAGMENTOS AUTORAIS DE REFERÊNCIA:
${corpusAmostra || "Sem fragmentos prévios. Adote tom ensaístico denso e analítico."}`;

  const promptUsuario = `PLANEJE A REFLEXÃO COM BASE NA SEGUINTE INTENÇÃO DO AUTOR:
- Título Proposto: "${titulo}"
- Tema Central: "${temaCentral}"
- Provocação Inicial: "${provocacaoInicial}"
- Formato Desejado: "${formatoDesejado}"
- Objetivo Comunicativo: "${objetivoComunicativo || "Provocação reflexiva e defesa de tese"}"
- Público-Alvo: "${publicoAlvo || "Leitores atentos e interlocutores críticos"}"
- Restrições Específicas: "${restricoesEspecificas || "Nenhuma informada"}"

Gere a estrutura completa do Plano de Reflexão respeitando rigorosamente o schema estruturado.`;

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const resposta = await openai.beta.chat.completions.parse({
    model: "gpt-4o",
    messages: [
      { role: "system", content: promptSistema },
      { role: "user", content: promptUsuario },
    ],
    response_format: zodResponseFormat(EsquemaPlanoZod, "plano_reflexao"),
    temperature: 0.4,
  });

  const planoGerado = resposta.choices[0]?.message.parsed;

  if (!planoGerado) {
    throw new Error("O modelo não retornou um plano de reflexão estruturado válido.");
  }

  // 4. Gravar o plano no Supabase Postgres
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
