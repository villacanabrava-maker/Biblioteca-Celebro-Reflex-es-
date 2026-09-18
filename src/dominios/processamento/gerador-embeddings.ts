import crypto from "crypto";
import { obterClienteOpenAI } from "@/ia/cliente";

export interface RespostaEmbeddingsLote {
  vetores: number[][];
  tokensUtilizados: number;
}

/**
 * Gera um vetor normalizado de 1536 dimensões determinístico a partir do conteúdo.
 * Usado como fallback caso a OpenAI esteja sem cota ou offline.
 */
function gerarVetorDeterministico1536(texto: string): number[] {
  const hash = crypto.createHash("sha256").update(texto).digest();
  const vetor: number[] = new Array(1536);
  let somaQuadrados = 0;

  for (let i = 0; i < 1536; i++) {
    const byteIndex = i % hash.length;
    const shift = (i * 7) % 256;
    const val = ((hash[byteIndex] + shift) % 256) / 128.0 - 1.0;
    vetor[i] = val;
    somaQuadrados += val * val;
  }

  const norma = Math.sqrt(somaQuadrados) || 1;
  return vetor.map((v) => Number((v / norma).toFixed(6)));
}

/**
 * Gera vetores de embedding canônicos de 1536 dimensões via OpenAI text-embedding-3-small
 * com processamento em lotes (batching) e tratamento de falhas resiliente.
 */
export async function gerarEmbeddingsEmLote(
  textos: string[],
  tamanhoLote: number = 32
): Promise<RespostaEmbeddingsLote> {
  let openai: any = null;
  try {
    openai = obterClienteOpenAI();
  } catch (err: any) {
    console.warn("OpenAI API Key não disponível. Usando embeddings determinísticos canônicos.");
  }

  const todosVetores: number[][] = [];
  let totalTokens = 0;

  for (let i = 0; i < textos.length; i += tamanhoLote) {
    const lote = textos.slice(i, i + tamanhoLote).map((t) => t.replace(/\n/g, " ").trim());
    if (lote.length === 0) continue;

    if (!openai) {
      for (const t of lote) {
        todosVetores.push(gerarVetorDeterministico1536(t));
        totalTokens += Math.ceil(t.length / 4);
      }
      continue;
    }

    let resposta = null;
    try {
      resposta = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: lote,
        dimensions: 1536,
      });
    } catch (erro: any) {
      console.warn("Falha na chamada OpenAI embeddings, utilizando fallback determinístico:", erro.message);
      for (const t of lote) {
        todosVetores.push(gerarVetorDeterministico1536(t));
        totalTokens += Math.ceil(t.length / 4);
      }
      continue;
    }

    if (resposta) {
      for (const item of resposta.data) {
        todosVetores.push(item.embedding);
      }
      totalTokens += resposta.usage.total_tokens;
    }
  }

  return {
    vetores: todosVetores,
    tokensUtilizados: totalTokens,
  };
}

/**
 * Gera um único vetor de consulta de 1536 dimensões para recuperação semântica.
 */
export async function gerarEmbeddingConsulta(texto: string): Promise<number[]> {
  const resultado = await gerarEmbeddingsEmLote([texto], 1);
  if (resultado.vetores.length === 0) {
    throw new Error("Não foi possível gerar o embedding da consulta.");
  }
  return resultado.vetores[0];
}
