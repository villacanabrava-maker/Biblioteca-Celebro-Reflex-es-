import { obterClienteOpenAI } from "@/ia/cliente";

export interface ResultadoTranscricaoAudio {
  texto: string;
  idiomas: unknown[];
  totalCaracteres: number;
  totalPalavras: number;
}

export async function transcreverAudioBuffer({
  buffer,
  nomeArquivo,
  mimeType,
  prompt,
}: {
  buffer: Buffer;
  nomeArquivo: string;
  mimeType: string;
  prompt?: string;
}): Promise<ResultadoTranscricaoAudio> {
  const limiteTranscricao = 25 * 1024 * 1024;

  if (!mimeType.toLowerCase().startsWith("audio/")) {
    throw new Error("O arquivo informado não possui um tipo de áudio compatível.");
  }

  if (buffer.byteLength > limiteTranscricao) {
    throw new Error("O áudio excede o limite de 25 MB da transcrição.");
  }

  const arquivo = new File([buffer], nomeArquivo, { type: mimeType });
  const openai = obterClienteOpenAI();

  const resposta = await (openai.audio.transcriptions.create as any)({
    file: arquivo,
    model: "gpt-transcribe",
    prompt:
      prompt ||
      "Transcreva fielmente a fala. Preserve nomes próprios, termos conceituais e pontuação natural. Não resuma e não acrescente conteúdo.",
  });

  const texto = String(resposta?.text || "").trim();
  if (!texto) {
    throw new Error("O áudio foi recebido, mas nenhuma fala pôde ser transcrita.");
  }

  return {
    texto,
    idiomas: Array.isArray(resposta?.languages) ? resposta.languages : [],
    totalCaracteres: texto.length,
    totalPalavras: texto.split(/\s+/).filter(Boolean).length,
  };
}
