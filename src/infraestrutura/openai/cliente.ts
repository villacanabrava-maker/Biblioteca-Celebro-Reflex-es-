import OpenAI from 'openai'

export function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error(
      'OpenAI não configurada. Defina OPENAI_API_KEY no ambiente servidor.'
    )
  }

  return new OpenAI({ apiKey })
}
