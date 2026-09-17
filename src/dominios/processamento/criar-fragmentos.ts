import { randomUUID } from 'node:crypto'
import type { TipoSecaoSugerido } from './identificar-estrutura.ts'
import type { ArtefatoConteudoNormalizado } from './normalizar-conteudo.ts'

export type SecaoDocumento = {
  secao_id: string
  secao_pai_id: string | null
  codigo: string
  tipo: TipoSecaoSugerido
  titulo: string | null
  ordem: number
  pagina_inicial: number | null
  pagina_final: number | null
  indice_inicio: number | null
  indice_fim: number | null
  offset_pagina_inicio: number | null
}

export type FragmentoPreparado = {
  id: string
  secao_id: string
  codigo: string
  ordem: number
  pagina_inicial: number | null
  pagina_final: number | null
  conteudo: string
  conteudo_contextualizado: string
  quantidade_tokens: number
}

export type FragmentoPersistido = Omit<FragmentoPreparado, 'id'>

const ROTULO_TIPO: Record<TipoSecaoSugerido, string> = {
  parte: 'Parte',
  capitulo: 'Capítulo',
  secao: 'Seção',
  subsecao: 'Subseção',
  anexo: 'Anexo',
  prefacio: 'Prefácio',
  posfacio: 'Posfácio',
}

export function estimarQuantidadeTokens(texto: string): number {
  return Math.max(1, Math.ceil(texto.length / 4))
}

type TrechoDaSecao = {
  texto: string | null
  paginaInicial: number | null
  paginaFinal: number | null
}

function extrairTrechoPdf(
  secao: SecaoDocumento,
  proximaSecao: SecaoDocumento | null,
  normalizado: ArtefatoConteudoNormalizado
): TrechoDaSecao {
  if (!normalizado.paginas || secao.pagina_inicial === null) {
    return { texto: null, paginaInicial: null, paginaFinal: null }
  }

  const paginaInicial = secao.pagina_inicial
  const offsetInicial = Math.max(0, secao.offset_pagina_inicio ?? 0)
  const paginaLimite = proximaSecao?.pagina_inicial ?? null
  const offsetLimite = proximaSecao?.offset_pagina_inicio ?? null
  const partes: string[] = []
  let ultimaPaginaComTrecho: number | null = null

  for (const pagina of normalizado.paginas) {
    if (pagina.numero < paginaInicial) continue
    if (paginaLimite !== null && pagina.numero > paginaLimite) break

    let inicio = pagina.numero === paginaInicial ? offsetInicial : 0
    let fim = pagina.conteudo.length

    if (paginaLimite !== null && pagina.numero === paginaLimite) {
      if (offsetLimite === null) {
        // Sem offset do próximo título não existe fronteira segura dentro da
        // página. Em vez de duplicar conteúdo da próxima seção, não incluímos
        // essa página como continuação da seção atual.
        fim = 0
      } else {
        fim = Math.max(0, Math.min(pagina.conteudo.length, offsetLimite))
      }
    }

    inicio = Math.max(0, Math.min(pagina.conteudo.length, inicio))
    if (fim <= inicio) continue

    const trecho = pagina.conteudo.slice(inicio, fim)
    if (trecho.length === 0) continue

    partes.push(trecho)
    ultimaPaginaComTrecho = pagina.numero
  }

  return {
    texto: partes.join('\n\n'),
    paginaInicial,
    paginaFinal: ultimaPaginaComTrecho ?? paginaInicial,
  }
}

function extrairTrechoProprio(
  secao: SecaoDocumento,
  proximaSecao: SecaoDocumento | null,
  normalizado: ArtefatoConteudoNormalizado
): TrechoDaSecao {
  if (normalizado.formato === 'pdf') {
    return extrairTrechoPdf(secao, proximaSecao, normalizado)
  }

  if (normalizado.conteudo !== undefined) {
    if (secao.indice_inicio === null) return { texto: null, paginaInicial: null, paginaFinal: null }

    const indiceFim =
      proximaSecao?.indice_inicio != null
        ? Math.max(secao.indice_inicio, proximaSecao.indice_inicio)
        : normalizado.conteudo.length

    return {
      texto: normalizado.conteudo.slice(secao.indice_inicio, indiceFim),
      paginaInicial: null,
      paginaFinal: null,
    }
  }

  return { texto: null, paginaInicial: null, paginaFinal: null }
}

function rotuloDaSecao(secao: SecaoDocumento): string {
  return secao.titulo ?? ROTULO_TIPO[secao.tipo]
}

export function construirBreadcrumb(
  secao: SecaoDocumento,
  mapaSecoes: Map<string, SecaoDocumento>
): string {
  const cadeia: string[] = []
  let atual: SecaoDocumento | undefined = secao

  while (atual) {
    if (atual.titulo) cadeia.unshift(rotuloDaSecao(atual))
    atual = atual.secao_pai_id ? mapaSecoes.get(atual.secao_pai_id) : undefined
  }

  return cadeia.join(' > ')
}

export function montarFragmentosDocumento({
  secoes,
  normalizado,
}: {
  secoes: SecaoDocumento[]
  normalizado: ArtefatoConteudoNormalizado
}): FragmentoPreparado[] {
  const mapaSecoes = new Map(secoes.map((secao) => [secao.secao_id, secao]))
  const secoesEmOrdem = [...secoes].sort((a, b) => a.ordem - b.ordem)

  const fragmentos: FragmentoPreparado[] = []
  let ordem = 0

  secoesEmOrdem.forEach((secao, indice) => {
    const proximaSecao = secoesEmOrdem[indice + 1] ?? null
    const trecho = extrairTrechoProprio(secao, proximaSecao, normalizado)
    const textoAparado = trecho.texto?.trim() ?? ''

    if (textoAparado.length === 0) return
    if (secao.titulo && textoAparado === secao.titulo) return

    const breadcrumb = construirBreadcrumb(secao, mapaSecoes)
    const conteudoContextualizado = breadcrumb
      ? `${breadcrumb}\n\n${textoAparado}`
      : textoAparado

    ordem += 1
    fragmentos.push({
      id: randomUUID(),
      secao_id: secao.secao_id,
      codigo: `FRAG-${String(ordem).padStart(4, '0')}`,
      ordem,
      pagina_inicial: trecho.paginaInicial,
      pagina_final: trecho.paginaFinal,
      conteudo: textoAparado,
      conteudo_contextualizado: conteudoContextualizado,
      quantidade_tokens: estimarQuantidadeTokens(textoAparado),
    })
  })

  return fragmentos
}

export function fragmentosPersistidosCorrespondem(
  esperados: FragmentoPreparado[],
  persistidos: FragmentoPersistido[]
): boolean {
  if (esperados.length !== persistidos.length) return false

  const ordenados = [...persistidos].sort((a, b) => a.ordem - b.ordem)
  return esperados.every((esperado, indice) => {
    const persistido = ordenados[indice]
    if (!persistido) return false

    return (
      persistido.secao_id === esperado.secao_id &&
      persistido.codigo === esperado.codigo &&
      persistido.ordem === esperado.ordem &&
      persistido.pagina_inicial === esperado.pagina_inicial &&
      persistido.pagina_final === esperado.pagina_final &&
      persistido.conteudo === esperado.conteudo &&
      persistido.conteudo_contextualizado === esperado.conteudo_contextualizado &&
      persistido.quantidade_tokens === esperado.quantidade_tokens
    )
  })
}
