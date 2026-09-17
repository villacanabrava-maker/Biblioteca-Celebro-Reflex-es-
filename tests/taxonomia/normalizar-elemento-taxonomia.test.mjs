import test from 'node:test'
import assert from 'node:assert/strict'
import {
  SCHEMA_SAIDA_NORMALIZACAO_TAXONOMIA_V1,
  calcularHashEntradaTaxonomia,
  montarEntradaNormalizacaoTaxonomia,
  normalizarElementoTaxonomia,
  schemaSaidaNormalizacaoTaxonomiaV1Compativel,
  validarDecisaoContraCandidatos,
} from '../../src/ia/taxonomia/normalizar-elemento-taxonomia.ts'

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

const elemento = {
  elementoId: '11111111-1111-4111-8111-111111111111',
  codigo: 'ELM-0001',
  tipo: 'conceito',
  planoAnalitico: 'conteudo',
  titulo: 'Esperança',
  descricao: 'Elaboração conceitual sobre esperança.',
}

const candidato = {
  conceitoId: '22222222-2222-4222-8222-222222222222',
  termoPreferencial: 'Esperança',
  definicao: 'Conceito canônico de esperança.',
  dominio: 'intelectual',
  termoCorrespondente: 'Esperança',
  tipoTermo: 'preferencial',
  tipoCorrespondencia: 'similaridade',
  similaridade: 0.92,
}

test('entrada e hash taxonômicos são determinísticos', () => {
  const entrada = { elemento, candidatos: [candidato] }
  assert.equal(montarEntradaNormalizacaoTaxonomia(entrada), montarEntradaNormalizacaoTaxonomia(entrada))
  assert.equal(calcularHashEntradaTaxonomia(entrada), calcularHashEntradaTaxonomia(entrada))
})

test('schema persistido precisa coincidir exatamente com o contrato v1', () => {
  assert.equal(
    schemaSaidaNormalizacaoTaxonomiaV1Compativel(SCHEMA_SAIDA_NORMALIZACAO_TAXONOMIA_V1),
    true
  )

  const divergente = structuredClone(SCHEMA_SAIDA_NORMALIZACAO_TAXONOMIA_V1)
  divergente.properties.confianca.maximum = 2
  assert.equal(schemaSaidaNormalizacaoTaxonomiaV1Compativel(divergente), false)
})

test('match exato único reutiliza conceito sem chamar IA e sem custo', async () => {
  const exato = { ...candidato, tipoCorrespondencia: 'exata', similaridade: 1 }
  const fake = clienteFalso({})

  const resultado = await normalizarElementoTaxonomia({
    cliente: fake.cliente,
    modelo: 'gpt-5.6-terra',
    promptSistema: 'não deve ser usado',
    entrada: { elemento, candidatos: [exato] },
  })

  assert.equal(resultado.ok, true)
  assert.equal(resultado.origem, 'deterministica_exata')
  assert.equal(resultado.decisao.conceito_id, exato.conceitoId)
  assert.equal(resultado.custoEstimadoUsd, 0)
  assert.equal(fake.chamadas.length, 0)
})

test('dois conceitos com match exato são ambíguos e exigem decisão estruturada', async () => {
  const exatoA = { ...candidato, tipoCorrespondencia: 'exata', similaridade: 1 }
  const exatoB = {
    ...exatoA,
    conceitoId: '44444444-4444-4444-8444-444444444444',
    definicao: 'Outro conceito canônico com o mesmo termo normalizado.',
  }
  const fake = clienteFalso({
    id: 'resp_taxonomia_ambigua',
    output_parsed: {
      decisao: 'reutilizar_conceito',
      conceito_id: exatoA.conceitoId,
      proposta: null,
      papel: 'principal',
      confianca: 0.8,
      justificativa: 'A definição do primeiro candidato representa melhor o elemento.',
    },
    usage: {
      input_tokens: 300,
      output_tokens: 80,
      input_tokens_details: { cached_tokens: 0 },
    },
  })

  const resultado = await normalizarElementoTaxonomia({
    cliente: fake.cliente,
    modelo: 'gpt-5.6-terra',
    promptSistema: 'Resolver somente entre candidatos fornecidos.',
    entrada: { elemento, candidatos: [exatoA, exatoB] },
  })

  assert.equal(resultado.ok, true)
  assert.equal(resultado.origem, 'ia')
  assert.equal(fake.chamadas.length, 1)
})

test('IA não pode reutilizar conceito fora da shortlist', () => {
  const resultado = validarDecisaoContraCandidatos(
    {
      decisao: 'reutilizar_conceito',
      conceito_id: '33333333-3333-4333-8333-333333333333',
      proposta: null,
      papel: 'principal',
      confianca: 0.9,
      justificativa: 'Parecido.',
    },
    [candidato]
  )

  assert.deepEqual(resultado, { ok: false, motivo: 'conceito_id_fora_da_shortlist' })
})

test('proposta exige conceito_id nulo e objeto de proposta', () => {
  const valido = validarDecisaoContraCandidatos(
    {
      decisao: 'propor_conceito',
      conceito_id: null,
      proposta: {
        termo_preferencial: 'Esperança situada',
        definicao: 'Proposta restrita ao elemento analisado.',
        dominio: 'intelectual',
      },
      papel: 'principal',
      confianca: 0.8,
      justificativa: 'Nenhum candidato representa adequadamente o elemento.',
    },
    []
  )

  assert.deepEqual(valido, { ok: true })
})

test('motor usa Structured Output, store false e contabiliza custo sem API real', async () => {
  const fake = clienteFalso({
    id: 'resp_taxonomia_fake_1',
    output_parsed: {
      decisao: 'reutilizar_conceito',
      conceito_id: candidato.conceitoId,
      proposta: null,
      papel: 'principal',
      confianca: 0.93,
      justificativa: 'O candidato cobre semanticamente o elemento.',
    },
    usage: {
      input_tokens: 800,
      output_tokens: 120,
      input_tokens_details: { cached_tokens: 100 },
    },
  })

  const resultado = await normalizarElementoTaxonomia({
    cliente: fake.cliente,
    modelo: 'gpt-5.6-terra',
    promptSistema: 'Prompt taxonômico versionado.',
    entrada: { elemento, candidatos: [candidato] },
  })

  assert.equal(resultado.ok, true)
  assert.equal(resultado.origem, 'ia')
  assert.equal(resultado.decisao.conceito_id, candidato.conceitoId)
  assert.equal(resultado.responseId, 'resp_taxonomia_fake_1')
  assert.equal(resultado.tokensEntrada, 800)
  assert.equal(resultado.tokensSaida, 120)
  assert.equal(resultado.tokensEntradaCache, 100)
  assert.equal(resultado.custoEstimadoUsd, 0.00282)
  assert.equal(fake.chamadas.length, 1)
  assert.equal(fake.chamadas[0].model, 'gpt-5.6-terra')
  assert.equal(fake.chamadas[0].store, false)
  assert.equal(fake.chamadas[0].max_output_tokens, 4_000)
  assert.ok(fake.chamadas[0].text?.format)
})
