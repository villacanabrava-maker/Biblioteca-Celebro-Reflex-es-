import { getDocumentProxy } from 'unpdf'

export type FormatoConteudoExtraivel = 'pdf' | 'texto' | 'markdown'

export type ArtefatoConteudoExtraido = {
  schema_version: 1
  formato: FormatoConteudoExtraivel
  encoding: 'utf-8'
  metodo: 'utf8_deterministico' | 'unpdf_pdfjs_texto'
  fonte: {
    nome_arquivo: string
    tipo_mime_registrado: string
    hash_sha256_original: string
  }
  total_paginas: number | null
  conteudo?: string
  paginas?: Array<{
    numero: number
    conteudo: string
  }>
}

export type ResultadoExtracaoDeterministica =
  | {
      ok: true
      artefato: ArtefatoConteudoExtraido
      quantidadeCaracteres: number
      quantidadePaginas: number | null
      paginasComTexto: number | null
    }
  | {
      ok: false
      codigo:
        | 'CONTEUDO_TEXTO_INVALIDO'
        | 'CONTEUDO_VAZIO'
        | 'CONTEUDO_EXTRAIDO_MUITO_GRANDE'
        | 'PDF_PAGINAS_EXCEDIDAS'
        | 'PDF_SEM_TEXTO_EXTRAIVEL'
        | 'PDF_NAO_EXTRAIVEL'
      motivo: string
      detalhes?: Record<string, string | number | boolean | null>
    }

export const LIMITES_EXTRACAO = {
  originalTextoBytes: 20 * 1024 * 1024,
  originalPdfBytes: 50 * 1024 * 1024,
  caracteresExtraidos: 12_000_000,
  artefatoJsonBytes: 30 * 1024 * 1024,
  paginasPdf: 1_000,
  imagemPdfPixels: 16_777_216,
  tempoPdfMs: 90_000,
} as const

function limparBom(texto: string) {
  return texto.charCodeAt(0) === 0xfeff ? texto.slice(1) : texto
}

function contemControleBinario(texto: string) {
  for (const caractere of texto) {
    const codigo = caractere.codePointAt(0) ?? 0
    const permitido =
      codigo === 9 ||
      codigo === 10 ||
      codigo === 12 ||
      codigo === 13

    if (codigo < 32 && !permitido) return true
  }

  return false
}

export function extrairTextoUtf8({
  dados,
  formato,
  nomeArquivo,
  tipoMimeRegistrado,
  hashSha256Original,
}: {
  dados: Uint8Array
  formato: 'texto' | 'markdown'
  nomeArquivo: string
  tipoMimeRegistrado: string
  hashSha256Original: string
}): ResultadoExtracaoDeterministica {
  let texto: string

  try {
    texto = limparBom(new TextDecoder('utf-8', { fatal: true }).decode(dados))
  } catch {
    return {
      ok: false,
      codigo: 'CONTEUDO_TEXTO_INVALIDO',
      motivo: 'O arquivo completo não é UTF-8 válido.',
    }
  }

  if (contemControleBinario(texto)) {
    return {
      ok: false,
      codigo: 'CONTEUDO_TEXTO_INVALIDO',
      motivo: 'O arquivo contém controles binários incompatíveis com texto.',
    }
  }

  if (texto.trim().length === 0) {
    return {
      ok: false,
      codigo: 'CONTEUDO_VAZIO',
      motivo: 'O arquivo não contém texto útil para processamento.',
    }
  }

  if (texto.length > LIMITES_EXTRACAO.caracteresExtraidos) {
    return {
      ok: false,
      codigo: 'CONTEUDO_EXTRAIDO_MUITO_GRANDE',
      motivo: 'O conteúdo textual excede o limite operacional desta versão do Pipeline.',
      detalhes: { caracteres: texto.length },
    }
  }

  return {
    ok: true,
    artefato: {
      schema_version: 1,
      formato,
      encoding: 'utf-8',
      metodo: 'utf8_deterministico',
      fonte: {
        nome_arquivo: nomeArquivo,
        tipo_mime_registrado: tipoMimeRegistrado,
        hash_sha256_original: hashSha256Original,
      },
      total_paginas: null,
      conteudo: texto,
    },
    quantidadeCaracteres: texto.length,
    quantidadePaginas: null,
    paginasComTexto: null,
  }
}

