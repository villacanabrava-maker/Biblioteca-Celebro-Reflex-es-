import {
  LIMITE_CARACTERES_ENTRADA_ELEMENTOS,
  calcularHashEntradaExtracaoElementos,
  extrairElementosDocumentais,
  montarEntradaExtracaoElementos,
  schemaSaidaExtracaoElementosV1Compativel,
  type EntradaExtracaoElementos,
  type FragmentoParaExtracao,
} from '@/ia/motor-documental/extrair-elementos-documentais'
import { criarClienteOpenAI } from '@/infraestrutura/openai/cliente'
import { obterModeloExtracao } from '@/infraestrutura/openai/modelos'
import { createBackendClient } from '@/infraestrutura/supabase/backend'

export type ConfigExtracaoElementos = {
  modelo_ia_id: string
  identificador_modelo: string
  versao_prompt_id: string
  numero_versao_prompt: number
  conteudo_prompt: string
  schema_saida: Record<string, unknown>
}

export type PlanoExtracaoElementos = {
  ok: boolean
  execucaoId: string
  documentoProcessadoId?: string
  fragmentosIds?: string[]
  permitirCriacao?: boolean
  config?: ConfigExtracaoElementos
  motivo?: string
}

export type ResultadoExtracaoFragmento = {
  ok: boolean
  execucaoId: string
  fragmentoId?: string
  quantidadeElementos?: number
  reutilizada?: boolean
  motivo?: string
}

export type ResultadoConclusaoExtracao = {
  ok: boolean
  execucaoId: string
  quantidadeFragmentos?: number
  quantidadeElementos?: number
  reutilizada?: boolean
  motivo?: string
}

type FragmentoRpc = FragmentoParaExtracao & {
  documento_processado_id: string
  ordem: number
}

type SinteseAuditadaRpc = {
  documento_processado_id: string
  sintese_id: string
  tipo_alvo: 'secao' | 'capitulo' | 'parte' | 'obra'
  alvo_id: string
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
  quantidade_elementos: number | null
}

type ReplayAuditado = {
  auditoria_id: string
  quantidade_elementos: number
}

async function obterConfigExtracao(): Promise<ConfigExtracaoElementos> {
  const backend = createBackendClient()
  const modelo = obterModeloExtracao()
  const { data, error } = await backend
    .schema('aplicacao')
    .rpc('backend_obter_config_extracao_elementos', { p_identificador_modelo: modelo })

  if (error) throw error
  const config = (Array.isArray(data) ? data[0] : null) as ConfigExtracaoElementos | null
  if (!config) {
    throw new Error(`Modelo de extração não catalogado/ativo: ${modelo}`)
  }
  if (!schemaSaidaExtracaoElementosV1Compativel(config.schema_saida)) {
    throw new Error('SCHEMA_EXTRACAO_ELEMENTOS_DIVERGENTE')
  }
  return config
}

