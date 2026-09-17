import test from 'node:test'
import assert from 'node:assert/strict'
import {
  SCHEMA_SAIDA_RELACOES_ELEMENTOS_V1,
  calcularHashEntradaRelacoes,
  inferirRelacoesElementos,
  montarEntradaRelacoesElementos,
  schemaSaidaRelacoesElementosV1Compativel,
  validarRelacoesContraElementos,
} from '../../src/ia/motor-documental/inferir-relacoes-elementos.ts'

function clienteFalso(resposta) {
  const chamadas = []
  return {
    chamadas,
    cliente: {
      responses: {
        async parse(parametros) {
          chamadas.push(parametros)
          return resposta
        },
      },
    },
  }
}

const fragmentoId = '11111111-1111-4111-8111-111111111111'
const argumentoId = '22222222-2222-4222-8222-222222222222'
const teseId = '33333333-3333-4333-8333-333333333333'

const argumento = {
  elementoId: argumentoId,
  codigo: 'ELM-FRG-001-001',
  tipo: 'argumento',
  planoAnalitico: 'conteudo',
  titulo: 'A experiência concreta sustenta a tese',
  descricao: 'O autor oferece uma experiência como fundamento.',
  evidencias: ['A experiência mostra por que essa tese se sustenta.'],
}

const tese = {
  elementoId: teseId,
  codigo: 'ELM-FRG-001-002',
  tipo: 'tese',
  planoAnalitico: 'conteudo',
  titulo: 'Tese central',
  descricao: 'A tese defendida no fragmento.',
  evidencias: ['Defendo, portanto, que a experiência precede a abstração.'],
}

const entrada = {
  fragmentoId,
  fragmentoCodigo: 'FRG-001',
  elementos: [argumento, tese],
}

test('entrada e hash de relações são determinísticos', () => {
  assert.equal(montarEntradaRelacoesElementos(entrada), montarEntradaRelacoesElementos(entrada))
  assert.equal(calcularHashEntradaRelacoes(entrada), calcularHashEntradaRelacoes(entrada))
})

test('schema persistido precisa coincidir exatamente com o contrato v1', () => {
  assert.equal(
    schemaSaidaRelacoesElementosV1Compativel(SCHEMA_SAIDA_RELACOES_ELEMENTOS_V1),
    true
  )

  const divergente = structuredClone(SCHEMA_SAIDA_RELACOES_ELEMENTOS_V1)
  divergente.properties.relacoes.maxItems = 81
  assert.equal(schemaSaidaRelacoesElementosV1Compativel(divergente), false)
})

test('fragmento com menos de dois elementos não chama IA e custa zero', async () => {
  const fake = clienteFalso({})
  const resultado = await inferirRelacoesElementos({
    cliente: fake.cliente,
    modelo: 'gpt-5.6-terra',
    promptSistema: 'não deve ser usado',
    entrada: { ...entrada, elementos: [argumento] },
  })

  assert.equal(resultado.ok, true)
  assert.equal(resultado.origem, 'deterministica_sem_pares')
  assert.deepEqual(resultado.relacoes, [])
  assert.equal(resultado.custoEstimadoUsd, 0)
  assert.equal(fake.chamadas.length, 0)
})

test('rejeita IDs fora dos elementos fornecidos', () => {
  const validacao = validarRelacoesContraElementos(
    [
      {
        elemento_origem_id: argumentoId,
        tipo_relacao: 'sustenta',
        elemento_destino_id: '44444444-4444-4444-8444-444444444444',
        confianca: 0.9,
        justificativa: 'Destino inexistente na entrada.',
      },
    ],
    entrada.elementos
  )

  assert.deepEqual(validacao, { ok: false, motivo: 'elemento_destino_fora_do_fragmento' })
})

test('rejeita relação reflexiva e relação duplicada', () => {
  const reflexiva = validarRelacoesContraElementos(
    [
      {
        elemento_origem_id: argumentoId,
        tipo_relacao: 'expande',
        elemento_destino_id: argumentoId,
        confianca: 0.7,
        justificativa: 'Inválida.',
      },
    ],
    entrada.elementos
  )
  assert.deepEqual(reflexiva, { ok: false, motivo: 'relacao_reflexiva' })

  const relacao = {
    elemento_origem_id: argumentoId,
    tipo_relacao: 'sustenta',
    elemento_destino_id: teseId,
    confianca: 0.92,
    justificativa: 'O argumento oferece fundamento direto para a tese.',
  }
  const duplicada = validarRelacoesContraElementos([relacao, relacao], entrada.elementos)
  assert.deepEqual(duplicada, { ok: false, motivo: 'relacao_duplicada' })
})

test('motor usa Structured Output, store false e aceita saída vazia', async () => {
  const fake = clienteFalso({
    id: 'resp_relacoes_vazia',
    output_parsed: { relacoes: [] },
    usage: {
      input_tokens: 500,
      output_tokens: 40,
      input_tokens_details: { cached_tokens: 50 },
    },
  })

  const resultado = await inferirRelacoesElementos({
    cliente: fake.cliente,
    modelo: 'gpt-5.6-terra',
    promptSistema: 'Prompt versionado.',
    entrada,
  })

  assert.equal(resultado.ok, true)
  assert.equal(resultado.origem, 'ia')
  assert.deepEqual(resultado.relacoes, [])
  assert.equal(fake.chamadas.length, 1)
  assert.equal(fake.chamadas[0].store, false)
  assert.equal(fake.chamadas[0].max_output_tokens, 8_000)
  assert.ok(fake.chamadas[0].text?.format)
})

test('motor preserva direção e contabiliza uma relação válida sem API real', async () => {
  const relacao = {
    elemento_origem_id: argumentoId,
    tipo_relacao: 'sustenta',
    elemento_destino_id: teseId,
    confianca: 0.93,
    justificativa: 'O argumento fornece fundamento explícito para a tese.',
  }
  const fake = clienteFalso({
    id: 'resp_relacoes_1',
    output_parsed: { relacoes: [relacao] },
    usage: {
      input_tokens: 900,
      output_tokens: 160,
      input_tokens_details: { cached_tokens: 100 },
    },
  })

  const resultado = await inferirRelacoesElementos({
    cliente: fake.cliente,
    modelo: 'gpt-5.6-terra',
    promptSistema: 'Prompt versionado.',
    entrada,
  })

  assert.equal(resultado.ok, true)
  assert.equal(resultado.origem, 'ia')
  assert.deepEqual(resultado.relacoes, [relacao])
  assert.equal(resultado.responseId, 'resp_relacoes_1')
  assert.equal(resultado.tokensEntrada, 900)
  assert.equal(resultado.tokensSaida, 160)
  assert.equal(resultado.tokensEntradaCache, 100)
  assert.equal(resultado.custoEstimadoUsd, 0.00354)
})
