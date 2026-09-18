import zlib from "zlib";
import { CanvasFactory } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";

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
  const TAMANHO_CABECALHO_LOCAL = 30;
  const ASSINATURA_ARQUIVO_LOCAL = 0x04034b50;
  let offset = 0;

  while (offset + 4 <= buffer.length) {
    if (buffer.readUInt32LE(offset) !== ASSINATURA_ARQUIVO_LOCAL) {
      offset++;
      continue;
    }

    // Um cabeçalho ZIP local completo ocupa 30 bytes. Validar antes de ler
    // campos em offsets fixos evita RangeError: "offset is out of bounds"
    // em DOCX truncados, incompletos ou com estrutura ZIP inesperada.
    if (offset + TAMANHO_CABECALHO_LOCAL > buffer.length) {
      break;
    }

    const compressionMethod = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const fileNameLength = buffer.readUInt16LE(offset + 26);
    const extraFieldLength = buffer.readUInt16LE(offset + 28);

    const fileNameStart = offset + TAMANHO_CABECALHO_LOCAL;
    const fileNameEnd = fileNameStart + fileNameLength;
    const fileDataStart = fileNameEnd + extraFieldLength;
    const fileDataEnd = fileDataStart + compressedSize;

    if (
      fileNameEnd > buffer.length ||
      fileDataStart > buffer.length ||
      fileDataEnd > buffer.length ||
      fileDataEnd < fileDataStart
    ) {
      // Cabeçalho inválido ou entrada truncada. Avança um byte para procurar
      // a próxima assinatura em vez de tentar ler fora do buffer.
      offset++;
      continue;
    }

    const fileName = buffer.subarray(fileNameStart, fileNameEnd).toString("utf-8");

    if (fileName === "word/document.xml") {
      const compressedData = buffer.subarray(fileDataStart, fileDataEnd);
      let xml = "";

      if (compressionMethod === 8) {
        xml = zlib.inflateRawSync(compressedData).toString("utf-8");
      } else if (compressionMethod === 0) {
        xml = compressedData.toString("utf-8");
      } else {
        throw new Error(`Método de compressão DOCX não suportado: ${compressionMethod}`);
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

    offset = fileDataEnd > offset ? fileDataEnd : offset + 1;
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
    const parser = new PDFParse({ data: buffer, CanvasFactory });

    try {
      const [dadosTexto, dadosInfo] = await Promise.all([
        parser.getText(),
        parser.getInfo(),
      ]);

      textoBruto = dadosTexto.text;
      totalPaginas = dadosInfo.total || 1;
      metadados = {
        formato: "pdf",
        totalPaginas: dadosInfo.total || 1,
        tamanhoBytes: buffer.length,
      };
    } catch (err: any) {
      console.warn("Falha ao analisar PDF binário:", err.message);
      throw new Error(`Não foi possível extrair o texto do PDF: ${err.message}`);
    } finally {
      await parser.destroy();
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
