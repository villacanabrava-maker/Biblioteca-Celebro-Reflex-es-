import test from 'node:test'
import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { identificarFormatoDocumento } from '../../src/dominios/processamento/identificar-formato.ts'
import {
  extrairTextoPdf,
  extrairTextoUtf8,
} from '../../src/dominios/processamento/extrair-conteudo.ts'
import {
  normalizarArtefatoExtraido,
  validarArtefatoNormalizado,
} from '../../src/dominios/processamento/normalizar-conteudo.ts'
import {
  identificarEstruturaArtefatoNormalizado,
  validarArtefatoEstrutura,
} from '../../src/dominios/processamento/identificar-estrutura.ts'
import { construirHierarquiaDocumento } from '../../src/dominios/processamento/criar-hierarquia.ts'

const encoder = new TextEncoder()

function bytes(texto) {
  return encoder.encode(texto)
}

function criarPdfTexto(texto = 'Teste PDF') {
  const objetos = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]

  const escapado = texto.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)')
  const stream = `BT\n/F1 18 Tf\n72 720 Td\n(${escapado}) Tj\nET\n`
  objetos.push(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}endstream`)

  let pdf = '%PDF-1.4\n'
  const offsets = [0]

  for (let i = 0; i < objetos.length; i += 1) {
    offsets.push(Buffer.byteLength(pdf))
    pdf += `${i + 1} 0 obj\n${objetos[i]}\nendobj\n`
  }

  const xref = Buffer.byteLength(pdf)
  pdf += `xref\n0 ${objetos.length + 1}\n`
  pdf += '0000000000 65535 f \n'

  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }

  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return bytes(pdf)
}

function artefatoTexto(conteudo, formato = 'texto') {
  return {
    schema_version: 1,
    formato,
    encoding: 'utf-8',
    metodo: 'utf8_deterministico',
    fonte: {
      nome_arquivo: formato === 'markdown' ? 'ensaio.md' : 'ensaio.txt',
      tipo_mime_registrado: formato === 'markdown' ? 'text/markdown' : 'text/plain',
      hash_sha256_original: 'e'.repeat(64),
    },
    total_paginas: null,
    conteudo,
  }
}

test('identifica PDF apenas quando extensão, MIME e assinatura são coerentes', () => {
  const resultado = identificarFormatoDocumento({
    nomeArquivo: 'obra.pdf',
    mimeRegistrado: 'application/pdf',
    amostra: bytes('%PDF-1.7\n'),
  })

  assert.equal(resultado.suportado, true)
  if (resultado.suportado) assert.equal(resultado.formato, 'pdf')

  const falso = identificarFormatoDocumento({
    nomeArquivo: 'obra.pdf',
    mimeRegistrado: 'application/pdf',
    amostra: bytes('isto não é um PDF'),
  })

  assert.equal(falso.suportado, false)
  if (!falso.suportado) assert.equal(falso.motivo, 'assinatura_incompativel')
})

test('identifica TXT e Markdown UTF-8 e rejeita binário disfarçado', () => {
  const txt = identificarFormatoDocumento({
    nomeArquivo: 'notas.txt',
    mimeRegistrado: 'text/plain; charset=utf-8',
    amostra: bytes('Texto em português: ação e reflexão.'),
  })
  assert.equal(txt.suportado, true)
  if (txt.suportado) assert.equal(txt.formato, 'texto')

  const md = identificarFormatoDocumento({
    nomeArquivo: 'ensaio.md',
    mimeRegistrado: 'text/markdown',
    amostra: bytes('# Título\n\nConteúdo'),
  })
  assert.equal(md.suportado, true)
  if (md.suportado) assert.equal(md.formato, 'markdown')

  const binario = identificarFormatoDocumento({
    nomeArquivo: 'falso.txt',
    mimeRegistrado: 'text/plain',
    amostra: new Uint8Array([0x41, 0x00, 0x42]),
  })
  assert.equal(binario.suportado, false)
  if (!binario.suportado) assert.equal(binario.motivo, 'conteudo_binario_em_texto')
})

test('DOCX permanece explicitamente fora do escopo desta versão', () => {
  const resultado = identificarFormatoDocumento({
    nomeArquivo: 'livro.docx',
    mimeRegistrado: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    amostra: new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
  })

  assert.equal(resultado.suportado, false)
  if (!resultado.suportado) assert.equal(resultado.motivo, 'docx_ainda_nao_suportado')
})

test('extrai TXT UTF-8, remove BOM e rejeita conteúdo vazio ou inválido', () => {
  const valido = extrairTextoUtf8({
    dados: bytes('\uFEFFPrimeiro parágrafo.\n\nSegundo parágrafo.'),
    formato: 'texto',
    nomeArquivo: 'texto.txt',
    tipoMimeRegistrado: 'text/plain',
    hashSha256Original: 'a'.repeat(64),
  })

  assert.equal(valido.ok, true)
  if (valido.ok) {
    assert.equal(valido.artefato.conteudo?.startsWith('Primeiro'), true)
    assert.equal(valido.quantidadePaginas, null)
  }

  const vazio = extrairTextoUtf8({
    dados: bytes('   \n\n  '),
    formato: 'texto',
    nomeArquivo: 'vazio.txt',
    tipoMimeRegistrado: 'text/plain',
    hashSha256Original: 'b'.repeat(64),
  })
  assert.equal(vazio.ok, false)
  if (!vazio.ok) assert.equal(vazio.codigo, 'CONTEUDO_VAZIO')

  const invalido = extrairTextoUtf8({
    dados: new Uint8Array([0xc3, 0x28]),
    formato: 'texto',
    nomeArquivo: 'invalido.txt',
    tipoMimeRegistrado: 'text/plain',
    hashSha256Original: 'c'.repeat(64),
  })
  assert.equal(invalido.ok, false)
  if (!invalido.ok) assert.equal(invalido.codigo, 'CONTEUDO_TEXTO_INVALIDO')
})

test('extrai texto de PDF preservando a referência da página', async () => {
  const resultado = await extrairTextoPdf({
    dados: criarPdfTexto('Teste PDF'),
    nomeArquivo: 'teste.pdf',
    tipoMimeRegistrado: 'application/pdf',
    hashSha256Original: 'd'.repeat(64),
  })

  assert.equal(resultado.ok, true)
  if (!resultado.ok) return

  assert.equal(resultado.quantidadePaginas, 1)
  assert.equal(resultado.paginasComTexto, 1)
  assert.equal(resultado.artefato.paginas?.[0]?.numero, 1)
  assert.match(resultado.artefato.paginas?.[0]?.conteudo ?? '', /Teste PDF/)
})

test('normaliza Unicode em NFC e quebras de linha sem apagar escolhas autorais', () => {
  const entrada = artefatoTexto('Cafe\u0301\r\nLinha 2\rLinha 3  \nLigatura: ﬀ — “aspas”')
  const resultado = normalizarArtefatoExtraido({
    bytes: bytes(JSON.stringify(entrada)),
    hashArtefatoExtraido: 'f'.repeat(64),
    hashOriginalEsperado: 'e'.repeat(64),
  })

  assert.equal(resultado.ok, true)
  if (!resultado.ok) return

  assert.equal(
    resultado.artefato.conteudo,
    'Café\nLinha 2\nLinha 3  \nLigatura: ﬀ — “aspas”'
  )
  assert.equal(resultado.artefato.normalizacao.unicode, 'NFC')
  assert.equal(resultado.artefato.normalizacao.alteracoes.quebras_crlf_convertidas, 1)
  assert.equal(resultado.artefato.normalizacao.alteracoes.quebras_cr_isoladas_convertidas, 1)
  assert.equal(resultado.artefato.normalizacao.alteracoes.segmentos_alterados_nfc, 1)
})

test('NFC preserva distinções de compatibilidade que NFKC apagaria', () => {
  const entrada = artefatoTexto('ﬀ ① Ａ')
  const resultado = normalizarArtefatoExtraido({
    bytes: bytes(JSON.stringify(entrada)),
    hashArtefatoExtraido: '1'.repeat(64),
    hashOriginalEsperado: 'e'.repeat(64),
  })

  assert.equal(resultado.ok, true)
  if (resultado.ok) assert.equal(resultado.artefato.conteudo, 'ﬀ ① Ａ')
})

test('normalização preserva espaços significativos de Markdown', () => {
  const entrada = artefatoTexto('Linha com quebra Markdown  \r\ncontinuação', 'markdown')
  const resultado = normalizarArtefatoExtraido({
    bytes: bytes(JSON.stringify(entrada)),
    hashArtefatoExtraido: '2'.repeat(64),
    hashOriginalEsperado: 'e'.repeat(64),
  })

  assert.equal(resultado.ok, true)
  if (resultado.ok) assert.equal(resultado.artefato.conteudo, 'Linha com quebra Markdown  \ncontinuação')
})

test('normalização preserva ordem e números das páginas de PDF', () => {
  const entrada = {
    schema_version: 1,
    formato: 'pdf',
    encoding: 'utf-8',
    metodo: 'unpdf_pdfjs_texto',
    fonte: {
      nome_arquivo: 'livro.pdf',
      tipo_mime_registrado: 'application/pdf',
      hash_sha256_original: 'e'.repeat(64),
    },
    total_paginas: 2,
    paginas: [
      { numero: 1, conteudo: 'Pa\u0301gina 1\r\ntexto' },
      { numero: 2, conteudo: 'Página 2' },
    ],
  }

  const resultado = normalizarArtefatoExtraido({
    bytes: bytes(JSON.stringify(entrada)),
    hashArtefatoExtraido: '3'.repeat(64),
    hashOriginalEsperado: 'e'.repeat(64),
  })

  assert.equal(resultado.ok, true)
  if (!resultado.ok) return
  assert.deepEqual(resultado.artefato.paginas, [
    { numero: 1, conteudo: 'Página 1\ntexto' },
    { numero: 2, conteudo: 'Página 2' },
  ])
})

test('normalização rejeita artefato ligado a outro original', () => {
  const entrada = artefatoTexto('Conteúdo')
  const resultado = normalizarArtefatoExtraido({
    bytes: bytes(JSON.stringify(entrada)),
    hashArtefatoExtraido: '4'.repeat(64),
    hashOriginalEsperado: '9'.repeat(64),
  })

  assert.equal(resultado.ok, false)
  if (!resultado.ok) assert.equal(resultado.codigo, 'ARTEFATO_EXTRAIDO_ORIGINAL_DIVERGENTE')
})

test('artefato normalizado válido mantém cadeia de proveniência do original e da extração', () => {
  const entrada = artefatoTexto('Cafe\u0301\r\nTexto autoral')
  const normalizado = normalizarArtefatoExtraido({
    bytes: bytes(JSON.stringify(entrada)),
    hashArtefatoExtraido: '5'.repeat(64),
    hashOriginalEsperado: 'e'.repeat(64),
  })

  assert.equal(normalizado.ok, true)
  if (!normalizado.ok) return

  const validacao = validarArtefatoNormalizado({
    bytes: bytes(JSON.stringify(normalizado.artefato)),
    hashOriginalEsperado: 'e'.repeat(64),
    hashArtefatoExtraidoEsperado: '5'.repeat(64),
  })

  assert.equal(validacao.ok, true)
  if (validacao.ok) assert.equal(validacao.artefato.conteudo, 'Café\nTexto autoral')
})

test('artefato normalizado é rejeitado se apontar para outra extração', () => {
  const entrada = artefatoTexto('Conteúdo')
  const normalizado = normalizarArtefatoExtraido({
    bytes: bytes(JSON.stringify(entrada)),
    hashArtefatoExtraido: '6'.repeat(64),
    hashOriginalEsperado: 'e'.repeat(64),
  })

  assert.equal(normalizado.ok, true)
  if (!normalizado.ok) return

  const validacao = validarArtefatoNormalizado({
    bytes: bytes(JSON.stringify(normalizado.artefato)),
    hashOriginalEsperado: 'e'.repeat(64),
    hashArtefatoExtraidoEsperado: '7'.repeat(64),
  })

  assert.equal(validacao.ok, false)
  if (!validacao.ok) assert.equal(validacao.codigo, 'ARTEFATO_NORMALIZADO_ORIGEM_DIVERGENTE')
})

function artefatoNormalizadoTexto(conteudo, formato = 'texto') {
  return {
    schema_version: 1,
    formato,
    encoding: 'utf-8',
    metodo: 'normalizacao_tecnica_nfc_v1',
    fonte: {
      nome_arquivo: formato === 'markdown' ? 'ensaio.md' : 'ensaio.txt',
      tipo_mime_registrado: formato === 'markdown' ? 'text/markdown' : 'text/plain',
      hash_sha256_original: 'e'.repeat(64),
      hash_sha256_artefato_extraido: '5'.repeat(64),
    },
    total_paginas: null,
    conteudo,
    normalizacao: {
      unicode: 'NFC',
      quebras_linha: 'LF',
      preserva_espacos_internos: true,
      alteracoes: {
        quebras_crlf_convertidas: 0,
        quebras_cr_isoladas_convertidas: 0,
        segmentos_alterados_nfc: 0,
        caracteres_antes: conteudo.length,
        caracteres_depois: conteudo.length,
      },
    },
  }
}

function artefatoNormalizadoPdf(paginas) {
  return {
    schema_version: 1,
    formato: 'pdf',
    encoding: 'utf-8',
    metodo: 'normalizacao_tecnica_nfc_v1',
    fonte: {
      nome_arquivo: 'livro.pdf',
      tipo_mime_registrado: 'application/pdf',
      hash_sha256_original: 'e'.repeat(64),
      hash_sha256_artefato_extraido: '5'.repeat(64),
    },
    total_paginas: paginas.length,
    paginas,
    normalizacao: {
      unicode: 'NFC',
      quebras_linha: 'LF',
      preserva_espacos_internos: true,
      alteracoes: {
        quebras_crlf_convertidas: 0,
        quebras_cr_isoladas_convertidas: 0,
        segmentos_alterados_nfc: 0,
        caracteres_antes: 0,
        caracteres_depois: 0,
      },
    },
  }
}

function identificarEstrutura(artefato) {
  return identificarEstruturaArtefatoNormalizado({
    bytes: bytes(JSON.stringify(artefato)),
    hashArtefatoNormalizado: '8'.repeat(64),
    hashOriginalEsperado: artefato.fonte.hash_sha256_original,
    hashArtefatoExtraidoEsperado: artefato.fonte.hash_sha256_artefato_extraido,
  })
}

test('identifica cabeçalhos Markdown com nível e marca indícios estruturais de alta confiança', () => {
  const artefato = artefatoNormalizadoTexto(
    '# Capítulo Um\n\nTexto do capítulo.\n\n## Uma seção interna\n\nMais texto.',
    'markdown'
  )
  const resultado = identificarEstrutura(artefato)

  assert.equal(resultado.ok, true)
  if (!resultado.ok) return

  assert.equal(resultado.artefato.possui_indicios_estruturais, true)
  assert.equal(resultado.artefato.unidades.length, 2)
  assert.equal(resultado.artefato.unidades[0].tipo_sinal, 'cabecalho_markdown')
  assert.equal(resultado.artefato.unidades[0].nivel_markdown, 1)
  assert.equal(resultado.artefato.unidades[0].titulo_detectado, 'Capítulo Um')
  assert.equal(resultado.artefato.unidades[1].nivel_markdown, 2)
  assert.equal(resultado.artefato.unidades[0].confianca, 'alta')
})

test('identifica marcadores numerados em texto plano e ignora prosa que apenas menciona a palavra-chave', () => {
  const artefato = artefatoNormalizadoTexto(
    [
      'Capítulo 1',
      '',
      'Tudo começou em uma tarde qualquer.',
      '',
      'Parte civil do processo não é mencionada aqui como título.',
      '',
      'Capítulo II',
      '',
      'A história continua.',
    ].join('\n')
  )

  const resultado = identificarEstrutura(artefato)
  assert.equal(resultado.ok, true)
  if (!resultado.ok) return

  const sinais = resultado.artefato.unidades.filter((u) => u.tipo_sinal === 'marcador_numerado')
  assert.equal(sinais.length, 2)
  assert.equal(sinais[0].tipo_sugerido, 'capitulo')
  assert.equal(sinais[0].titulo_detectado, 'Capítulo 1')
  assert.equal(sinais[1].titulo_detectado, 'Capítulo II')
  assert.equal(
    resultado.artefato.unidades.some((u) => u.titulo_detectado.startsWith('Parte civil')),
    false
  )
})

test('reconhece Prefácio e Posfácio isolados, mas não quando fazem parte de uma frase', () => {
  const artefato = artefatoNormalizadoTexto(
    [
      'Prefácio',
      '',
      'Escrevo estas linhas antes de tudo.',
      '',
      'Este não é o prefácio do livro, apenas uma menção.',
      '',
      'Posfácio',
    ].join('\n')
  )

  const resultado = identificarEstrutura(artefato)
  assert.equal(resultado.ok, true)
  if (!resultado.ok) return

  const isolados = resultado.artefato.unidades.filter((u) => u.tipo_sinal === 'marcador_isolado')
  assert.equal(isolados.length, 2)
  assert.deepEqual(isolados.map((u) => u.tipo_sugerido).sort(), ['posfacio', 'prefacio'])
})

test('em PDF, preserva o número da página de cada sinal detectado', () => {
  const artefato = artefatoNormalizadoPdf([
    { numero: 1, conteudo: 'Capítulo 1\n\nTexto da primeira página.' },
    { numero: 2, conteudo: 'Texto contínuo sem nenhum marcador nesta página.' },
  ])

  const resultado = identificarEstrutura(artefato)
  assert.equal(resultado.ok, true)
  if (!resultado.ok) return

  assert.equal(resultado.artefato.unidades.length, 1)
  assert.equal(resultado.artefato.unidades[0].pagina, 1)
})

test('sem sinais de alta confiança, preserva a incerteza em vez de inventar estrutura', () => {
  const artefato = artefatoNormalizadoTexto(
    'Um texto corrido, sem capítulos nem seções nomeadas, apenas reflexão contínua ao longo de várias linhas.'
  )

  const resultado = identificarEstrutura(artefato)
  assert.equal(resultado.ok, true)
  if (!resultado.ok) return

  assert.equal(resultado.artefato.possui_indicios_estruturais, false)
  assert.equal(resultado.artefato.unidades.length, 0)
})

test('linha inteiramente maiúscula é candidata de baixa confiança, sem tipo definido', () => {
  const artefato = artefatoNormalizadoTexto('INTRODUÇÃO\n\nConteúdo normal do parágrafo aqui.')

  const resultado = identificarEstrutura(artefato)
  assert.equal(resultado.ok, true)
  if (!resultado.ok) return

  assert.equal(resultado.artefato.unidades.length, 1)
  assert.equal(resultado.artefato.unidades[0].tipo_sinal, 'linha_maiuscula_candidata')
  assert.equal(resultado.artefato.unidades[0].confianca, 'baixa')
  assert.equal(resultado.artefato.unidades[0].tipo_sugerido, null)
  assert.equal(resultado.artefato.possui_indicios_estruturais, false)
})

test('identificação de estrutura propaga rejeição quando o artefato normalizado não pertence à execução', () => {
  const artefato = artefatoNormalizadoTexto('Conteúdo qualquer.')

  const resultado = identificarEstruturaArtefatoNormalizado({
    bytes: bytes(JSON.stringify(artefato)),
    hashArtefatoNormalizado: '8'.repeat(64),
    hashOriginalEsperado: '9'.repeat(64),
    hashArtefatoExtraidoEsperado: artefato.fonte.hash_sha256_artefato_extraido,
  })

  assert.equal(resultado.ok, false)
  if (!resultado.ok) assert.equal(resultado.codigo, 'ARTEFATO_NORMALIZADO_ORIGEM_DIVERGENTE')
})

test('validarArtefatoEstrutura aceita a cadeia correta e rejeita proveniência divergente', () => {
  const artefato = artefatoNormalizadoTexto('# Capítulo Um\n\nTexto.', 'markdown')
  const identificacao = identificarEstrutura(artefato)
  assert.equal(identificacao.ok, true)
  if (!identificacao.ok) return

  const bytesEstrutura = bytes(JSON.stringify(identificacao.artefato))

  const valido = validarArtefatoEstrutura({
    bytes: bytesEstrutura,
    hashOriginalEsperado: artefato.fonte.hash_sha256_original,
    hashArtefatoExtraidoEsperado: artefato.fonte.hash_sha256_artefato_extraido,
    hashArtefatoNormalizadoEsperado: '8'.repeat(64),
  })
  assert.equal(valido.ok, true)

  const divergente = validarArtefatoEstrutura({
    bytes: bytesEstrutura,
    hashOriginalEsperado: artefato.fonte.hash_sha256_original,
    hashArtefatoExtraidoEsperado: artefato.fonte.hash_sha256_artefato_extraido,
    hashArtefatoNormalizadoEsperado: 'a'.repeat(64),
  })
  assert.equal(divergente.ok, false)
  if (!divergente.ok) assert.equal(divergente.codigo, 'ARTEFATO_ESTRUTURA_ORIGEM_DIVERGENTE')
})

function unidadeAlta({ tipoSugerido = null, nivelMarkdown = null, titulo, pagina = null }) {
  return {
    ordem: 0,
    tipo_sinal: tipoSugerido ? 'marcador_numerado' : 'cabecalho_markdown',
    tipo_sugerido: tipoSugerido,
    nivel_markdown: nivelMarkdown,
    titulo_detectado: titulo,
    confianca: 'alta',
    pagina,
    indice_inicio: 0,
    indice_fim: 0,
  }
}

function unidadeBaixa(titulo) {
  return {
    ordem: 0,
    tipo_sinal: 'linha_maiuscula_candidata',
    tipo_sugerido: null,
    nivel_markdown: null,
    titulo_detectado: titulo,
    confianca: 'baixa',
    pagina: null,
    indice_inicio: 0,
    indice_fim: 0,
  }
}

test('sem sinais de alta confiança, criar_hierarquia produz uma única seção para o documento inteiro', () => {
  const nos = construirHierarquiaDocumento({
    unidades: [unidadeBaixa('TALVEZ UM TÍTULO')],
    totalPaginas: null,
  })

  assert.equal(nos.length, 1)
  assert.equal(nos[0].secao_pai_id, null)
  assert.equal(nos[0].tipo, 'secao')
  assert.equal(nos[0].nivel_hierarquico, 0)
  assert.equal(nos[0].titulo, null)
})

test('capítulos sem Parte ficam como irmãos no nível raiz', () => {
  const nos = construirHierarquiaDocumento({
    unidades: [
      unidadeAlta({ tipoSugerido: 'capitulo', titulo: 'Capítulo 1' }),
      unidadeAlta({ tipoSugerido: 'capitulo', titulo: 'Capítulo 2' }),
    ],
    totalPaginas: null,
  })

  assert.equal(nos.length, 2)
  assert.equal(nos[0].secao_pai_id, null)
  assert.equal(nos[1].secao_pai_id, null)
  assert.equal(nos[0].ordem, 1)
  assert.equal(nos[1].ordem, 2)
})

test('Parte > Capítulo > Seção > Subseção formam uma cadeia de ancestrais correta', () => {
  const nos = construirHierarquiaDocumento({
    unidades: [
      unidadeAlta({ tipoSugerido: 'parte', titulo: 'Parte I' }),
      unidadeAlta({ tipoSugerido: 'capitulo', titulo: 'Capítulo 1' }),
      unidadeAlta({ tipoSugerido: 'secao', titulo: 'Seção 1.1' }),
      unidadeAlta({ tipoSugerido: 'subsecao', titulo: 'Subseção 1.1.1' }),
    ],
    totalPaginas: null,
  })

  const [parte, capitulo, secao, subsecao] = nos
  assert.equal(parte.secao_pai_id, null)
  assert.equal(capitulo.secao_pai_id, parte.id)
  assert.equal(secao.secao_pai_id, capitulo.id)
  assert.equal(subsecao.secao_pai_id, secao.id)
  assert.deepEqual(
    nos.map((n) => n.nivel_hierarquico),
    [0, 1, 2, 3]
  )
})

test('uma nova Parte fecha a Parte anterior; Capítulo depois dela pertence à nova Parte', () => {
  const nos = construirHierarquiaDocumento({
    unidades: [
      unidadeAlta({ tipoSugerido: 'parte', titulo: 'Parte I' }),
      unidadeAlta({ tipoSugerido: 'capitulo', titulo: 'Capítulo 1' }),
      unidadeAlta({ tipoSugerido: 'parte', titulo: 'Parte II' }),
      unidadeAlta({ tipoSugerido: 'capitulo', titulo: 'Capítulo 2' }),
    ],
    totalPaginas: null,
  })

  const [parteI, capitulo1, parteII, capitulo2] = nos
  assert.equal(capitulo1.secao_pai_id, parteI.id)
  assert.equal(capitulo2.secao_pai_id, parteII.id)
  assert.notEqual(parteI.id, parteII.id)
})

test('Prefácio/Posfácio/Anexo nunca viram pai de capítulo, mesmo aparecendo entre eles', () => {
  const nos = construirHierarquiaDocumento({
    unidades: [
      unidadeAlta({ tipoSugerido: 'prefacio', titulo: 'Prefácio' }),
      unidadeAlta({ tipoSugerido: 'capitulo', titulo: 'Capítulo 1' }),
      unidadeAlta({ tipoSugerido: 'posfacio', titulo: 'Posfácio' }),
      unidadeAlta({ tipoSugerido: 'anexo', titulo: 'Anexo A' }),
    ],
    totalPaginas: null,
  })

  for (const no of nos) {
    assert.equal(no.secao_pai_id, null)
  }
})

test('cabeçalhos Markdown sem tipo_sugerido são mapeados por nível e aninhados', () => {
  const nos = construirHierarquiaDocumento({
    unidades: [
      unidadeAlta({ nivelMarkdown: 1, titulo: 'Capítulo Um' }),
      unidadeAlta({ nivelMarkdown: 2, titulo: 'Uma seção' }),
      unidadeAlta({ nivelMarkdown: 3, titulo: 'Uma subseção' }),
    ],
    totalPaginas: null,
  })

  assert.deepEqual(
    nos.map((n) => n.tipo),
    ['capitulo', 'secao', 'subsecao']
  )
  assert.equal(nos[1].secao_pai_id, nos[0].id)
  assert.equal(nos[2].secao_pai_id, nos[1].id)
})

test('em PDF, a página final de cada seção respeita o início da próxima seção que a encerra', () => {
  const nos = construirHierarquiaDocumento({
    unidades: [
      unidadeAlta({ tipoSugerido: 'capitulo', titulo: 'Capítulo 1', pagina: 1 }),
      unidadeAlta({ tipoSugerido: 'secao', titulo: 'Seção 1.1', pagina: 2 }),
      unidadeAlta({ tipoSugerido: 'capitulo', titulo: 'Capítulo 2', pagina: 5 }),
    ],
    totalPaginas: 8,
  })

  const [capitulo1, secao11, capitulo2] = nos
  assert.equal(capitulo1.pagina_inicial, 1)
  assert.equal(capitulo1.pagina_final, 4) // termina antes do próximo capítulo (pág. 5)
  assert.equal(secao11.pagina_inicial, 2)
  assert.equal(secao11.pagina_final, 4) // termina antes do próximo capítulo, que também fecha a seção
  assert.equal(capitulo2.pagina_inicial, 5)
  assert.equal(capitulo2.pagina_final, 8) // último nó: vai até o fim do documento
})
