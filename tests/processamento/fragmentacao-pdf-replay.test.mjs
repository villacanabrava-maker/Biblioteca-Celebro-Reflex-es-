import test from 'node:test'
import assert from 'node:assert/strict'
import { construirHierarquiaDocumento } from '../../src/dominios/processamento/criar-hierarquia.ts'
import {
  fragmentosPersistidosCorrespondem,
  montarFragmentosDocumento,
} from '../../src/dominios/processamento/criar-fragmentos.ts'

function unidade({ titulo, tipo, pagina, offset }) {
  return {
    ordem: 0,
    tipo_sinal: 'marcador_numerado',
    tipo_sugerido: tipo,
    nivel_markdown: null,
    titulo_detectado: titulo,
    confianca: 'alta',
    pagina,
    indice_inicio: offset,
    indice_fim: offset + titulo.length,
  }
}

function artefatoPdf(paginas) {
  return {
    schema_version: 1,
    formato: 'pdf',
    encoding: 'utf-8',
    metodo: 'normalizacao_tecnica_nfc_v1',
    fonte: {
      nome_arquivo: 'livro.pdf',
      tipo_mime_registrado: 'application/pdf',
      hash_sha256_original: 'a'.repeat(64),
      hash_sha256_artefato_extraido: 'b'.repeat(64),
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
      },
    },
  }
}

function comoSecoes(nos) {
  return nos.map((no) => ({
    secao_id: no.id,
    secao_pai_id: no.secao_pai_id,
    codigo: no.codigo,
    tipo: no.tipo,
    titulo: no.titulo,
    ordem: no.ordem,
    pagina_inicial: no.pagina_inicial,
    pagina_final: no.pagina_final,
    indice_inicio: no.indice_inicio,
    indice_fim: no.indice_fim,
    offset_pagina_inicio: no.offset_pagina_inicio,
  }))
}

test('PDF com duas seções na mesma página usa offsets e não duplica conteúdo', () => {
  const conteudo = 'Capítulo 1\nTexto A.\nSeção 1.1\nTexto B.'
  const offsetSecao = conteudo.indexOf('Seção 1.1')
  const nos = construirHierarquiaDocumento({
    unidades: [
      unidade({ titulo: 'Capítulo 1', tipo: 'capitulo', pagina: 1, offset: 0 }),
      unidade({ titulo: 'Seção 1.1', tipo: 'secao', pagina: 1, offset: offsetSecao }),
    ],
    totalPaginas: 1,
    totalCaracteres: null,
  })

  assert.equal(nos[0].offset_pagina_inicio, 0)
  assert.equal(nos[1].offset_pagina_inicio, offsetSecao)

  const fragmentos = montarFragmentosDocumento({
    secoes: comoSecoes(nos),
    normalizado: artefatoPdf([{ numero: 1, conteudo }]),
  })

  assert.equal(fragmentos.length, 2)
  assert.match(fragmentos[0].conteudo, /Texto A\./)
  assert.equal(fragmentos[0].conteudo.includes('Seção 1.1'), false)
  assert.equal(fragmentos[0].conteudo.includes('Texto B.'), false)
  assert.match(fragmentos[1].conteudo, /Seção 1\.1/)
  assert.match(fragmentos[1].conteudo, /Texto B\./)
})

test('PDF preserva continuação no começo da página onde a próxima seção inicia no meio', () => {
  const pagina1 = 'Capítulo 1\nTexto da página 1.'
  const pagina2 = 'Continuação do capítulo 1.\nCapítulo 2\nTexto do capítulo 2.'
  const offsetCapitulo2 = pagina2.indexOf('Capítulo 2')
  const nos = construirHierarquiaDocumento({
    unidades: [
      unidade({ titulo: 'Capítulo 1', tipo: 'capitulo', pagina: 1, offset: 0 }),
      unidade({ titulo: 'Capítulo 2', tipo: 'capitulo', pagina: 2, offset: offsetCapitulo2 }),
    ],
    totalPaginas: 2,
    totalCaracteres: null,
  })

  const fragmentos = montarFragmentosDocumento({
    secoes: comoSecoes(nos),
    normalizado: artefatoPdf([
      { numero: 1, conteudo: pagina1 },
      { numero: 2, conteudo: pagina2 },
    ]),
  })

  assert.equal(fragmentos.length, 2)
  assert.match(fragmentos[0].conteudo, /Texto da página 1\./)
  assert.match(fragmentos[0].conteudo, /Continuação do capítulo 1\./)
  assert.equal(fragmentos[0].conteudo.includes('Capítulo 2'), false)
  assert.equal(fragmentos[0].pagina_final, 2)
  assert.match(fragmentos[1].conteudo, /Capítulo 2/)
  assert.match(fragmentos[1].conteudo, /Texto do capítulo 2\./)
})

test('replay só aceita fragmentos persistidos que correspondem exatamente ao resultado determinístico', () => {
  const normalizado = artefatoPdf([{ numero: 1, conteudo: 'Capítulo 1\nTexto.' }])
  const nos = construirHierarquiaDocumento({
    unidades: [unidade({ titulo: 'Capítulo 1', tipo: 'capitulo', pagina: 1, offset: 0 })],
    totalPaginas: 1,
    totalCaracteres: null,
  })
  const esperados = montarFragmentosDocumento({ secoes: comoSecoes(nos), normalizado })
  const persistidos = esperados.map(({ id: _id, ...fragmento }) => fragmento)

  assert.equal(fragmentosPersistidosCorrespondem(esperados, persistidos), true)

  const divergentes = persistidos.map((fragmento, indice) =>
    indice === 0 ? { ...fragmento, conteudo: `${fragmento.conteudo} alterado` } : fragmento
  )
  assert.equal(fragmentosPersistidosCorrespondem(esperados, divergentes), false)
  assert.equal(fragmentosPersistidosCorrespondem(esperados, []), false)
})
