import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calcularHashEntradaExtracaoElementos,
  extracaoElementosSchema,
  montarEntradaExtracaoElementos,
  validarEvidenciasContraFragmentos,
} from '../../src/ia/motor-documental/extrair-elementos-documentais.ts'

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
  fragmentos: [fragmento],
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
  assert.equal(payload.fragmentos[0].fragmento_id, fragmento.fragmentoId)
  assert.equal(payload.fragmentos[0].conteudo, fragmento.conteudoContextualizado)
})

test('schema exige plano analítico e pelo menos uma evidência', () => {
  const resultado = extracaoElementosSchema.safeParse({
    elementos: [
      {
        tipo: 'tema',
        plano_analitico: 'conteudo',
        titulo: 'Esperança',
        descricao: 'A esperança aparece como conceito elaborado a partir da experiência.',
        importancia: 0.8,
        confianca: 0.9,
        evidencias: [
          {
            fragmento_id: fragmento.fragmentoId,
            trecho_referencia: 'conceito de esperança',
            forca_evidencia: 0.95,
            justificativa: null,
          },
        ],
      },
    ],
  })

  assert.equal(resultado.success, true)
})

test('evidência precisa apontar para fragmento existente', () => {
  const resultado = validarEvidenciasContraFragmentos(
    [
      {
        tipo: 'tema',
        plano_analitico: 'conteudo',
        titulo: 'Esperança',
        descricao: 'Tema identificado.',
        importancia: 0.8,
        confianca: 0.9,
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
    [fragmento]
  )

  assert.deepEqual(resultado, { ok: false, motivo: 'evidencia_fragmento_inexistente' })
})

test('trecho de evidência precisa existir literalmente no fragmento', () => {
  const resultado = validarEvidenciasContraFragmentos(
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
            fragmento_id: fragmento.fragmentoId,
            trecho_referencia: 'trecho que não existe',
            forca_evidencia: 0.9,
            justificativa: null,
          },
        ],
      },
    ],
    [fragmento]
  )

  assert.deepEqual(resultado, {
    ok: false,
    motivo: 'evidencia_trecho_nao_encontrado_no_fragmento',
  })
})

test('separação conteúdo, método e expressão é enum fechado', () => {
  const base = {
    tipo: 'tema',
    titulo: 'Teste',
    descricao: 'Teste',
    importancia: 0.5,
    confianca: 0.5,
    evidencias: [
      {
        fragmento_id: fragmento.fragmentoId,
        trecho_referencia: 'conceito de esperança',
        forca_evidencia: 0.8,
        justificativa: null,
      },
    ],
  }

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
