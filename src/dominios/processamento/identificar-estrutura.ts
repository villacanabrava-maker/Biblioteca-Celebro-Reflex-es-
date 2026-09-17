import { z } from 'zod'
import type { FormatoConteudoExtraivel } from './extrair-conteudo'
import {
  validarArtefatoNormalizado,
  type ArtefatoConteudoNormalizado,
  type ResultadoValidacaoArtefatoNormalizado,
} from './normalizar-conteudo.ts'

const HASH_SHA256 = /^[0-9a-f]{64}$/

const TIPOS_SECAO_SUGERIDOS = [
  'parte',
  'capitulo',
  'secao',
  'subsecao',
  'anexo',
  'prefacio',
  'posfacio',
] as const

export type TipoSecaoSugerido = (typeof TIPOS_SECAO_SUGERIDOS)[number]

const unidadeEstruturalSchema = z
  .object({
    ordem: z.number().int().nonnegative(),
    tipo_sinal: z.enum([
      'cabecalho_markdown',
      'marcador_numerado',
      'marcador_isolado',
      'linha_maiuscula_candidata',
    ]),
    tipo_sugerido: z.enum(TIPOS_SECAO_SUGERIDOS).nullable(),
    nivel_markdown: z.number().int().min(1).max(6).nullable(),
    titulo_detectado: z.string().min(1),
    confianca: z.enum(['alta', 'baixa']),
    pagina: z.number().int().positive().nullable(),
    indice_inicio: z.number().int().nonnegative(),
    indice_fim: z.number().int().nonnegative(),
  })
  .strict()

const fonteEstruturaSchema = z
  .object({
    nome_arquivo: z.string().min(1),
    tipo_mime_registrado: z.string(),
    hash_sha256_original: z.string().regex(HASH_SHA256),
    hash_sha256_artefato_extraido: z.string().regex(HASH_SHA256),
    hash_sha256_artefato_normalizado: z.string().regex(HASH_SHA256),
  })
  .strict()

