import assert from 'node:assert/strict'
import test from 'node:test'
import {
  extrairTextoUtf8,
  LIMITES_EXTRACAO,
} from '../../src/dominios/processamento/extrair-conteudo.ts'

const encoder = new TextEncoder()

function baseTexto(dados: Uint8Array) {
  return {
    dados,
    formato: 'texto' as const,
    nomeArquivo: 'reflexao.txt',
    tipoMimeRegistrado: 'text/plain',
    hashSha256Original: 'a'.repeat(64),
  }
}

test('extrai texto UTF-8 e preserva conteúdo para a normalização posterior', () => {
  const resultado = extrairTextoUtf8(
    baseTexto(encoder.encode('Primeira linha.\nSegunda linha com ação e síntese.'))
  )

  assert.equal(resultado.ok, true)
  if (resultado.ok) {
    assert.equal(resultado.artefato.formato, 'texto')
    assert.equal(resultado.artefato.metodo, 'utf8_deterministico')
    assert.equal(resultado.artefato.conteudo?.includes('ação e síntese'), true)
    assert.equal(resultado.quantidadePaginas, null)
  }
})

test('remove apenas BOM UTF-8 inicial', () => {
  const dados = new Uint8Array([0xef, 0xbb, 0xbf, ...encoder.encode('Texto com BOM')])
  const resultado = extrairTextoUtf8(baseTexto(dados))

  assert.equal(resultado.ok, true)
  if (resultado.ok) assert.equal(resultado.artefato.conteudo, 'Texto com BOM')
})

test('rejeita arquivo completo com UTF-8 inválido', () => {
  const resultado = extrairTextoUtf8(baseTexto(new Uint8Array([0xc3, 0x28])))

  assert.equal(resultado.ok, false)
  if (!resultado.ok) assert.equal(resultado.codigo, 'CONTEUDO_TEXTO_INVALIDO')
})

test('rejeita conteúdo textual vazio', () => {
  const resultado = extrairTextoUtf8(baseTexto(encoder.encode('  \n\r\t  ')))

  assert.equal(resultado.ok, false)
  if (!resultado.ok) assert.equal(resultado.codigo, 'CONTEUDO_VAZIO')
})

test('limites operacionais são finitos e positivos', () => {
  assert.ok(LIMITES_EXTRACAO.originalTextoBytes > 0)
  assert.ok(LIMITES_EXTRACAO.originalPdfBytes > LIMITES_EXTRACAO.originalTextoBytes)
  assert.ok(LIMITES_EXTRACAO.paginasPdf > 0)
  assert.ok(LIMITES_EXTRACAO.tempoPdfMs > 0)
})
