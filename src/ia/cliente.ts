import OpenAI from "openai";

let openaiCliente: OpenAI | null = null;

export function obterClienteOpenAI(): OpenAI {
  if (!openaiCliente) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY não encontrada no ambiente do servidor.");
    }
    openaiCliente = new OpenAI({ apiKey });
  }
  return openaiCliente;
}
