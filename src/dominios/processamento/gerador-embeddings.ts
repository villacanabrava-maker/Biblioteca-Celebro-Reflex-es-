import { obterClienteOpenAI } from "@/ia/cliente";

export interface RespostaEmbeddingsLote {
  vetores: number[][];
  tokensUtilizados: number;
}

/**
 * Gera vetores de embedding canônicos de 1536 dimensões via OpenAI text-embedding-3-small
 * com processamento em lotes (batching) e tratamento de falhas.
 */
export async function gerarEmbeddingsEmLote(
  textos: string[],
  tamanhoLote: number = 32
): Promise<RespostaEmbeddingsLote> {
  const openai = obterClienteOpenAI();
  const todosVetores: number[][] = [];
  let totalTokens = 0;

  for (let i = 0; i < textos.length; i += tamanhoLote) {
    const lote = textos.slice(i, i + tamanhoLote).map((t) => t.replace(/\n/g, " ").trim());

    if (lote.length === 0) continue;

    // Retry com backoff exponencial
    let tentativa = 0;
    const maxTentativas = 3;
    let resposta = null;

    while (tentativa < maxTentativas) {
      try {
        resposta = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: lote,
          dimensions: 1536,
        });
        break;
      } catch (erro: any) {
        tentativa++;
        console.warn(`Tentativa ${tentativa}/${maxTentativas} de embedding falhou:`, erro.message);
        if (tentativa >= maxTentativas) {
          throw new Error(`Falha ao gerar embeddings na OpenAI: ${erro.message}`);
        }
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, tentativa)));
      }
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
