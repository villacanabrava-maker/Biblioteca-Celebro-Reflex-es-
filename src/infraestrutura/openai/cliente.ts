import OpenAI from 'openai'

let clienteCompartilhado: OpenAI | null = null

export function criarClienteOpenAI(): OpenAI {
  if (clienteCompartilhado) return clienteCompartilhado

  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY não está configurada no ambiente servidor.')
  }

  clienteCompartilhado = new OpenAI({
    apiKey,
    maxRetries: 0,
    timeout: 90_000,
  })

  return clienteCompartilhado
}
