import test from 'node:test'
import assert from 'node:assert/strict'
import {
  construirEntradaObra,
  construirEntradaSecao,
  ordenarSecoesParaSintese,
  tipoAlvoDaSecao,
} from '../../src/dominios/processamento/criar-sinteses.ts'

function secao(overrides = {}) {
  return {
    secao_id: 'secao-base',
    secao_pai_id: null,
    codigo: 'SEC-0001',
    tipo: 'secao',
    titulo: 'Seção base',
    ordem: 1,
    nivel_hierarquico: 0,
    ...overrides,
  }
}

test('seções mais profundas são sintetizadas antes dos containers', () => {
  const ordenadas = ordenarSecoesParaSintese([
    secao({ secao_id: 'cap', tipo: 'capitulo', nivel_hierarquico: 0, ordem: 1 }),
    secao({ secao_id: 'sub', tipo: 'subsecao', nivel_hierarquico: 2, ordem: 3 }),
    secao({ secao_id: 'sec', nivel_hierarquico: 1, ordem: 2 }),
  ])

  assert.deepEqual(ordenadas.map((item) => item.secao_id), ['sub', 'sec', 'cap'])
})

test('tipo de alvo preserva parte/capítulo e agrupa folhas como seção', () => {
  assert.equal(tipoAlvoDaSecao(secao({ tipo: 'parte' })), 'parte')
  assert.equal(tipoAlvoDaSecao(secao({ tipo: 'capitulo' })), 'capitulo')
  assert.equal(tipoAlvoDaSecao(secao({ tipo: 'subsecao' })), 'secao')
  assert.equal(tipoAlvoDaSecao(secao({ tipo: 'prefacio' })), 'secao')
})

test('entrada de uma seção combina texto próprio e sínteses dos filhos diretos', () => {
  const pai = secao({ secao_id: 'pai', tipo: 'capitulo', titulo: 'Capítulo 1' })
  const filha = secao({
    secao_id: 'filha',
    secao_pai_id: 'pai',
    codigo: 'SEC-0002',
    titulo: 'Seção 1.1',
    nivel_hierarquico: 1,
    ordem: 2,
  })

  const entrada = construirEntradaSecao({
    secao: pai,
    fragmento: { secao_id: 'pai', ordem: 1, conteudo: 'Introdução própria do capítulo.' },
    filhos: [
      {
        secao: filha,
        sintese: {
          tipoAlvo: 'secao',
          alvoId: 'filha',
          tituloAlvo: 'Seção 1.1',
          conteudo: 'Síntese da seção filha.',
          nivel: 1,
        },
      },
    ],
  })

  assert.ok(entrada)
  assert.equal(entrada.tipoAlvo, 'capitulo')
  const fonte = JSON.parse(entrada.conteudoFonte)
  assert.equal(fonte.texto_proprio_da_secao, 'Introdução própria do capítulo.')
  assert.equal(fonte.sinteses_dos_filhos_diretos.length, 1)
  assert.equal(fonte.sinteses_dos_filhos_diretos[0].sintese, 'Síntese da seção filha.')
})

test('seção sem texto próprio e sem filhos não cria chamada de IA', () => {
  const entrada = construirEntradaSecao({ secao: secao(), fragmento: null, filhos: [] })
  assert.equal(entrada, null)
})

test('síntese da obra usa apenas sínteses de seções de topo em ordem', () => {
  const a = secao({ secao_id: 'a', codigo: 'SEC-A', titulo: 'A', ordem: 1 })
  const b = secao({ secao_id: 'b', codigo: 'SEC-B', titulo: 'B', ordem: 2 })
  const mapa = new Map([
    ['a', { tipoAlvo: 'secao', alvoId: 'a', tituloAlvo: 'A', conteudo: 'Resumo A', nivel: 0 }],
    ['b', { tipoAlvo: 'secao', alvoId: 'b', tituloAlvo: 'B', conteudo: 'Resumo B', nivel: 0 }],
  ])

  const entrada = construirEntradaObra({
    documentoTitulo: 'Obra teste',
    secoesTopo: [b, a],
    sintesesPorSecao: mapa,
  })

  assert.ok(entrada)
  assert.equal(entrada.tipoAlvo, 'obra')
  const fonte = JSON.parse(entrada.conteudoFonte)
  assert.deepEqual(
    fonte.sinteses_das_secoes_de_topo.map((item) => item.codigo),
    ['SEC-A', 'SEC-B']
  )
})
