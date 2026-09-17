// Importação resiliente de módulo CJS no ecossistema Next.js
const pdfParse = require("pdf-parse");

export interface ResultadoExtracaoTexto {
  textoCompleto: string;
  totalPaginas: number;
  totalPalavras: number;
  totalCaracteres: number;
  metadadosArquivo: Record<string, unknown>;
}

/**
 * Normaliza o texto extraído removendo ruídos, quebras impróprias e caracteres nulos.
 */
function normalizarTexto(texto: string): string {
  return texto
    .replace(/\0/g, "") // Remove bytes nulos
    .replace(/\r\n/g, "\n") // Padroniza quebras de linha
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ") // Remove múltiplos espaços horizontais
    .replace(/\n{3,}/g, "\n\n") // Máximo de 2 quebras consecutivas
    .trim();
}

/**
 * Extrai o texto contínuo e metadados estruturais a partir do buffer de um arquivo.
 */
export async function extrairTextoDeBuffer(
  buffer: Buffer,
  mimeType: string,
  nomeArquivo?: string
): Promise<ResultadoExtracaoTexto> {
  const mime = (mimeType || "").toLowerCase();
  const nome = (nomeArquivo || "").toLowerCase();

  let textoBruto = "";
  let totalPaginas = 1;
  let metadados: Record<string, unknown> = {};

  // Verifica magic bytes para confirmar se é PDF binário real (%PDF-)
  const ehPdfReal = buffer.subarray(0, 5).toString().startsWith("%PDF");

  if (ehPdfReal) {
    try {
      const dadosPdf = await pdfParse(buffer);
      textoBruto = dadosPdf.text;
      totalPaginas = dadosPdf.numpages || 1;
      metadados = {
        versaoPdf: dadosPdf.version,
        info: dadosPdf.info,
      };
    } catch (err: any) {
      console.warn("Falha ao analisar PDF binário, tentando extração textual:", err.message);
      textoBruto = buffer.toString("utf-8");
    }
  } else {
    // Arquivos de texto (.txt, .md), JSON ou buffers textuais UTF-8
    textoBruto = buffer.toString("utf-8");
    const palavras = textoBruto.split(/\s+/).filter(Boolean).length;
    totalPaginas = Math.max(1, Math.ceil(palavras / 300));
  }

  const textoLimpo = normalizarTexto(textoBruto);
  const totalPalavras = textoLimpo ? textoLimpo.split(/\s+/).filter(Boolean).length : 0;
  const totalCaracteres = textoLimpo.length;

  return {
    textoCompleto: textoLimpo,
    totalPaginas,
    totalPalavras,
    totalCaracteres,
    metadadosArquivo: metadados,
  };
}
