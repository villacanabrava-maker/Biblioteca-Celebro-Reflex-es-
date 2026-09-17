import {
  construirEntradaObra,
  construirEntradaSecao,
  ordenarSecoesParaSintese,
  tipoAlvoDaSecao,
  type FragmentoParaSintese,
  type SecaoParaSintese,
  type SinteseComposta,
} from '@/dominios/processamento/criar-sinteses'
import {
  LIMITE_CARACTERES_ENTRADA_SINTESE,
  calcularHashEntradaSintese,
  gerarSinteseDocumental,
  type EntradaSinteseDocumental,
  type TipoAlvoSintese,
} from '@/ia/motor-documental/gerar-sintese-documental'
import { criarClienteOpenAI } from '@/infraestrutura/openai/cliente'
import { obterModeloAnalise } from '@/infraestrutura/openai/modelos'
import { createBackendClient } from '@/infraestrutura/supabase/backend'

export type PlanoSinteses = {
  ok: boolean
  execucaoId: string
  documentoProcessadoId?: string
  secoesIds?: string[]
  permitirCriacao?: boolean
  motivo?: string
}

export type ResultadoSinteseAlvo = {
  ok: boolean
  execucaoId: string
  tipoAlvo?: TipoAlvoSintese
  alvoId?: string
  sinteseId?: string
  reutilizada?: boolean
  ignorada?: boolean
  motivo?: string
}

type ConfigSintese = {
  modelo_ia_id: string
  identificador_modelo: string
  versao_prompt_id: string
  numero_versao_prompt: number
  conteudo_prompt: string
  schema_saida: Record<string, unknown>
}

type SecaoRpc = SecaoParaSintese & {
  documento_processado_id: string
}

type FragmentoRpc = FragmentoParaSintese & {
  documento_processado_id: string
}

type SinteseAuditadaRpc = {
  documento_processado_id: string
  sintese_id: string
  tipo_alvo: TipoAlvoSintese
  alvo_id: string
  nivel: number
  conteudo: string
  modelo_ia_id: string
  versao_prompt_id: string
  auditoria_id: string
  hash_entrada: string
}

type PreparacaoIa = {
  auditoria_id: string
  estado: 'reservada' | 'em_execucao' | 'concluida' | 'falhou' | 'incerta' | 'cancelada'
  tentativa: number
  deve_chamar: boolean
  sintese_id: string | null
}

function chaveSintese(tipoAlvo: TipoAlvoSintese, alvoId: string): string {
  return `${tipoAlvo}:${alvoId}`
}

function sinteseComposta(linha: SinteseAuditadaRpc, tituloAlvo: string | null): SinteseComposta {
  return {
    tipoAlvo: linha.tipo_alvo,
    alvoId: linha.alvo_id,
    tituloAlvo,
    conteudo: linha.conteudo,
    nivel: linha.nivel,
  }
}

async function obterConfigSintese(): Promise<ConfigSintese> {
  const backend = createBackendClient()
  const modelo = obterModeloAnalise()
  const { data, error } = await backend
    .schema('aplicacao')
    .rpc('backend_obter_config_sintese', { p_identificador_modelo: modelo })

  if (error) throw error
  const config = (Array.isArray(data) ? data[0] : null) as ConfigSintese | null
  if (!config) {
    throw new Error(`Modelo de análise não catalogado/ativo para síntese: ${modelo}`)
  }
  return config
}

async function listarSecoes(execucaoId: string): Promise<SecaoRpc[]> {
  const backend = createBackendClient()
  const { data, error } = await backend
    .schema('aplicacao')
    .rpc('backend_listar_secoes_documento', { p_execucao_id: execucaoId })
  if (error) throw error

  return ((Array.isArray(data) ? data : []) as Array<Record<string, unknown>>).map((linha) => ({
    documento_processado_id: String(linha.documento_processado_id),
    secao_id: String(linha.secao_id),
    secao_pai_id: linha.secao_pai_id ? String(linha.secao_pai_id) : null,
    codigo: String(linha.codigo),
    tipo: String(linha.tipo) as SecaoParaSintese['tipo'],
    titulo: linha.titulo ? String(linha.titulo) : null,
    ordem: Number(linha.ordem),
    nivel_hierarquico: Number(linha.nivel_hierarquico),
  }))
}

