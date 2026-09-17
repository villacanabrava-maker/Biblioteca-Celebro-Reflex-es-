// Centraliza os identificadores de modelo por finalidade (Dicionário
// Mestre, seção 30): nenhum ID de modelo deve aparecer solto pelo código.
// O padrão é o modelo atual verificado na documentação do SDK `openai`
// já instalado neste projeto; pode ser sobrescrito por ambiente sem
// alterar código.
export const MODELO_IA_ANALISE = process.env.MODELO_IA_ANALISE ?? 'gpt-5.5'
