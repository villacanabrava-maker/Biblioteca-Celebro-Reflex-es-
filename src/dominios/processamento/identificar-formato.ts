export type FormatoDocumentoSuportado = 'pdf' | 'texto' | 'markdown'

export type IdentificacaoFormato =
  | {
      suportado: true
      formato: FormatoDocumentoSuportado
      extensao: string
      mimeRegistrado: string
      assinatura: 'pdf' | 'texto_utf8'
    }
  | {
      suportado: false
      extensao: string | null
      mimeRegistrado: string
      motivo:
        | 'arquivo_vazio'
        | 'extensao_nao_suportada'
        | 'assinatura_incompativel'
        | 'mime_incompativel'
        | 'texto_nao_utf8'
        | 'conteudo_binario_em_texto'
        | 'docx_ainda_nao_suportado'
    }

const LIMITE_CABECALHO_PDF = 1024
const MIMES_PDF = new Set(['application/pdf', 'application/octet-stream', ''])
const MIMES_TEXTO = new Set([
  'text/plain',
  'text/markdown',
  'text/x-markdown',
  'application/octet-stream',
  '',
])

function extensao(nomeArquivo: string) {
  const indice = nomeArquivo.lastIndexOf('.')
  if (indice <= 0 || indice === nomeArquivo.length - 1) return null
  return nomeArquivo.slice(indice + 1).toLowerCase()
}

function mimeNormalizado(mime: string | null | undefined) {
  return (mime ?? '').split(';', 1)[0].trim().toLowerCase()
}

function contemAssinaturaPdf(amostra: Uint8Array) {
  const assinatura = [0x25, 0x50, 0x44, 0x46, 0x2d] // %PDF-
  const limite = Math.min(amostra.length - assinatura.length, LIMITE_CABECALHO_PDF)

  for (let inicio = 0; inicio <= limite; inicio += 1) {
    let corresponde = true
    for (let i = 0; i < assinatura.length; i += 1) {
      if (amostra[inicio + i] !== assinatura[i]) {
        corresponde = false
        break
      }
    }
    if (corresponde) return true
  }

  return false
}

function pareceTextoUtf8(amostra: Uint8Array) {
  if (amostra.length === 0) return false

  // NUL em uma amostra de TXT/Markdown é forte indício de conteúdo binário.
  if (amostra.includes(0)) return false

  try {
    // A amostra pode terminar no meio de um caractere multibyte. `stream: true`
    // mantém esse sufixo incompleto pendente sem ocultar sequências inválidas no meio.
    const texto = new TextDecoder('utf-8', { fatal: true }).decode(amostra, {
      stream: true,
    })
    if (!texto) return false

    let controles = 0
    for (const caractere of texto) {
      const codigo = caractere.codePointAt(0) ?? 0
      const permitido = codigo === 9 || codigo === 10 || codigo === 13
      if (codigo < 32 && !permitido) controles += 1
    }

    return controles / Math.max(texto.length, 1) <= 0.01
  } catch {
    return false
  }
}

export function identificarFormatoDocumento({
  nomeArquivo,
  mimeRegistrado,
  amostra,
}: {
  nomeArquivo: string
  mimeRegistrado: string | null | undefined
  amostra: Uint8Array
}): IdentificacaoFormato {
  const ext = extensao(nomeArquivo)
  const mime = mimeNormalizado(mimeRegistrado)

  if (amostra.length === 0) {
    return { suportado: false, extensao: ext, mimeRegistrado: mime, motivo: 'arquivo_vazio' }
  }

  if (ext === 'docx') {
    return {
      suportado: false,
      extensao: ext,
      mimeRegistrado: mime,
      motivo: 'docx_ainda_nao_suportado',
    }
  }

  if (ext === 'pdf') {
    if (!MIMES_PDF.has(mime)) {
      return {
        suportado: false,
        extensao: ext,
        mimeRegistrado: mime,
        motivo: 'mime_incompativel',
      }
    }

    if (!contemAssinaturaPdf(amostra)) {
      return {
        suportado: false,
        extensao: ext,
        mimeRegistrado: mime,
        motivo: 'assinatura_incompativel',
      }
    }

    return {
      suportado: true,
      formato: 'pdf',
      extensao: ext,
      mimeRegistrado: mime,
      assinatura: 'pdf',
    }
  }

  if (ext === 'txt' || ext === 'md' || ext === 'markdown') {
    if (!MIMES_TEXTO.has(mime)) {
      return {
        suportado: false,
        extensao: ext,
        mimeRegistrado: mime,
        motivo: 'mime_incompativel',
      }
    }

    if (!pareceTextoUtf8(amostra)) {
      return {
        suportado: false,
        extensao: ext,
        mimeRegistrado: mime,
        motivo: amostra.includes(0) ? 'conteudo_binario_em_texto' : 'texto_nao_utf8',
      }
    }

    return {
      suportado: true,
      formato: ext === 'txt' ? 'texto' : 'markdown',
      extensao: ext,
      mimeRegistrado: mime,
      assinatura: 'texto_utf8',
    }
  }

  return {
    suportado: false,
    extensao: ext,
    mimeRegistrado: mime,
    motivo: 'extensao_nao_suportada',
  }
}
