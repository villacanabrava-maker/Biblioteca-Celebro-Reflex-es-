import * as tus from "tus-js-client";

export interface OpcoesUploadTus {
  arquivo: File;
  caminhoDestino: string;
  bucket?: string;
  tokenAutenticacao?: string;
  aoProgredir?: (porcentagem: number, bytesEnviados: number, bytesTotal: number) => void;
  aoSucesso?: (caminhoFinal: string) => void;
  aoErro?: (erro: Error) => void;
}

/**
 * Calcula o hash criptográfico SHA-256 do arquivo no navegador do usuário
 * para auditoria, integridade e verificação de duplicação.
 */
export async function calcularHashSha256(arquivo: File): Promise<string> {
  const buffer = await arquivo.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(digest));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Inicia o upload direto e resumível via TUS para o Supabase Storage.
 * O arquivo NUNCA passa pelo servidor da aplicação (Next.js/Vercel),
 * eliminando o limite de 4.5MB e suportando arquivos de centenas de megabytes.
 */
export function iniciarUploadTus({
  arquivo,
  caminhoDestino,
  bucket = "originais-biblioteca",
  tokenAutenticacao,
  aoProgredir,
  aoSucesso,
  aoErro,
}: OpcoesUploadTus): tus.Upload {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Variáveis de ambiente do Supabase não configuradas no cliente.");
  }

  const endpoint = `${supabaseUrl}/storage/v1/upload/resumable`;
  const bearerToken = tokenAutenticacao || anonKey;

  const upload = new tus.Upload(arquivo, {
    endpoint,
    retryDelays: [0, 1000, 3000, 5000],
    headers: {
      authorization: `Bearer ${bearerToken}`,
      apikey: anonKey,
      "x-upsert": "true",
    },
    uploadDataDuringCreation: true,
    removeFingerprintOnSuccess: true,
    metadata: {
      bucketName: bucket,
      objectName: caminhoDestino,
      contentType: arquivo.type || "application/octet-stream",
      cacheControl: "3600",
    },
    chunkSize: 6 * 1024 * 1024, // 6 MB por chunk para transmissão resiliente
    onError: (error) => {
      console.error("Erro no upload TUS:", error);
      aoErro?.(error);
    },
    onProgress: (bytesUploaded, bytesTotal) => {
      const porcentagem = Math.round((bytesUploaded / bytesTotal) * 100);
      aoProgredir?.(porcentagem, bytesUploaded, bytesTotal);
    },
    onSuccess: () => {
      aoSucesso?.(caminhoDestino);
    },
  });

  // Checa uploads prévios incompletos e inicia
  upload.findPreviousUploads().then((previousUploads) => {
    if (previousUploads.length > 0) {
      upload.resumeFromPreviousUpload(previousUploads[0]);
    }
    upload.start();
  });

  return upload;
}
