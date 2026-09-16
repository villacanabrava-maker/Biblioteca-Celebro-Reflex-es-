import assert from 'node:assert/strict'
import test from 'node:test'
import { identificarFormatoDocumento } from '../../src/dominios/processamento/identificar-formato.ts'

const encoder = new TextEncoder()

test('reconhece PDF apenas quando extensão, MIME e assinatura são coerentes', () => {
  const resultado = identificarFormatoDocumento({
    nomeArquivo: 'livro.pdf',
    mimeRegistrado: 'application/pdf',
    amostra: encoder.encode('%PDF-1.7\n1 0 obj\n'),
  })

  assert.equal(resultado.suportado, true)
  if (resultado.suportado) assert.equal(resultado.formato, 'pdf')
})

test('rejeita arquivo .pdf cuja assinatura não é PDF', () => {
  const resultado = identificarFormatoDocumento({
    nomeArquivo: 'livro.pdf',
    mimeRegistrado: 'application/pdf',
    amostra: encoder.encode('isto não é um PDF'),
  })

  assert.equal(resultado.suportado, false)
  if (!resultado.suportado) assert.equal(resultado.motivo, 'assinatura_incompativel')
})

test('reconhece TXT UTF-8 válido', () => {
  const resultado = identificarFormatoDocumento({
    nomeArquivo: 'reflexao.txt',
    mimeRegistrado: 'text/plain; charset=utf-8',
    amostra: encoder.encode('Uma reflexão autoral com acentuação: ação, síntese.'),
  })

  assert.equal(resultado.suportado, true)
  if (resultado.suportado) assert.equal(resultado.formato, 'texto')
})

test('rejeita conteúdo binário disfarçado de texto', () => {
  const resultado = identificarFormatoDocumento({
    nomeArquivo: 'arquivo.txt',
    mimeRegistrado: 'text/plain',
    amostra: new Uint8Array([0x41, 0x00, 0x42]),
  })

  assert.equal(resultado.suportado, false)
  if (!resultado.suportado) assert.equal(resultado.motivo, 'conteudo_binario_em_texto')
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
