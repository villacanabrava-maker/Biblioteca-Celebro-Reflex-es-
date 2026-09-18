import zlib from "zlib";

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
 * Extrai texto limpo de arquivo Word .docx (ZIP contendo word/document.xml).
 */
function extrairTextoDeDocx(buffer: Buffer): string {
  let offset = 0;
  while (offset < buffer.length - 4) {
    if (buffer.readUInt32LE(offset) === 0x04034b50) {
      const compressionMethod = buffer.readUInt16LE(offset + 8);
      const compressedSize = buffer.readUInt32LE(offset + 18);
      const fileNameLength = buffer.readUInt16LE(offset + 26);
      const extraFieldLength = buffer.readUInt16LE(offset + 28);
      
      const fileNameStart = offset + 30;
      const fileName = buffer.subarray(fileNameStart, fileNameStart + fileNameLength).toString("utf-8");
      const fileDataStart = fileNameStart + fileNameLength + extraFieldLength;
      
      if (fileName === "word/document.xml") {
        const compressedData = buffer.subarray(fileDataStart, fileDataStart + compressedSize);
        let xml = "";
        if (compressionMethod === 8) {
          xml = zlib.inflateRawSync(compressedData).toString("utf-8");
        } else if (compressionMethod === 0) {
          xml = compressedData.toString("utf-8");
        }
        
        const paragrafos = xml.split(/<\/w:p>/);
        const linhas: string[] = [];
        for (const p of paragrafos) {
          const textos = p.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
          if (textos) {
            const linha = textos
              .map((t) => t.replace(/<w:t[^>]*>/, "").replace(/<\/w:t>/, ""))
              .join("");
            if (linha.trim()) {
              linhas.push(linha.trim());
            }
          }
        }
        return linhas.join("\n\n");
      }
      offset = fileDataStart + compressedSize;
    } else {
      offset++;
    }
  }
  return "";
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
  const ehZipReal = buffer.subarray(0, 4).toString("hex") === "504b0304";
  const ehDocx = nome.endsWith(".docx") || mime.includes("wordprocessingml") || (ehZipReal && !ehPdfReal);

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
  } else if (ehDocx) {
    try {
      textoBruto = extrairTextoDeDocx(buffer);
      const palavras = textoBruto.split(/\s+/).filter(Boolean).length;
      totalPaginas = Math.max(1, Math.ceil(palavras / 250)); // Média de 250 palavras por página de livro
      metadados = {
        formato: "docx",
        tamanhoBytes: buffer.length,
      };
    } catch (err: any) {
      console.warn("Falha ao extrair docx:", err.message);
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
