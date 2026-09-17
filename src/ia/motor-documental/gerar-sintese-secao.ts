import { z } from 'zod'
import { zodTextFormat } from 'openai/helpers/zod'
import { MODELO_IA_ANALISE } from '@/infraestrutura/openai/modelos'

const SinteseSecaoSchema = z
  .object({
    sintese: z.string().min(1),
  })
  .strict()

const FORMATO_SINTESE_SECAO = zodTextFormat(SinteseSecaoSchema, 'sintese_secao')

export type ResultadoGerarSinteseSecao =
  | {
      ok: true
      sintese: string
      tokensEntrada: number | null
      tokensSaida: number | null
      duracaoMs: number
    }
  | {
      ok: false
      motivo: string
      duracaoMs: number
    }

// Interface mínima exigida do cliente OpenAI, para permitir testes com um
// cliente falso sem chamar a API real nem exigir OPENAI_API_KEY.
export type ClienteRespostasIA = {
  responses: {
    parse(params: {
      model: string
      instructions: string
      input: string
      text: { format: unknown }
      store: boolean
    }): Promise<{
      output_parsed: unknown
      output_text?: string
      usage?: { input_tokens?: number | null; output_tokens?: number | null } | null
    }>
  }
}

/**
 * Chama o modelo de análise para sintetizar o texto de uma seção. O texto
 * de entrada é tratado como DADO no prompt (nunca como instrução) — ver
 * `sistema.prompts` código `sintese_secao`. Não decide nada sobre
 * persistência: apenas retorna a síntese validada ou o motivo da falha.
 */
export async function gerarSinteseSecao({
  cliente,
  instrucoes,
  textoSecao,
}: {
  cliente: ClienteRespostasIA
  instrucoes: string
  textoSecao: string
}): Promise<ResultadoGerarSinteseSecao> {
  const inicio = Date.now()

  try {
    const resposta = await cliente.responses.parse({
      model: MODELO_IA_ANALISE,
      instructions: instrucoes,
      input: textoSecao,
      text: { format: FORMATO_SINTESE_SECAO },
      store: false,
    })

    const duracaoMs = Date.now() - inicio
    const validacao = SinteseSecaoSchema.safeParse(resposta.output_parsed)

    if (!validacao.success) {
      return { ok: false, motivo: 'resposta_fora_do_schema', duracaoMs }
    }

    return {
      ok: true,
      sintese: validacao.data.sintese,
      tokensEntrada: resposta.usage?.input_tokens ?? null,
      tokensSaida: resposta.usage?.output_tokens ?? null,
      duracaoMs,
    }
  } catch (error) {
    const duracaoMs = Date.now() - inicio
    const motivo = error instanceof Error ? error.message : 'erro_desconhecido'
    return { ok: false, motivo, duracaoMs }
  }
}