const artefatoEstruturaSchema = z
  .object({
    schema_version: z.literal(1),
    metodo: z.literal('deteccao_deterministica_sinais_v1'),
    formato: z.enum(['texto', 'markdown', 'pdf']),
    fonte: fonteEstruturaSchema,
    total_paginas: z.number().int().positive().nullable(),
    total_caracteres: z.number().int().nonnegative().nullable(),
    possui_indicios_estruturais: z.boolean(),
    unidades: z.array(unidadeEstruturalSchema),
    estatisticas: z
      .object({
        quantidade_linhas_analisadas: z.number().int().nonnegative(),
        quantidade_sinais_alta_confianca: z.number().int().nonnegative(),
        quantidade_sinais_baixa_confianca: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict()

export type UnidadeEstruturalDetectada = z.infer<typeof unidadeEstruturalSchema>

export type ArtefatoEstruturaIdentificada = z.infer<typeof artefatoEstruturaSchema>

export type ResultadoIdentificacaoEstrutura =
  | { ok: true; artefato: ArtefatoEstruturaIdentificada }
  | Extract<ResultadoValidacaoArtefatoNormalizado, { ok: false }>

export type ResultadoValidacaoArtefatoEstrutura =
  | { ok: true; artefato: ArtefatoEstruturaIdentificada }
  | {
      ok: false
      codigo:
        | 'ARTEFATO_ESTRUTURA_NAO_UTF8'
        | 'ARTEFATO_ESTRUTURA_JSON_INVALIDO'
        | 'ARTEFATO_ESTRUTURA_SCHEMA_INVALIDO'
        | 'ARTEFATO_ESTRUTURA_ORIGEM_DIVERGENTE'
      motivo: string
      detalhes?: Record<string, string | number | boolean | null>
    }

// Uma linha só é candidata a marcador quando é curta o suficiente para ser um
// título, não um parágrafo de prosa que apenas menciona a palavra-chave.
const LIMITE_TAMANHO_LINHA_CANDIDATA = 120

// O numeral após parte/capítulo só é aceito em algarismos arábicos ou
// numerais romanos MAIÚSCULOS (case-sensitive). Isso evita falsos positivos
// como "Parte civil..." ou "Parte dividida...", cujas palavras seguintes são
// compostas inteiramente por letras válidas em numeral romano minúsculo.
const PADRAO_NUMERO_ROMANO_OU_ARABICO = /^\s+(\d+(?:\.\d+)*|[IVXLCDM]+)\b/
const PADRAO_NUMERO_ARABICO = /^\s+\d+(?:\.\d+)*\b/
const PADRAO_NUMERO_OU_LETRA_ANEXO = /^\s+(\d+|[A-Z])\b/

const MARCADORES_NUMERADOS: Array<{
  padraoChave: RegExp
  padraoNumero: RegExp
  tipo: TipoSecaoSugerido
}> = [
  { padraoChave: /^parte\b/i, padraoNumero: PADRAO_NUMERO_ROMANO_OU_ARABICO, tipo: 'parte' },
  { padraoChave: /^cap[ií]tulo\b/i, padraoNumero: PADRAO_NUMERO_ROMANO_OU_ARABICO, tipo: 'capitulo' },
  { padraoChave: /^subse[cç][aã]o\b/i, padraoNumero: PADRAO_NUMERO_ARABICO, tipo: 'subsecao' },
  { padraoChave: /^se[cç][aã]o\b/i, padraoNumero: PADRAO_NUMERO_ARABICO, tipo: 'secao' },
  { padraoChave: /^anexo\b/i, padraoNumero: PADRAO_NUMERO_OU_LETRA_ANEXO, tipo: 'anexo' },
]

const PADRAO_PREFACIO = /^pref[aá]cio\s*$/i
const PADRAO_POSFACIO = /^posf[aá]cio\s*$/i
const PADRAO_CABECALHO_MARKDOWN = /^(#{1,6})\s+(.+)$/
const PADRAO_LINHA_MAIUSCULA = /^[A-ZÀ-Ý0-9][A-ZÀ-Ý0-9 .,'’-]{2,79}$/

function casarMarcadorNumerado(linha: string): TipoSecaoSugerido | null {
  for (const { padraoChave, padraoNumero, tipo } of MARCADORES_NUMERADOS) {
    const casamentoChave = linha.match(padraoChave)
    if (!casamentoChave) continue

    const resto = linha.slice(casamentoChave[0].length)
    if (padraoNumero.test(resto)) return tipo
  }

  return null
}

type ClassificacaoLinha = Omit<
  UnidadeEstruturalDetectada,
  'ordem' | 'pagina' | 'indice_inicio' | 'indice_fim'
>

function classificarLinha(
  linhaBruta: string,
  formato: FormatoConteudoExtraivel
): ClassificacaoLinha | null {
  const linha = linhaBruta.trim()
  if (linha.length === 0) return null

  if (formato === 'markdown') {
    const cabecalho = linha.match(PADRAO_CABECALHO_MARKDOWN)
    if (cabecalho) {
      return {
        tipo_sinal: 'cabecalho_markdown',
        tipo_sugerido: null,
        nivel_markdown: cabecalho[1]!.length,
        titulo_detectado: cabecalho[2]!.trim(),
        confianca: 'alta',
      }
    }
  }

  if (linha.length > LIMITE_TAMANHO_LINHA_CANDIDATA) return null

  const tipoMarcadorNumerado = casarMarcadorNumerado(linha)
  if (tipoMarcadorNumerado) {
    return {
      tipo_sinal: 'marcador_numerado',
      tipo_sugerido: tipoMarcadorNumerado,
      nivel_markdown: null,
      titulo_detectado: linha,
      confianca: 'alta',
    }
  }

  if (PADRAO_PREFACIO.test(linha)) {
    return {
      tipo_sinal: 'marcador_isolado',
      tipo_sugerido: 'prefacio',
      nivel_markdown: null,
      titulo_detectado: linha,
      confianca: 'alta',
    }
  }

  if (PADRAO_POSFACIO.test(linha)) {
    return {
      tipo_sinal: 'marcador_isolado',
      tipo_sugerido: 'posfacio',
      nivel_markdown: null,
      titulo_detectado: linha,
      confianca: 'alta',
    }
  }

  if (PADRAO_LINHA_MAIUSCULA.test(linha) && /[A-ZÀ-Ý]/.test(linha)) {
    return {
      tipo_sinal: 'linha_maiuscula_candidata',
      tipo_sugerido: null,
      nivel_markdown: null,
      titulo_detectado: linha,
      confianca: 'baixa',
    }
  }

  return null
}

function* linhasComOffset(texto: string) {
  let offset = 0
  for (const linha of texto.split('\n')) {
    yield { linha, indiceInicio: offset, indiceFim: offset + linha.length }
    offset += linha.length + 1
  }
}

function detectarUnidades(normalizado: ArtefatoConteudoNormalizado): {
  unidades: UnidadeEstruturalDetectada[]
  quantidadeLinhas: number
} {
  const unidades: UnidadeEstruturalDetectada[] = []
  let ordem = 0
  let quantidadeLinhas = 0

  const processarBloco = (texto: string, pagina: number | null) => {
    for (const { linha, indiceInicio, indiceFim } of linhasComOffset(texto)) {
      quantidadeLinhas += 1
      const classificacao = classificarLinha(linha, normalizado.formato)
      if (!classificacao) continue

      unidades.push({
        ordem,
        pagina,
        indice_inicio: indiceInicio,
        indice_fim: indiceFim,
        ...classificacao,
      })
      ordem += 1
    }
  }

  if (normalizado.formato === 'pdf' && normalizado.paginas) {
    for (const pagina of normalizado.paginas) {
      processarBloco(pagina.conteudo, pagina.numero)
    }
  } else if (normalizado.conteudo !== undefined) {
    processarBloco(normalizado.conteudo, null)
  }

  return { unidades, quantidadeLinhas }
}

/**
 * Identifica sinais determinísticos de estrutura (partes/capítulos/seções) a
 * partir do conteúdo já normalizado. Não materializa `processamento.secoes`:
 * apenas produz evidência versionada para a etapa `criar_hierarquia` decidir.
 * Quando nenhum sinal de alta confiança é encontrado, o resultado preserva a
 * incerteza (`possui_indicios_estruturais: false`) em vez de inventar hierarquia.
 */
export function identificarEstruturaArtefatoNormalizado({
  bytes,
  hashArtefatoNormalizado,
  hashOriginalEsperado,
  hashArtefatoExtraidoEsperado,
}: {
  bytes: Uint8Array
  hashArtefatoNormalizado: string
  hashOriginalEsperado: string
  hashArtefatoExtraidoEsperado: string
}): ResultadoIdentificacaoEstrutura {
  const validacao = validarArtefatoNormalizado({
    bytes,
    hashOriginalEsperado,
    hashArtefatoExtraidoEsperado,
  })

  if (!validacao.ok) return validacao

  const normalizado = validacao.artefato
  const { unidades, quantidadeLinhas } = detectarUnidades(normalizado)
  const altaConfianca = unidades.filter((unidade) => unidade.confianca === 'alta').length
  const baixaConfianca = unidades.length - altaConfianca

  // Só faz sentido um total de caracteres "global" quando o conteúdo é uma
  // única string (texto/markdown). Em PDF, indice_inicio/indice_fim de cada
  // unidade são relativos à página onde ela ocorre, não ao documento inteiro,
  // por isso criar_hierarquia usa concatenação de páginas para PDF em vez de
  // corte por caractere.
  const totalCaracteres = normalizado.conteudo !== undefined ? normalizado.conteudo.length : null

  return {
    ok: true,
    artefato: {
      schema_version: 1,
      metodo: 'deteccao_deterministica_sinais_v1',
      formato: normalizado.formato,
      fonte: {
        nome_arquivo: normalizado.fonte.nome_arquivo,
        tipo_mime_registrado: normalizado.fonte.tipo_mime_registrado,
        hash_sha256_original: normalizado.fonte.hash_sha256_original,
        hash_sha256_artefato_extraido: normalizado.fonte.hash_sha256_artefato_extraido,
        hash_sha256_artefato_normalizado: hashArtefatoNormalizado.toLowerCase(),
      },
      total_paginas: normalizado.total_paginas,
      total_caracteres: totalCaracteres,
      possui_indicios_estruturais: altaConfianca > 0,
      unidades,
      estatisticas: {
        quantidade_linhas_analisadas: quantidadeLinhas,
        quantidade_sinais_alta_confianca: altaConfianca,
        quantidade_sinais_baixa_confianca: baixaConfianca,
      },
    },
  }
}

export function validarArtefatoEstrutura({
  bytes,
  hashOriginalEsperado,
  hashArtefatoExtraidoEsperado,
  hashArtefatoNormalizadoEsperado,
}: {
  bytes: Uint8Array
  hashOriginalEsperado: string
  hashArtefatoExtraidoEsperado: string
  hashArtefatoNormalizadoEsperado: string
}): ResultadoValidacaoArtefatoEstrutura {
  let textoJson: string

  try {
    textoJson = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return {
      ok: false,
      codigo: 'ARTEFATO_ESTRUTURA_NAO_UTF8',
      motivo: 'O artefato de estrutura não é UTF-8 válido.',
    }
  }

  let bruto: unknown
  try {
    bruto = JSON.parse(textoJson)
  } catch {
    return {
      ok: false,
      codigo: 'ARTEFATO_ESTRUTURA_JSON_INVALIDO',
      motivo: 'O artefato de estrutura não contém JSON válido.',
    }
  }

  const validacao = artefatoEstruturaSchema.safeParse(bruto)
  if (!validacao.success) {
    return {
      ok: false,
      codigo: 'ARTEFATO_ESTRUTURA_SCHEMA_INVALIDO',
      motivo: 'O artefato de estrutura não corresponde ao schema v1 esperado.',
      detalhes: { quantidade_erros: validacao.error.issues.length },
    }
  }

  const artefato = validacao.data
  const originalCorresponde =
    artefato.fonte.hash_sha256_original.toLowerCase() === hashOriginalEsperado.toLowerCase()
  const extraidoCorresponde =
    artefato.fonte.hash_sha256_artefato_extraido.toLowerCase() ===
    hashArtefatoExtraidoEsperado.toLowerCase()
  const normalizadoCorresponde =
    artefato.fonte.hash_sha256_artefato_normalizado.toLowerCase() ===
    hashArtefatoNormalizadoEsperado.toLowerCase()

  if (!originalCorresponde || !extraidoCorresponde || !normalizadoCorresponde) {
    return {
      ok: false,
      codigo: 'ARTEFATO_ESTRUTURA_ORIGEM_DIVERGENTE',
      motivo: 'O artefato de estrutura não pertence à cadeia de proveniência desta execução.',
      detalhes: {
        hash_original_corresponde: originalCorresponde,
        hash_artefato_extraido_corresponde: extraidoCorresponde,
        hash_artefato_normalizado_corresponde: normalizadoCorresponde,
      },
    }
  }

  return { ok: true, artefato }
}
