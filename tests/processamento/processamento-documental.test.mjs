import test from 'node:test'
import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { identificarFormatoDocumento } from '../../src/dominios/processamento/identificar-formato.ts'
import {
  extrairTextoPdf,
  extrairTextoUtf8,
} from '../../src/dominios/processamento/extrair-conteudo.ts'

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
