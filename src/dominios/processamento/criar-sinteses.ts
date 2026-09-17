import type { EntradaSinteseDocumental, TipoAlvoSintese } from '@/ia/motor-documental/gerar-sintese-documental'

export type SecaoParaSintese = {
  secao_id: string
  secao_pai_id: string | null
  codigo: string
  tipo: 'parte' | 'capitulo' | 'secao' | 'subsecao' | 'anexo' | 'prefacio' | 'posfacio'
  titulo: string | null
  ordem: number
  nivel_hierarquico: number
}

export type FragmentoParaSintese = {
  secao_id: string
  ordem: number
  conteudo: string
}

export type SinteseComposta = {
  tipoAlvo: TipoAlvoSintese
  alvoId: string
  tituloAlvo: string | null
  conteudo: string
  nivel: number
}

export function tipoAlvoDaSecao(secao: SecaoParaSintese): TipoAlvoSintese {
  if (secao.tipo === 'parte') return 'parte'
  if (secao.tipo === 'capitulo') return 'capitulo'
  return 'secao'
}

export function ordenarSecoesParaSintese(secoes: SecaoParaSintese[]): SecaoParaSintese[] {
  return [...secoes].sort((a, b) => {
    if (a.nivel_hierarquico !== b.nivel_hierarquico) {
      return b.nivel_hierarquico - a.nivel_hierarquico
    }
    return a.ordem - b.ordem
  })
}

export function construirEntradaSecao({
  secao,
  fragmento,
  filhos,
}: {
  secao: SecaoParaSintese
  fragmento: FragmentoParaSintese | null
  filhos: Array<{ secao: SecaoParaSintese; sintese: SinteseComposta }>
}): EntradaSinteseDocumental | null {
  const textoProprio = fragmento?.conteudo.trim() || null
  const sintesesFilhas = [...filhos]
    .sort((a, b) => a.secao.ordem - b.secao.ordem)
    .map(({ secao: filha, sintese }) => ({
      codigo: filha.codigo,
      titulo: filha.titulo,
      tipo: filha.tipo,
      sintese: sintese.conteudo,
    }))

  if (!textoProprio && sintesesFilhas.length === 0) return null

  return {
    tipoAlvo: tipoAlvoDaSecao(secao),
    tituloAlvo: secao.titulo,
    conteudoFonte: JSON.stringify({
      texto_proprio_da_secao: textoProprio,
      sinteses_dos_filhos_diretos: sintesesFilhas,
    }),
  }
}

export function construirEntradaObra({
  documentoTitulo,
  secoesTopo,
  sintesesPorSecao,
}: {
  documentoTitulo: string | null
  secoesTopo: SecaoParaSintese[]
  sintesesPorSecao: Map<string, SinteseComposta>
}): EntradaSinteseDocumental | null {
  const sinteses = [...secoesTopo]
    .sort((a, b) => a.ordem - b.ordem)
    .map((secao) => {
      const sintese = sintesesPorSecao.get(secao.secao_id)
      if (!sintese) return null
      return {
        codigo: secao.codigo,
        titulo: secao.titulo,
        tipo: secao.tipo,
        sintese: sintese.conteudo,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  if (sinteses.length === 0) return null

  return {
    tipoAlvo: 'obra',
    tituloAlvo: documentoTitulo,
    conteudoFonte: JSON.stringify({
      sinteses_das_secoes_de_topo: sinteses,
    }),
  }
}