async function listarFragmentos(execucaoId: string): Promise<FragmentoRpc[]> {
  const backend = createBackendClient()
  const { data, error } = await backend
    .schema('aplicacao')
    .rpc('backend_listar_fragmentos_documento', { p_execucao_id: execucaoId })
  if (error) throw error

  return ((Array.isArray(data) ? data : []) as Array<Record<string, unknown>>).map((linha) => ({
    documento_processado_id: String(linha.documento_processado_id),
    secao_id: String(linha.secao_id),
    ordem: Number(linha.ordem),
    conteudo: String(linha.conteudo),
  }))
}

async function listarSintesesAuditadas(execucaoId: string): Promise<SinteseAuditadaRpc[]> {
  const backend = createBackendClient()
  const { data, error } = await backend
    .schema('aplicacao')
    .rpc('backend_listar_sinteses_auditadas_documento', { p_execucao_id: execucaoId })
  if (error) throw error
  return (Array.isArray(data) ? data : []) as SinteseAuditadaRpc[]
}

async function falharPipeline(
  execucaoId: string,
  codigo: string,
  mensagem: string,
  detalhes: Record<string, unknown> = {}
) {
  const backend = createBackendClient()
  const { error } = await backend
    .schema('aplicacao')
    .rpc('backend_falhar_execucao', {
      p_execucao_id: execucaoId,
      p_nome_etapa: 'criar_sinteses',
      p_codigo_erro: codigo,
      p_mensagem_erro: mensagem,
      p_detalhes: detalhes,
    })
  if (error) throw error
}

function descreverErroSeguro(erro: unknown): string {
  if (!erro || typeof erro !== 'object') return 'erro_desconhecido'
  const registro = erro as Record<string, unknown>
  const nome = typeof registro.name === 'string' ? registro.name : 'Error'
  const status = typeof registro.status === 'number' ? registro.status : null
  const codigo = typeof registro.code === 'string' ? registro.code : null
  return [nome, status !== null ? `status_${status}` : null, codigo].filter(Boolean).join(':').slice(0, 500)
}

function temStatusHttpExplicito(erro: unknown): boolean {
  return Boolean(
    erro &&
      typeof erro === 'object' &&
      typeof (erro as Record<string, unknown>).status === 'number'
  )
}

async function marcarFalhaIa(
  auditoriaId: string,
  estado: 'falhou' | 'incerta',
  erroSeguro: string,
  duracaoMs: number | null
) {
  const backend = createBackendClient()
  const { error } = await backend
    .schema('aplicacao')
    .rpc('backend_falhar_execucao_ia', {
      p_auditoria_id: auditoriaId,
      p_estado: estado,
      p_erro: erroSeguro,
      p_duracao_ms: duracaoMs,
    })
  if (error) throw error
}

async function concluirSinteseIaComRetry({
  auditoriaId,
  resultado,
}: {
  auditoriaId: string
  resultado: Extract<Awaited<ReturnType<typeof gerarSinteseDocumental>>, { ok: true }>
}): Promise<string> {
  let ultimoErro: unknown = null

  for (let tentativa = 1; tentativa <= 3; tentativa += 1) {
    const backend = createBackendClient()
    const { data, error } = await backend
      .schema('aplicacao')
      .rpc('backend_concluir_sintese_ia', {
        p_auditoria_id: auditoriaId,
        p_conteudo: resultado.sintese,
        p_tokens_entrada: resultado.tokensEntrada,
        p_tokens_saida: resultado.tokensSaida,
        p_duracao_ms: resultado.duracaoMs,
        p_custo_estimado: resultado.custoEstimadoUsd,
        p_response_id: resultado.responseId,
      })

    if (!error && data) return String(data)
    ultimoErro = error ?? new Error('Conclusão de síntese não retornou identificador.')
  }

  throw ultimoErro
}

async function prepararChamadaIa({
  execucaoId,
  tipoAlvo,
  alvoId,
  config,
  hashEntrada,
}: {
  execucaoId: string
  tipoAlvo: TipoAlvoSintese
  alvoId: string
  config: ConfigSintese
  hashEntrada: string
}): Promise<PreparacaoIa> {
  const backend = createBackendClient()
  const { data, error } = await backend
    .schema('aplicacao')
    .rpc('backend_preparar_sintese_ia', {
      p_execucao_id: execucaoId,
      p_tipo_alvo: tipoAlvo,
      p_alvo_id: alvoId,
      p_modelo_ia_id: config.modelo_ia_id,
      p_versao_prompt_id: config.versao_prompt_id,
      p_hash_entrada: hashEntrada,
    })
  if (error) throw error

  const preparo = (Array.isArray(data) ? data[0] : null) as PreparacaoIa | null
  if (!preparo) throw new Error('Reserva de auditoria IA não retornou resultado.')
  return preparo
}

