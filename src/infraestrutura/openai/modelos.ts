export const MODELO_IA_ANALISE_PADRAO = 'gpt-5.6-terra'
export const MODELO_IA_EXTRACAO_PADRAO = 'gpt-5.6-terra'

export type UsoTokens = {
  tokensEntrada: number
  tokensSaida: number
  tokensEntradaCache?: number
}

type PrecoModelo = {
  entradaPorMilhaoUsd: number
  entradaCachePorMilhaoUsd: number
  saidaPorMilhaoUsd: number
}

// Snapshot operacional pesquisado na documentação oficial da OpenAI em
// 17/09/2026. Mudança de preço/modelo deve ser deliberada e documentada.
const PRECOS: Record<string, PrecoModelo> = {
  'gpt-5.6-luna': {
    entradaPorMilhaoUsd: 0.2,
    entradaCachePorMilhaoUsd: 0.02,
    saidaPorMilhaoUsd: 1.2,
  },
  'gpt-5.6-terra': {
    entradaPorMilhaoUsd: 2,
    entradaCachePorMilhaoUsd: 0.2,
    saidaPorMilhaoUsd: 12,
  },
  'gpt-5.6-sol': {
    entradaPorMilhaoUsd: 4,
    entradaCachePorMilhaoUsd: 0.4,
    saidaPorMilhaoUsd: 20,
  },
}

export function obterModeloAnalise(): string {
  return process.env.MODELO_IA_ANALISE?.trim() || MODELO_IA_ANALISE_PADRAO
}

export function obterModeloExtracao(): string {
  return process.env.MODELO_IA_EXTRACAO?.trim() || MODELO_IA_EXTRACAO_PADRAO
}

export function estimarCustoUsd(modelo: string, uso: UsoTokens): number | null {
  const preco = PRECOS[modelo]
  if (!preco) return null

  const entradaTotal = Math.max(0, uso.tokensEntrada)
  const entradaCache = Math.min(entradaTotal, Math.max(0, uso.tokensEntradaCache ?? 0))
  const entradaNormal = entradaTotal - entradaCache
  const saida = Math.max(0, uso.tokensSaida)

  const custo =
    (entradaNormal * preco.entradaPorMilhaoUsd +
      entradaCache * preco.entradaCachePorMilhaoUsd +
      saida * preco.saidaPorMilhaoUsd) /
    1_000_000

  return Math.round(custo * 1_000_000) / 1_000_000
}
