import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { obterClienteOpenAI } from "@/ia/cliente";
import { criarClienteAdmin } from "@/infraestrutura/supabase/cliente-admin";

const analiseDimensaoSchema = z.object({
  caracteristicas: z.array(
    z.object({
      titulo: z.string().describe("Título preciso da característica metodológica"),
      descricao: z.string().describe("Descrição densa e analítica de como o autor opera nesta dimensão"),
      formula_metodologica: z.string().describe("Fórmula sequencial do pensamento (ex: Ponto A -> Tensão -> Ponto B)"),
      regras: z.array(
        z.object({
          tipo: z.enum(["prescritiva", "proscritiva", "preferencia", "restricao_estilo"]),
          enunciado: z.string().describe("Comando claro da regra ou anti-regra"),
          explicacao: z.string().describe("Fundamentação epistêmica da regra"),
        })
      ),
      evidencias: z.array(
        z.object({
          fragmento_id: z.string().describe("ID exato do fragmento textual analisado"),
          trecho_citado: z.string().describe("Citação literal exata contida no fragmento"),
          explicacao: z.string().describe("Como este trecho comprova a característica"),
          forca_evidencia: z.number().min(0).max(1).describe("Peso comprobatório de 0 a 1"),
        })
      ),
    })
  ),
});

export interface ParametrosAnaliseDimensao {
  dimensaoId: string;
  dimensaoCodigo: string;
  dimensaoNome: string;
  dimensaoDescricao: string;
  usuarioId: string;
  fragmentos: { id: string; conteudo: string; obra_titulo: string }[];
}

/**
 * Analisa fragmentos autorais através do modelo gpt-4o com Structured Outputs
 * para extrair características metodológicas, fórmulas de pensamento, regras e evidências.
 */
export async function analisarDimensaoComIA({
  dimensaoId,
  dimensaoCodigo,
  dimensaoNome,
  dimensaoDescricao,
  usuarioId,
  fragmentos,
}: ParametrosAnaliseDimensao) {
  if (fragmentos.length === 0) {
    throw new Error("Nenhum fragmento fornecido para análise da dimensão.");
  }

  const openai = obterClienteOpenAI();
  const admin = criarClienteAdmin();

  const fragmentosFormatados = fragmentos
    .slice(0, 10)
    .map(
      (f, idx) => `[FRAGMENTO_ID: ${f.id}] (Obra: ${f.obra_titulo})\n${f.conteudo}\n---`
    )
    .join("\n");

  const promptSistema = `
Você é o Analista Metodológico Central do Cérebro Autoral.
Sua missão NÃO é elogiar o texto nem descrever estilo literário de forma genérica ("escreve com paixão", "usa belas palavras").
Sua missão é mapear a ARQUITETURA DE PENSAMENTO E EXPRESSÃO DO AUTOR para a seguinte dimensão canônica:

Dimensão: "${dimensaoNome}" (${dimensaoCodigo})
Escopo Canônico: "${dimensaoDescricao}"

Diretrizes Obrigatórias:
1. Identifique características específicas e distintivas (fórmulas conceituais, movimentos argumentativos).
2. Extraia regras PRESCRITIVAS (o que o autor busca sistematicamente fazer) e PROSCRITIVAS / ANTI-REGRAS (o que o autor rejeita, evita ou nunca faz).
3. Cada característica DEVE conter evidências literais exatas extraídas dos fragmentos fornecidos, referenciando o respectivo [FRAGMENTO_ID].
4. Se o fragmento não trouxer evidências fortes para esta dimensão, produza apenas características estritamente comprováveis.
`.trim();

  const response = await openai.beta.chat.completions.parse({
    model: "gpt-4o",
    messages: [
      { role: "system", content: promptSistema },
      {
        role: "user",
        content: `Analise os seguintes fragmentos do autor e extraia as características e regras para a dimensão "${dimensaoNome}":\n\n${fragmentosFormatados}`,
      },
    ],
    response_format: zodResponseFormat(analiseDimensaoSchema, "analise_dimensao"),
    temperature: 0.2, // Baixa temperatura para fidelidade epistemológica
  });

  const parsed = response.choices[0].message.parsed;

  if (!parsed || !parsed.caracteristicas) {
    throw new Error("Falha ao analisar a dimensão: resposta estruturada vazia.");
  }

  // Persistir características, regras e evidências atomicamente
  let totalCaracteristicasCriadas = 0;
  let totalRegrasCriadas = 0;
  let totalEvidenciasCriadas = 0;

  for (const carac of parsed.caracteristicas) {
    // 1. Inserir Característica
    const { data: novaCarac, error: errCarac } = await admin
      .schema("cerebro_autoral")
      .from("caracteristicas")
      .insert({
        dimensao_id: dimensaoId,
        usuario_id: usuarioId,
        titulo: carac.titulo,
        descricao: carac.descricao,
        formula_metodologica: carac.formula_metodologica,
        origem: "nucleo_autoral",
        confianca_calculada: 0.92,
        total_evidencias: carac.evidencias.length,
        total_contraevidencias: 0,
        total_obras_distintas: 1,
        estado_revisao: "confirmada",
      })
      .select()
      .single();

    if (errCarac || !novaCarac) {
      console.error("Erro ao persistir característica:", errCarac);
      continue;
    }

    totalCaracteristicasCriadas++;

    // 2. Inserir Regras vinculadas
    for (const regra of carac.regras) {
      await admin
        .schema("cerebro_autoral")
        .from("regras")
        .insert({
          usuario_id: usuarioId,
          dimensao_id: dimensaoId,
          caracteristica_id: novaCarac.id,
          tipo_regra: regra.tipo,
          enunciado: regra.enunciado,
          explicacao: regra.explicacao,
          peso: 1.0,
          ativa: true,
        });

      totalRegrasCriadas++;
    }

    // 3. Inserir Evidências comprovatórias vinculadas
    for (const evid of carac.evidencias) {
      await admin
        .schema("processamento")
        .from("evidencias")
        .insert({
          usuario_id: usuarioId,
          fragmento_id: evid.fragmento_id,
          dimensao_id: dimensaoId,
          trecho_citado: evid.trecho_citado,
          explicacao: evid.explicacao,
          forca_evidencia: evid.forca_evidencia,
          estado_revisao: "confirmada",
        });

      totalEvidenciasCriadas++;
    }
  }

  return {
    sucesso: true,
    totalCaracteristicas: totalCaracteristicasCriadas,
    totalRegras: totalRegrasCriadas,
    totalEvidencias: totalEvidenciasCriadas,
  };
}