async function executarOuReusarSintese({
  execucaoId,
  tipoAlvo,
  alvoId,
  tituloAlvo,
  entrada,
  config,
  permitirCriacao,
  existentes,
}: {
  execucaoId: string
  tipoAlvo: TipoAlvoSintese
  alvoId: string
  tituloAlvo: string | null
  entrada: EntradaSinteseDocumental
  config: ConfigSintese
  permitirCriacao: boolean
  existentes: SinteseAuditadaRpc[]
}): Promise<{ ok: true; sintese: SinteseComposta; sinteseId: string; reutilizada: boolean } | { ok: false; motivo: string }> {
  const hashEntrada = calcularHashEntradaSintese(entrada)
  const existente = existentes.find(
    (linha) => linha.tipo_alvo === tipoAlvo && linha.alvo_id === alvoId
  )

  if (existente) {
    const mesmaProveniencia =
      existente.modelo_ia_id === config.modelo_ia_id &&
      existente.versao_prompt_id === config.versao_prompt_id &&
      existente.hash_entrada?.toLowerCase() === hashEntrada

    if (!mesmaProveniencia) {
      return { ok: false, motivo: 'sintese_existente_proveniencia_divergente' }
    }

    return {
      ok: true,
      sintese: sinteseComposta(existente, tituloAlvo),
      sinteseId: existente.sintese_id,
      reutilizada: true,
    }
  }

  if (!permitirCriacao) return { ok: false, motivo: 'sintese_replay_ausente' }
  if (entrada.conteudoFonte.length > LIMITE_CARACTERES_ENTRADA_SINTESE) {
    return { ok: false, motivo: 'entrada_sintese_excessiva' }
  }

  const preparo = await prepararChamadaIa({
    execucaoId,
    tipoAlvo,
    alvoId,
    config,
    hashEntrada,
  })

  if (!preparo.deve_chamar) {
    if (preparo.estado === 'concluida' && preparo.sintese_id) {
      const atualizadas = await listarSintesesAuditadas(execucaoId)
      const concluida = atualizadas.find((linha) => linha.sintese_id === preparo.sintese_id)
      if (
        concluida &&
        concluida.modelo_ia_id === config.modelo_ia_id &&
        concluida.versao_prompt_id === config.versao_prompt_id &&
        concluida.hash_entrada?.toLowerCase() === hashEntrada
      ) {
        return {
          ok: true,
          sintese: sinteseComposta(concluida, tituloAlvo),
          sinteseId: concluida.sintese_id,
          reutilizada: true,
        }
      }
      return { ok: false, motivo: 'sintese_concluida_auditoria_divergente' }
    }

    if (preparo.estado === 'reservada' || preparo.estado === 'em_execucao') {
      throw new Error('CHAMADA_IA_EM_ANDAMENTO')
    }

    return { ok: false, motivo: `chamada_ia_${preparo.estado}` }
  }

  const backend = createBackendClient()
  const { data: iniciou, error: inicioError } = await backend
    .schema('aplicacao')
    .rpc('backend_marcar_execucao_ia_iniciada', { p_auditoria_id: preparo.auditoria_id })
  if (inicioError) throw inicioError
  if (iniciou !== true) throw new Error('RESERVA_IA_NAO_PODE_SER_INICIADA')

  const inicioChamada = Date.now()
  let resultado: Awaited<ReturnType<typeof gerarSinteseDocumental>>

  try {
    resultado = await gerarSinteseDocumental({
      cliente: criarClienteOpenAI(),
      modelo: config.identificador_modelo,
      promptSistema: config.conteudo_prompt,
      entrada,
    })
  } catch (erro) {
    const duracaoMs = Date.now() - inicioChamada
    const erroSeguro = descreverErroSeguro(erro)

    if (temStatusHttpExplicito(erro)) {
      await marcarFalhaIa(preparo.auditoria_id, 'falhou', erroSeguro, duracaoMs)
      throw erro
    }

    await marcarFalhaIa(preparo.auditoria_id, 'incerta', erroSeguro, duracaoMs)
    return { ok: false, motivo: 'chamada_ia_estado_incerto' }
  }

  if (!resultado.ok) {
    await marcarFalhaIa(
      preparo.auditoria_id,
      'incerta',
      `${resultado.codigo}:${resultado.responseId ?? 'sem_response_id'}`,
      resultado.duracaoMs
    )
    return { ok: false, motivo: resultado.codigo.toLowerCase() }
  }

  let sinteseId: string
  try {
    sinteseId = await concluirSinteseIaComRetry({ auditoriaId: preparo.auditoria_id, resultado })
  } catch (erro) {
    try {
      await marcarFalhaIa(
        preparo.auditoria_id,
        'incerta',
        `persistencia_pos_resposta:${descreverErroSeguro(erro)}`,
        resultado.duracaoMs
      )
    } catch {
      // Não mascarar a falha original; o replay verá a chamada em estado seguro
      // ou a classificará como incerta pelo lease da auditoria.
    }
    return { ok: false, motivo: 'persistencia_sintese_estado_incerto' }
  }

  return {
    ok: true,
    sintese: {
      tipoAlvo,
      alvoId,
      tituloAlvo,
      conteudo: resultado.sintese,
      nivel: 0,
    },
    sinteseId,
    reutilizada: false,
  }
}

