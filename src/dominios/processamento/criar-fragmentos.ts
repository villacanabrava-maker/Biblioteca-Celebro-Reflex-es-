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

const ROTULO_TIPO: Record<TipoSecaoSugerido, string> = {
  parte: 'Parte',
  capitulo: 'Capítulo',
  secao: 'Seção',
  subsecao: 'Subseção',
  anexo: 'Anexo',
  prefacio: 'Prefácio',
  posfacio: 'Posfácio',
}

// Estimativa determinística e provisória (não é a tokenização real de
// nenhum modelo). Serve para ordens de grandeza até a camada de IA existir;
// deverá ser recalculada com o tokenizador do modelo quando MODELO_IA_* for
// definido (Dicionário Mestre, seção 30).
export function estimarQuantidadeTokens(texto: string): number {
  return Math.max(1, Math.ceil(texto.length / 4))
}

type TrechoDaSecao = {
  texto: string | null
  paginaInicial: number | null
  paginaFinal: number | null
}

/**
 * Extrai apenas o texto PRÓPRIO de uma seção (sem incluir o de suas
 * subseções): vai do início da própria seção até o início da próxima
 * seção na ordem de leitura do documento — não até o `pagina_final`/
 * `indice_fim` guardados em `secoes`, que representam a extensão de toda a
 * subárvore (necessária para exibir "este capítulo ocupa as páginas X–Y",
 * mas incorreta para fragmentação, pois duplicaria o texto de uma
 * subseção tanto no fragmento do capítulo quanto no da própria subseção).
 * Para uma seção-folha (sem filhas), o resultado coincide com o span
 * completo, porque nada mais se intromete antes do próximo título.
 */
function extrairTrechoProprio(
  secao: SecaoDocumento,
  proximaSecao: SecaoDocumento | null,
  normalizado: ArtefatoConteudoNormalizado
): TrechoDaSecao {
  if (normalizado.formato === 'pdf' && normalizado.paginas) {
    if (secao.pagina_inicial === null) return { texto: null, paginaInicial: null, paginaFinal: null }

    const paginaFinal =
      proximaSecao?.pagina_inicial != null
        ? Math.max(secao.pagina_inicial, proximaSecao.pagina_inicial - 1)
        : (normalizado.total_paginas ?? secao.pagina_inicial)

    const texto = normalizado.paginas
      .filter((pagina) => pagina.numero >= secao.pagina_inicial! && pagina.numero <= paginaFinal)
      .map((pagina) => pagina.conteudo)
      .join('\n\n')

    return { texto, paginaInicial: secao.pagina_inicial, paginaFinal }
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

/**
 * Monta a trilha de ancestrais (ex.: "Parte I > Capítulo 1 > Seção 1.1")
 * até a própria seção, para dar contexto hierárquico ao fragmento. Uma
 * seção sem título e sem pai (o caso de documento sem indícios estruturais)
 * não gera trilha nenhuma.
 */
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

/**
 * Monta um fragmento por seção (v1 não subdivide seções grandes em vários
 * fragmentos menores — fica para uma versão futura, quando a camada de IA
 * exigir blocos de tamanho controlado). Duas situações não geram fragmento:
 * a seção não tem nenhum texto próprio extraível, ou o texto extraído é
 * exatamente igual ao próprio título (um título sem nenhum corpo depois
 * dele não agrega informação além do que já está em `secoes.titulo`).
 */
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