async function extrairPaginasPdf(
  pdf: Awaited<ReturnType<typeof getDocumentProxy>>
): Promise<{
  paginas: Array<{ numero: number; conteudo: string }>
  quantidadeCaracteres: number
  paginasComTexto: number
}> {
  const paginas: Array<{ numero: number; conteudo: string }> = []
  let quantidadeCaracteres = 0
  let paginasComTexto = 0

  for (let numero = 1; numero <= pdf.numPages; numero += 1) {
    const pagina = await pdf.getPage(numero)
    const conteudo = await pagina.getTextContent()
    const partes: string[] = []

    for (const item of conteudo.items) {
      if (!('str' in item)) continue
      partes.push(item.str)
      partes.push(item.hasEOL ? '\n' : ' ')
    }

    const texto = partes
      .join('')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    quantidadeCaracteres += texto.length
    if (texto.length > 0) paginasComTexto += 1

    if (quantidadeCaracteres > LIMITES_EXTRACAO.caracteresExtraidos) {
      throw new Error('LIMITE_CARACTERES_PDF')
    }

    paginas.push({ numero, conteudo: texto })
    pagina.cleanup()
  }

  return { paginas, quantidadeCaracteres, paginasComTexto }
}

async function comTimeout<T>(promessa: Promise<T>, limiteMs: number): Promise<T> {
  let temporizador: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      promessa,
      new Promise<never>((_, rejeitar) => {
        temporizador = setTimeout(
          () => rejeitar(new Error('TEMPO_EXTRACAO_PDF_EXCEDIDO')),
          limiteMs
        )
      }),
    ])
  } finally {
    if (temporizador) clearTimeout(temporizador)
  }
}

export async function extrairTextoPdf({
  dados,
  nomeArquivo,
  tipoMimeRegistrado,
  hashSha256Original,
}: {
  dados: Uint8Array
  nomeArquivo: string
  tipoMimeRegistrado: string
  hashSha256Original: string
}): Promise<ResultadoExtracaoDeterministica> {
  let pdf: Awaited<ReturnType<typeof getDocumentProxy>> | null = null

  try {
    pdf = await getDocumentProxy(dados, {
      isEvalSupported: false,
      maxImageSize: LIMITES_EXTRACAO.imagemPdfPixels,
    })

    if (pdf.numPages > LIMITES_EXTRACAO.paginasPdf) {
      return {
        ok: false,
        codigo: 'PDF_PAGINAS_EXCEDIDAS',
        motivo: 'O PDF excede o limite operacional de páginas desta versão do Pipeline.',
        detalhes: {
          paginas: pdf.numPages,
          limite_paginas: LIMITES_EXTRACAO.paginasPdf,
        },
      }
    }

    const extraido = await comTimeout(
      extrairPaginasPdf(pdf),
      LIMITES_EXTRACAO.tempoPdfMs
    )

    if (extraido.paginasComTexto === 0) {
      return {
        ok: false,
        codigo: 'PDF_SEM_TEXTO_EXTRAIVEL',
        motivo: 'O PDF não possui camada textual extraível; OCR será tratado em etapa própria.',
        detalhes: { paginas: pdf.numPages },
      }
    }

    return {
      ok: true,
      artefato: {
        schema_version: 1,
        formato: 'pdf',
        encoding: 'utf-8',
        metodo: 'unpdf_pdfjs_texto',
        fonte: {
          nome_arquivo: nomeArquivo,
          tipo_mime_registrado: tipoMimeRegistrado,
          hash_sha256_original: hashSha256Original,
        },
        total_paginas: pdf.numPages,
        paginas: extraido.paginas,
      },
      quantidadeCaracteres: extraido.quantidadeCaracteres,
      quantidadePaginas: pdf.numPages,
      paginasComTexto: extraido.paginasComTexto,
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'LIMITE_CARACTERES_PDF') {
      return {
        ok: false,
        codigo: 'CONTEUDO_EXTRAIDO_MUITO_GRANDE',
        motivo: 'O texto extraído do PDF excede o limite operacional desta versão do Pipeline.',
      }
    }

    return {
      ok: false,
      codigo: 'PDF_NAO_EXTRAIVEL',
      motivo: 'O PDF não pôde ser extraído de forma segura pelo parser textual.',
      detalhes: {
        tipo_erro: error instanceof Error ? error.name : 'erro_desconhecido',
        tempo_excedido:
          error instanceof Error && error.message === 'TEMPO_EXTRACAO_PDF_EXCEDIDO',
      },
    }
  } finally {
    if (pdf) await pdf.destroy()
  }
}
