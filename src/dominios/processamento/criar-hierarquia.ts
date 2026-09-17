import { randomUUID } from 'node:crypto'
import type { TipoSecaoSugerido, UnidadeEstruturalDetectada } from './identificar-estrutura.ts'

export type NoHierarquia = {
  id: string
  secao_pai_id: string | null
  codigo: string
  tipo: TipoSecaoSugerido
  titulo: string | null
  ordem: number
  nivel_hierarquico: number
  pagina_inicial: number | null
  pagina_final: number | null
  // Posição em caracteres dentro do conteúdo normalizado. Só é preenchida
  // para texto/markdown (documento é uma única string); em PDF permanece
  // nula porque cada unidade só conhece sua posição relativa à própria
  // página, e criar_fragmentos usa concatenação de páginas nesse caso.
  indice_inicio: number | null
  indice_fim: number | null
}

// Nível de aninhamento (container) de cada tipo. Anexo/Prefácio/Posfácio
// nunca são containers: são sempre folhas no nível raiz, mesmo que apareçam
// entre um capítulo e outro, para não "capturar" capítulos como filhos.
const TIER_CONTAINER: Partial<Record<TipoSecaoSugerido, number>> = {
  parte: 1,
  capitulo: 2,
  secao: 3,
  subsecao: 4,
}

function tierDoTipo(tipo: TipoSecaoSugerido): number | null {
  return TIER_CONTAINER[tipo] ?? null
}

// Cabeçalhos Markdown não têm tipo_sugerido (identificar_estrutura não
// assume vocabulário editorial). Aqui, na materialização, o nível 1 vira o
// principal agrupamento do documento (capítulo), pois "parte" é uma
// construção de livro mais rara em reflexões/ensaios curtos.
function tipoDeCabecalhoMarkdown(nivelMarkdown: number): TipoSecaoSugerido {
  if (nivelMarkdown <= 1) return 'capitulo'
  if (nivelMarkdown === 2) return 'secao'
  return 'subsecao'
}

function resolverTipo(unidade: UnidadeEstruturalDetectada): TipoSecaoSugerido {
  if (unidade.tipo_sugerido) return unidade.tipo_sugerido
  return tipoDeCabecalhoMarkdown(unidade.nivel_markdown ?? 3)
}

type NoInterno = NoHierarquia & { tier: number | null }

function calcularPaginasFinais(nos: NoInterno[], totalPaginas: number) {
  for (let i = 0; i < nos.length; i += 1) {
    const atual = nos[i]!
    let paginaFinal = totalPaginas

    for (let j = i + 1; j < nos.length; j += 1) {
      const proximo = nos[j]!
      const proximoEncerraAtual = atual.tier === null || (proximo.tier ?? 0) <= atual.tier

      if (proximoEncerraAtual) {
        const inicioAtual = atual.pagina_inicial ?? 1
        const inicioProximo = proximo.pagina_inicial ?? totalPaginas
        paginaFinal = Math.max(inicioAtual, inicioProximo - 1)
        break
      }
    }

    atual.pagina_final = paginaFinal
  }
}

// Mesma lógica de "até onde vai antes do próximo limite", mas para posição
// em caracteres. Diferente de página (unidade discreta, por isso o -1),
// aqui o fim é um limite de corte exclusivo (como em string.slice), então
// não se subtrai 1: o próximo início já é o ponto exato onde este nó acaba.
function calcularIndicesFinais(nos: NoInterno[], totalCaracteres: number) {
  for (let i = 0; i < nos.length; i += 1) {
    const atual = nos[i]!
    let indiceFim = totalCaracteres

    for (let j = i + 1; j < nos.length; j += 1) {
      const proximo = nos[j]!
      const proximoEncerraAtual = atual.tier === null || (proximo.tier ?? 0) <= atual.tier

      if (proximoEncerraAtual) {
        const inicioAtual = atual.indice_inicio ?? 0
        const inicioProximo = proximo.indice_inicio ?? totalCaracteres
        indiceFim = Math.max(inicioAtual, inicioProximo)
        break
      }
    }

    atual.indice_fim = indiceFim
  }
}

/**
 * Materializa a hierarquia de seções a partir dos sinais de alta confiança
 * detectados por identificar_estrutura. Nunca inventa divisão: quando não
 * há nenhum sinal de alta confiança, produz uma única seção representando
 * o documento inteiro (nível 0), preservando a incerteza registrada na
 * etapa anterior em vez de forçar uma estrutura editorial.
 */
export function construirHierarquiaDocumento({
  unidades,
  totalPaginas,
  totalCaracteres,
}: {
  unidades: UnidadeEstruturalDetectada[]
  totalPaginas: number | null
  totalCaracteres: number | null
}): NoHierarquia[] {
  const altaConfianca = unidades.filter((unidade) => unidade.confianca === 'alta')

  if (altaConfianca.length === 0) {
    return [
      {
        id: randomUUID(),
        secao_pai_id: null,
        codigo: 'SEC-0001',
        tipo: 'secao',
        titulo: null,
        ordem: 1,
        nivel_hierarquico: 0,
        pagina_inicial: totalPaginas !== null ? 1 : null,
        pagina_final: totalPaginas,
        indice_inicio: totalCaracteres !== null ? 0 : null,
        indice_fim: totalCaracteres,
      },
    ]
  }

  const nos: NoInterno[] = []
  const pilha: Array<{ tier: number; id: string }> = []

  altaConfianca.forEach((unidade, indice) => {
    const tipo = resolverTipo(unidade)
    const tier = tierDoTipo(tipo)
    let pai: string | null = null

    if (tier !== null) {
      while (pilha.length > 0 && pilha[pilha.length - 1]!.tier >= tier) {
        pilha.pop()
      }
      pai = pilha.length > 0 ? pilha[pilha.length - 1]!.id : null
    }

    const id = randomUUID()

    nos.push({
      id,
      secao_pai_id: pai,
      codigo: `SEC-${String(indice + 1).padStart(4, '0')}`,
      tipo,
      titulo: unidade.titulo_detectado,
      ordem: indice + 1,
      nivel_hierarquico: tier !== null ? tier - 1 : 0,
      pagina_inicial: unidade.pagina,
      pagina_final: null,
      indice_inicio: totalCaracteres !== null ? unidade.indice_inicio : null,
      indice_fim: null,
      tier,
    })

    if (tier !== null) pilha.push({ tier, id })
  })

  if (totalPaginas !== null) calcularPaginasFinais(nos, totalPaginas)
  if (totalCaracteres !== null) calcularIndicesFinais(nos, totalCaracteres)

  return nos.map((no) => {
    const {
      id,
      secao_pai_id,
      codigo,
      tipo,
      titulo,
      ordem,
      nivel_hierarquico,
      pagina_inicial,
      pagina_final,
      indice_inicio,
      indice_fim,
    } = no
    return {
      id,
      secao_pai_id,
      codigo,
      tipo,
      titulo,
      ordem,
      nivel_hierarquico,
      pagina_inicial,
      pagina_final,
      indice_inicio,
      indice_fim,
    }
  })
}