async function listarFragmentos(execucaoId: string): Promise<FragmentoRpc[]> {
  const backend = createBackendClient()
  const { data, error } = await backend
    .schema('aplicacao')
    .rpc('backend_listar_fragmentos_documento', { p_execucao_id: execucaoId })
  if (error) throw error

  return ((Array.isArray(data) ? data : []) as Array<Record<string, unknown>>).map((linha) => ({
    documento_processado_id: String(linha.documento_processado_id),
    fragmentoId: String(linha.fragmento_id),
    secaoId: linha.secao_id ? String(linha.secao_id) : null,
    codigo: String(linha.codigo),
    ordem: Number(linha.ordem),
    paginaInicial: linha.pagina_inicial === null ? null : Number(linha.pagina_inicial),
    paginaFinal: linha.pagina_final === null ? null : Number(linha.pagina_final),
    conteudo: String(linha.conteudo),
    conteudoContextualizado: String(linha.conteudo_contextualizado),
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
      p_nome_etapa: 'extrair_elementos',
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
  return [nome, status !== null ? `status_${status}` : null, codigo]
    .filter(Boolean)
    .join(':')
    .slice(0, 500)
}

function obterStatusHttpExplicito(erro: unknown): number | null {
  if (!erro || typeof erro !== 'object') return null
  const status = (erro as Record<string, unknown>).status
  return typeof status === 'number' ? status : null
}

function statusHttpRetryable(status: number): boolean {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500
}

async function marcarEstadoIa(
  auditoriaId: string,
  estado: 'falhou' | 'incerta' | 'cancelada',
  erroSeguro: string,
  duracaoMs: number | null | undefined
) {
  const backend = createBackendClient()
  const { error } = await backend
    .schema('aplicacao')
    .rpc('backend_falhar_execucao_ia', {
      p_auditoria_id: auditoriaId,
      p_estado: estado,
      p_erro: erroSeguro,
      p_duracao_ms: duracaoMs ?? null,
    })
  if (error) throw error
}

async function prepararChamadaIa({
  execucaoId,
  fragmentoId,
  config,
  hashEntrada,
}: {
  execucaoId: string
  fragmentoId: string
  config: ConfigExtracaoElementos
  hashEntrada: string
}): Promise<PreparacaoIa> {
  const backend = createBackendClient()
  const { data, error } = await backend
    .schema('aplicacao')
    .rpc('backend_preparar_extracao_elementos_ia', {
      p_execucao_id: execucaoId,
      p_fragmento_id: fragmentoId,
      p_modelo_ia_id: config.modelo_ia_id,
      p_versao_prompt_id: config.versao_prompt_id,
      p_hash_entrada: hashEntrada,
    })
  if (error) throw error

  const preparo = (Array.isArray(data) ? data[0] : null) as PreparacaoIa | null
  if (!preparo) throw new Error('Reserva de extração por IA não retornou resultado.')
  return preparo
}

async function obterReplayAuditado({
  execucaoId,
  fragmentoId,
  config,
  hashEntrada,
}: {
  execucaoId: string
  fragmentoId: string
  config: ConfigExtracaoElementos
  hashEntrada: string
}): Promise<ReplayAuditado | null> {
  const backend = createBackendClient()
  const { data, error } = await backend
    .schema('aplicacao')
    .rpc('backend_obter_extracao_elementos_auditada', {
      p_execucao_id: execucaoId,
      p_fragmento_id: fragmentoId,
      p_modelo_ia_id: config.modelo_ia_id,
      p_versao_prompt_id: config.versao_prompt_id,
      p_hash_entrada: hashEntrada,
    })
  if (error) throw error
  return (Array.isArray(data) ? data[0] : null) as ReplayAuditado | null
}

async function concluirExtracaoComRetry({
  auditoriaId,
  resultado,
}: {
  auditoriaId: string
  resultado: Extract<Awaited<ReturnType<typeof extrairElementosDocumentais>>, { ok: true }>
}): Promise<number> {
  let ultimoErro: unknown = null

  for (let tentativa = 1; tentativa <= 3; tentativa += 1) {
    const backend = createBackendClient()
    const { data, error } = await backend
      .schema('aplicacao')
      .rpc('backend_concluir_extracao_elementos_ia', {
        p_auditoria_id: auditoriaId,
        p_elementos: resultado.elementos,
        p_tokens_entrada: resultado.tokensEntrada,
        p_tokens_saida: resultado.tokensSaida,
        p_duracao_ms: resultado.duracaoMs,
        p_custo_estimado: resultado.custoEstimadoUsd,
        p_response_id: resultado.responseId,
      })

    if (!error && typeof data === 'number') return data
    ultimoErro = error ?? new Error('Conclusão da extração não retornou quantidade de elementos.')
  }

  throw ultimoErro
}

export async function planejarExtracaoElementosStep(
  execucaoId: string
): Promise<PlanoExtracaoElementos> {
  'use step'

  const backend = createBackendClient()
  const { data: etapaData, error: etapaError } = await backend
    .schema('aplicacao')
    .rpc('backend_iniciar_etapa', {
      p_execucao_id: execucaoId,
      p_nome_etapa: 'extrair_elementos',
      p_estado_execucao: 'analisando',
      p_percentual: 58,
    })
  if (etapaError) throw etapaError

  const etapa = Array.isArray(etapaData) ? etapaData[0] : null
  const [config, fragmentos, sinteses] = await Promise.all([
    obterConfigExtracao(),
    listarFragmentos(execucaoId),
    listarSintesesAuditadas(execucaoId),
  ])

  if (fragmentos.length === 0) {
    await falharPipeline(
      execucaoId,
      'FRAGMENTOS_AUSENTES_PARA_EXTRACAO_ELEMENTOS',
      'Não há fragmentos materializados para extrair elementos.'
    )
    return { ok: false, execucaoId, motivo: 'fragmentos_ausentes' }
  }

  const documentoProcessadoId = fragmentos[0]!.documento_processado_id
  const sinteseObra = sinteses.find(
    (item) => item.tipo_alvo === 'obra' && item.alvo_id === documentoProcessadoId
  )
  if (!sinteseObra) {
    await falharPipeline(
      execucaoId,
      'SINTESE_OBRA_AUSENTE_PARA_EXTRACAO_ELEMENTOS',
      'A extração de elementos exige uma síntese global auditada da obra.'
    )
    return { ok: false, execucaoId, motivo: 'sintese_obra_ausente' }
  }

  return {
    ok: true,
    execucaoId,
    documentoProcessadoId,
    fragmentosIds: fragmentos.sort((a, b) => a.ordem - b.ordem).map((item) => item.fragmentoId),
    permitirCriacao: etapa?.deve_executar !== false,
    config,
  }
}

export async function extrairElementosFragmentoStep(
  execucaoId: string,
  fragmentoId: string,
  permitirCriacao: boolean,
  config: ConfigExtracaoElementos
): Promise<ResultadoExtracaoFragmento> {
  'use step'

  const [fragmentos, sinteses] = await Promise.all([
    listarFragmentos(execucaoId),
    listarSintesesAuditadas(execucaoId),
  ])

  const fragmento = fragmentos.find((item) => item.fragmentoId === fragmentoId)
  if (!fragmento) {
    if (permitirCriacao) {
      await falharPipeline(
        execucaoId,
        'FRAGMENTO_EXTRACAO_ELEMENTOS_NAO_ENCONTRADO',
        'O fragmento planejado para extração não existe.',
        { fragmento_id: fragmentoId }
      )
    }
    return { ok: false, execucaoId, fragmentoId, motivo: 'fragmento_nao_encontrado' }
  }

  const sinteseObra = sinteses.find(
    (item) => item.tipo_alvo === 'obra' && item.alvo_id === fragmento.documento_processado_id
  )
  if (!sinteseObra) {
    if (permitirCriacao) {
      await falharPipeline(
        execucaoId,
        'SINTESE_OBRA_AUSENTE_PARA_EXTRACAO_ELEMENTOS',
        'A síntese global auditada desapareceu durante a extração de elementos.'
      )
    }
    return { ok: false, execucaoId, fragmentoId, motivo: 'sintese_obra_ausente' }
  }

  const entrada: EntradaExtracaoElementos = {
    documentoProcessadoId: fragmento.documento_processado_id,
    sinteseObra: sinteseObra.conteudo,
    fragmento,
  }
  const textoEntrada = montarEntradaExtracaoElementos(entrada)
  const hashEntrada = calcularHashEntradaExtracaoElementos(entrada)

  if (textoEntrada.length > LIMITE_CARACTERES_ENTRADA_ELEMENTOS) {
    if (permitirCriacao) {
      await falharPipeline(
        execucaoId,
        'ENTRADA_ELEMENTOS_EXCESSIVA',
        'Um fragmento excede o limite seguro da extração de elementos.',
        { fragmento_id: fragmentoId, caracteres: textoEntrada.length }
      )
    }
    return { ok: false, execucaoId, fragmentoId, motivo: 'entrada_elementos_excessiva' }
  }

  if (!permitirCriacao) {
    const replay = await obterReplayAuditado({ execucaoId, fragmentoId, config, hashEntrada })
    if (!replay) {
      return { ok: false, execucaoId, fragmentoId, motivo: 'extracao_replay_ausente' }
    }
    return {
      ok: true,
      execucaoId,
      fragmentoId,
      quantidadeElementos: replay.quantidade_elementos,
      reutilizada: true,
    }
  }

  const preparo = await prepararChamadaIa({ execucaoId, fragmentoId, config, hashEntrada })

  if (!preparo.deve_chamar) {
    if (preparo.estado === 'concluida' && preparo.quantidade_elementos !== null) {
      return {
        ok: true,
        execucaoId,
        fragmentoId,
        quantidadeElementos: preparo.quantidade_elementos,
        reutilizada: true,
      }
    }

    if (preparo.estado === 'reservada' || preparo.estado === 'em_execucao') {
      throw new Error('CHAMADA_IA_EM_ANDAMENTO')
    }

    await falharPipeline(
      execucaoId,
      'EXTRACAO_ELEMENTOS_IA_NAO_REUTILIZAVEL',
      'A chamada de extração por IA está em estado terminal e não pode ser repetida automaticamente.',
      { fragmento_id: fragmentoId, estado_ia: preparo.estado }
    )
    return {
      ok: false,
      execucaoId,
      fragmentoId,
      motivo: `chamada_ia_${preparo.estado}`,
    }
  }

  const backend = createBackendClient()
  const { data: iniciou, error: inicioError } = await backend
    .schema('aplicacao')
    .rpc('backend_marcar_execucao_ia_iniciada', { p_auditoria_id: preparo.auditoria_id })
  if (inicioError) throw inicioError
  if (iniciou !== true) throw new Error('RESERVA_IA_NAO_PODE_SER_INICIADA')

  const inicioChamada = Date.now()
  let resultado: Awaited<ReturnType<typeof extrairElementosDocumentais>>

  try {
    resultado = await extrairElementosDocumentais({
      cliente: criarClienteOpenAI(),
      modelo: config.identificador_modelo,
      promptSistema: config.conteudo_prompt,
      entrada,
    })
  } catch (erro) {
    const duracaoMs = Date.now() - inicioChamada
    const erroSeguro = descreverErroSeguro(erro)
    const statusHttp = obterStatusHttpExplicito(erro)

    if (statusHttp !== null && statusHttpRetryable(statusHttp)) {
      await marcarEstadoIa(preparo.auditoria_id, 'falhou', erroSeguro, duracaoMs)
      throw erro
    }

    if (statusHttp !== null) {
      await marcarEstadoIa(preparo.auditoria_id, 'cancelada', erroSeguro, duracaoMs)
      await falharPipeline(
        execucaoId,
        'EXTRACAO_ELEMENTOS_HTTP_NAO_REPETIVEL',
        'A OpenAI recusou a chamada de forma permanente; não haverá nova cobrança automática.',
        { fragmento_id: fragmentoId, status_http: statusHttp }
      )
      return {
        ok: false,
        execucaoId,
        fragmentoId,
        motivo: `chamada_ia_http_${statusHttp}_nao_repetivel`,
      }
    }

    await marcarEstadoIa(preparo.auditoria_id, 'incerta', erroSeguro, duracaoMs)
    await falharPipeline(
      execucaoId,
      'EXTRACAO_ELEMENTOS_IA_ESTADO_INCERTO',
      'A chamada externa ficou em estado incerto e não será repetida automaticamente.',
      { fragmento_id: fragmentoId }
    )
    return { ok: false, execucaoId, fragmentoId, motivo: 'chamada_ia_estado_incerto' }
  }

  if (!resultado.ok) {
    const duracaoMs = 'duracaoMs' in resultado ? resultado.duracaoMs : Date.now() - inicioChamada
    const responseId = 'responseId' in resultado ? resultado.responseId : null
    await marcarEstadoIa(
      preparo.auditoria_id,
      'cancelada',
      `${resultado.codigo}:${responseId ?? 'sem_response_id'}`,
      duracaoMs
    )
    await falharPipeline(
      execucaoId,
      resultado.codigo,
      'A resposta da IA falhou na validação determinística e não será repetida automaticamente.',
      { fragmento_id: fragmentoId }
    )
    return {
      ok: false,
      execucaoId,
      fragmentoId,
      motivo: resultado.codigo.toLowerCase(),
    }
  }

  let quantidadeElementos: number
  try {
    quantidadeElementos = await concluirExtracaoComRetry({
      auditoriaId: preparo.auditoria_id,
      resultado,
    })
  } catch (erro) {
    try {
      await marcarEstadoIa(
        preparo.auditoria_id,
        'incerta',
        `persistencia_pos_resposta:${descreverErroSeguro(erro)}`,
        resultado.duracaoMs
      )
    } catch {
      // A chamada externa já ocorreu; não mascarar a falha original nem
      // autorizar uma nova chamada quando o estado de persistência é incerto.
    }
    await falharPipeline(
      execucaoId,
      'PERSISTENCIA_EXTRACAO_ELEMENTOS_INCERTA',
      'A IA respondeu, mas a persistência do resultado ficou em estado incerto.',
      { fragmento_id: fragmentoId }
    )
    return {
      ok: false,
      execucaoId,
      fragmentoId,
      motivo: 'persistencia_extracao_elementos_estado_incerto',
    }
  }

  return {
    ok: true,
    execucaoId,
    fragmentoId,
    quantidadeElementos,
    reutilizada: false,
  }
}

export async function concluirExtracaoElementosStep(
  execucaoId: string,
  permitirCriacao: boolean,
  quantidadeFragmentos: number,
  quantidadeElementos: number
): Promise<ResultadoConclusaoExtracao> {
  'use step'

  if (quantidadeFragmentos < 1 || quantidadeElementos < 0) {
    return { ok: false, execucaoId, motivo: 'contagens_extracao_invalidas' }
  }

  if (permitirCriacao) {
    const backend = createBackendClient()
    const { data, error } = await backend
      .schema('aplicacao')
      .rpc('backend_concluir_etapa', {
        p_execucao_id: execucaoId,
        p_nome_etapa: 'extrair_elementos',
        p_percentual: 64,
        p_proximo_estado: 'classificando',
        p_proxima_etapa: 'normalizar_taxonomia',
        p_detalhes: {
          quantidade_fragmentos: quantidadeFragmentos,
          quantidade_elementos: quantidadeElementos,
        },
      })
    if (error) throw error
    if (data !== true) {
      throw new Error('A transição extrair_elementos → normalizar_taxonomia não foi aplicada.')
    }
  }

  return {
    ok: true,
    execucaoId,
    quantidadeFragmentos,
    quantidadeElementos,
    reutilizada: !permitirCriacao,
  }
}
