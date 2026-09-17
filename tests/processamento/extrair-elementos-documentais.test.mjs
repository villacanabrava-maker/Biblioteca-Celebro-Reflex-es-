import test from 'node:test'
import assert from 'node:assert/strict'
import {
  SCHEMA_SAIDA_EXTRACAO_ELEMENTOS_V1,
  calcularHashEntradaExtracaoElementos,
  extracaoElementosSchema,
  extrairElementosDocumentais,
  montarEntradaExtracaoElementos,
  schemaSaidaExtracaoElementosV1Compativel,
  validarEvidenciasContraFragmento,
} from '../../src/ia/motor-documental/extrair-elementos-documentais.ts'

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

const fragmento = {
  fragmentoId: '11111111-1111-4111-8111-111111111111',
  codigo: 'FRAG-0001',
  secaoId: '22222222-2222-4222-8222-222222222222',
  paginaInicial: 3,
  paginaFinal: 3,
  conteudo: 'Partimos de uma experiência concreta e depois elaboramos o conceito de esperança.',
  conteudoContextualizado:
    'Capítulo 1 > Seção 1\n\nPartimos de uma experiência concreta e depois elaboramos o conceito de esperança.',
}

const entrada = {
  documentoProcessadoId: '33333333-3333-4333-8333-333333333333',
  sinteseObra: 'A obra articula experiência e elaboração conceitual.',
  fragmento,
}

const elementoValido = {
  tipo: 'tema',
  plano_analitico: 'conteudo',
  titulo: 'Esperança',
  descricao: 'A esperança aparece como conceito elaborado a partir da experiência.',
  importancia: 0.8,
  confianca: 0.9,
  evidencias: [
    {
      trecho_referencia: 'conceito de esperança',
      forca_evidencia: 0.95,
      justificativa: null,
    },
  ],
}

test('entrada e hash da extração são determinísticos', () => {
  assert.equal(montarEntradaExtracaoElementos(entrada), montarEntradaExtracaoElementos(entrada))
  assert.equal(
    calcularHashEntradaExtracaoElementos(entrada),
    calcularHashEntradaExtracaoElementos(entrada)
  )
})

test('conteúdo documental é encapsulado explicitamente como dado não confiável', () => {
  const payload = JSON.parse(montarEntradaExtracaoElementos(entrada))
  assert.match(payload.aviso, /dado nao confiavel/i)
  assert.equal(payload.fragmento.codigo, fragmento.codigo)
  assert.equal(payload.fragmento.conteudo_fonte, fragmento.conteudo)
  assert.equal(payload.fragmento.contexto_hierarquico, fragmento.conteudoContextualizado)
  assert.equal('fragmento_id' in payload.fragmento, false)
})

test('schema exige plano analítico e pelo menos uma evidência', () => {
  const resultado = extracaoElementosSchema.safeParse({ elementos: [elementoValido] })
  assert.equal(resultado.success, true)
})

test('fragmento da evidência é controlado pelo sistema, não pelo modelo', () => {
  const resultado = extracaoElementosSchema.safeParse({
    elementos: [
      {
        ...elementoValido,
        evidencias: [
          {
            fragmento_id: '44444444-4444-4444-8444-444444444444',
            trecho_referencia: 'conceito de esperança',
            forca_evidencia: 0.9,
            justificativa: null,
          },
        ],
      },
    ],
  })

  assert.equal(resultado.success, false)
})

test('trecho de evidência precisa existir literalmente no fragmento corrente', () => {
  const resultado = validarEvidenciasContraFragmento(
    [
      {
        tipo: 'estrutura_argumentativa',
        plano_analitico: 'metodo',
        titulo: 'Do concreto ao conceito',
        descricao: 'Parte da experiência e avança para elaboração conceitual.',
        importancia: 0.9,
        confianca: 0.95,
        evidencias: [
          {
            trecho_referencia: 'trecho que não existe',
            forca_evidencia: 0.9,
            justificativa: null,
          },
        ],
      },
    ],
    fragmento
  )

  assert.deepEqual(resultado, {
    ok: false,
    motivo: 'evidencia_trecho_nao_encontrado_no_fragmento',
  })
})

test('trecho literal válido é aceito no fragmento corrente', () => {
  const resultado = validarEvidenciasContraFragmento([elementoValido], fragmento)
  assert.deepEqual(resultado, { ok: true })
})

test('separação conteúdo, método e expressão é enum fechado', () => {
  const base = {
    ...elementoValido,
    plano_analitico: undefined,
  }
  delete base.plano_analitico

  assert.equal(
    extracaoElementosSchema.safeParse({ elementos: [{ ...base, plano_analitico: 'conteudo' }] }).success,
    true
  )
  assert.equal(
    extracaoElementosSchema.safeParse({ elementos: [{ ...base, plano_analitico: 'metodo' }] }).success,
    true
  )
  assert.equal(
    extracaoElementosSchema.safeParse({ elementos: [{ ...base, plano_analitico: 'expressao' }] }).success,
    true
  )
  assert.equal(
    extracaoElementosSchema.safeParse({ elementos: [{ ...base, plano_analitico: 'outro' }] }).success,
    false
  )
})

test('schema persistido precisa coincidir exatamente com o contrato v1', () => {
  assert.equal(schemaSaidaExtracaoElementosV1Compativel(SCHEMA_SAIDA_EXTRACAO_ELEMENTOS_V1), true)

  const divergente = structuredClone(SCHEMA_SAIDA_EXTRACAO_ELEMENTOS_V1)
  divergente.properties.elementos.maxItems = 31
  assert.equal(schemaSaidaExtracaoElementosV1Compativel(divergente), false)
})

test('motor usa store false, evidência local e registra custo sem API real', async () => {
  const fake = clienteFalso({
    id: 'resp_elementos_fake_1',
    output_parsed: { elementos: [elementoValido] },
    usage: {
      input_tokens: 1_000,
      output_tokens: 100,
      input_tokens_details: { cached_tokens: 200 },
    },
  })

  const resultado = await extrairElementosDocumentais({
    cliente: fake.cliente,
    modelo: 'gpt-5.6-terra',
    promptSistema: 'Prompt de extração versionado.',
    entrada,
  })

  assert.equal(resultado.ok, true)
  if (!resultado.ok) return

  assert.equal(resultado.fragmentoId, fragmento.fragmentoId)
  assert.equal(resultado.responseId, 'resp_elementos_fake_1')
  assert.equal(resultado.tokensEntrada, 1_000)
  assert.equal(resultado.tokensSaida, 100)
  assert.equal(resultado.tokensEntradaCache, 200)
  assert.equal(resultado.custoEstimadoUsd, 0.00284)
  assert.equal(fake.chamadas.length, 1)
  assert.equal(fake.chamadas[0].model, 'gpt-5.6-terra')
  assert.equal(fake.chamadas[0].store, false)
  assert.equal(fake.chamadas[0].instructions, 'Prompt de extração versionado.')
  assert.equal(fake.chamadas[0].max_output_tokens, 12_000)
  assert.ok(fake.chamadas[0].text?.format)
})