export async function planejarSintesesStep(execucaoId: string): Promise<PlanoSinteses> {
  'use step'

  const backend = createBackendClient()
  const { data: etapaData, error: etapaError } = await backend
    .schema('aplicacao')
    .rpc('backend_iniciar_etapa', {
      p_execucao_id: execucaoId,
      p_nome_etapa: 'criar_sinteses',
      p_estado_execucao: 'sintetizando',
      p_percentual: 46,
    })
  if (etapaError) throw etapaError

  const etapa = Array.isArray(etapaData) ? etapaData[0] : null
  const secoes = await listarSecoes(execucaoId)
  if (secoes.length === 0) {
    await falharPipeline(execucaoId, 'SECOES_AUSENTES_PARA_SINTESE', 'Não há seções materializadas para criar sínteses.')
    return { ok: false, execucaoId, motivo: 'secoes_ausentes' }
  }

  return {
    ok: true,
    execucaoId,
    documentoProcessadoId: secoes[0]!.documento_processado_id,
    secoesIds: ordenarSecoesParaSintese(secoes).map((secao) => secao.secao_id),
    permitirCriacao: etapa?.deve_executar !== false,
  }
}

export async function criarSinteseSecaoStep(
  execucaoId: string,
  secaoId: string,
  permitirCriacao: boolean
): Promise<ResultadoSinteseAlvo> {
  'use step'

  const [config, secoes, fragmentos, existentes] = await Promise.all([
    obterConfigSintese(),
    listarSecoes(execucaoId),
    listarFragmentos(execucaoId),
    listarSintesesAuditadas(execucaoId),
  ])

  const secao = secoes.find((item) => item.secao_id === secaoId)
  if (!secao) {
    await falharPipeline(execucaoId, 'SECAO_SINTESE_NAO_ENCONTRADA', 'A seção planejada para síntese não existe.')
    return { ok: false, execucaoId, motivo: 'secao_nao_encontrada' }
  }

  const fragmento = fragmentos.find((item) => item.secao_id === secaoId) ?? null
  const filhos = secoes
    .filter((item) => item.secao_pai_id === secaoId)
    .map((filha) => {
      const tipo = tipoAlvoDaSecao(filha)
      const linha = existentes.find(
        (item) => item.tipo_alvo === tipo && item.alvo_id === filha.secao_id
      )
      return linha ? { secao: filha, sintese: sinteseComposta(linha, filha.titulo) } : null
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  const entrada = construirEntradaSecao({ secao, fragmento, filhos })
  if (!entrada) {
    return {
      ok: true,
      execucaoId,
      tipoAlvo: tipoAlvoDaSecao(secao),
      alvoId: secao.secao_id,
      ignorada: true,
    }
  }

  const resultado = await executarOuReusarSintese({
    execucaoId,
    tipoAlvo: tipoAlvoDaSecao(secao),
    alvoId: secao.secao_id,
    tituloAlvo: secao.titulo,
    entrada,
    config,
    permitirCriacao,
    existentes,
  })

  if (!resultado.ok) {
    await falharPipeline(
      execucaoId,
      'SINTESE_SECAO_FALHOU',
      'A síntese de uma seção não pôde ser produzida ou revalidada com segurança.',
      { secao_id: secaoId, motivo: resultado.motivo }
    )
    return { ok: false, execucaoId, motivo: resultado.motivo }
  }

  return {
    ok: true,
    execucaoId,
    tipoAlvo: tipoAlvoDaSecao(secao),
    alvoId: secao.secao_id,
    sinteseId: resultado.sinteseId,
    reutilizada: resultado.reutilizada,
  }
}

export async function criarSinteseObraStep(
  execucaoId: string,
  documentoProcessadoId: string,
  permitirCriacao: boolean
): Promise<ResultadoSinteseAlvo> {
  'use step'

  const [config, secoes, existentes] = await Promise.all([
    obterConfigSintese(),
    listarSecoes(execucaoId),
    listarSintesesAuditadas(execucaoId),
  ])

  const secoesTopo = secoes.filter((item) => item.secao_pai_id === null)
  const mapaSinteses = new Map<string, SinteseComposta>()
  for (const secao of secoes) {
    const tipo = tipoAlvoDaSecao(secao)
    const linha = existentes.find(
      (item) => item.tipo_alvo === tipo && item.alvo_id === secao.secao_id
    )
    if (linha) mapaSinteses.set(secao.secao_id, sinteseComposta(linha, secao.titulo))
  }

  const entrada = construirEntradaObra({
    documentoTitulo: null,
    secoesTopo,
    sintesesPorSecao: mapaSinteses,
  })

  if (!entrada) {
    await falharPipeline(execucaoId, 'SINTESES_TOPO_AUSENTES', 'Não há sínteses de topo suficientes para sintetizar a obra.')
    return { ok: false, execucaoId, motivo: 'sinteses_topo_ausentes' }
  }

  const resultado = await executarOuReusarSintese({
    execucaoId,
    tipoAlvo: 'obra',
    alvoId: documentoProcessadoId,
    tituloAlvo: null,
    entrada,
    config,
    permitirCriacao,
    existentes,
  })

  if (!resultado.ok) {
    await falharPipeline(
      execucaoId,
      'SINTESE_OBRA_FALHOU',
      'A síntese global da obra não pôde ser produzida ou revalidada com segurança.',
      { motivo: resultado.motivo }
    )
    return { ok: false, execucaoId, motivo: resultado.motivo }
  }

  return {
    ok: true,
    execucaoId,
    tipoAlvo: 'obra',
    alvoId: documentoProcessadoId,
    sinteseId: resultado.sinteseId,
    reutilizada: resultado.reutilizada,
  }
}

export async function concluirSintesesStep(
  execucaoId: string,
  documentoProcessadoId: string,
  permitirCriacao: boolean
): Promise<ResultadoSinteseAlvo> {
  'use step'

  const existentes = await listarSintesesAuditadas(execucaoId)
  const obra = existentes.find(
    (item) => item.tipo_alvo === 'obra' && item.alvo_id === documentoProcessadoId
  )

  if (!obra) {
    await falharPipeline(execucaoId, 'SINTESE_OBRA_AUSENTE', 'A etapa não possui síntese global auditada da obra.')
    return { ok: false, execucaoId, motivo: 'sintese_obra_ausente' }
  }

  if (permitirCriacao) {
    const backend = createBackendClient()
    const { data, error } = await backend
      .schema('aplicacao')
      .rpc('backend_concluir_etapa', {
        p_execucao_id: execucaoId,
        p_nome_etapa: 'criar_sinteses',
        p_percentual: 55,
        p_proximo_estado: 'analisando',
        p_proxima_etapa: 'extrair_elementos',
        p_detalhes: {
          documento_processado_id: documentoProcessadoId,
          quantidade_sinteses: existentes.length,
          sintese_obra_id: obra.sintese_id,
        },
      })
    if (error) throw error
    if (data !== true) throw new Error('A transição criar_sinteses → extrair_elementos não foi aplicada.')
  }

  return {
    ok: true,
    execucaoId,
    tipoAlvo: 'obra',
    alvoId: documentoProcessadoId,
    sinteseId: obra.sintese_id,
    reutilizada: !permitirCriacao,
  }
}
