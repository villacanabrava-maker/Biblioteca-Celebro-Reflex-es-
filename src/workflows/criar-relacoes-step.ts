import {
  LIMITE_CARACTERES_ENTRADA_RELACOES,
  calcularHashEntradaRelacoes,
  inferirRelacoesElementos,
  montarEntradaRelacoesElementos,
  schemaSaidaRelacoesElementosV1Compativel,
  type ElementoParaRelacoes,
  type EntradaRelacoesElementos,
} from '@/ia/motor-documental/inferir-relacoes-elementos'
import { criarClienteOpenAI } from '@/infraestrutura/openai/cliente'
import { obterModeloAnalise } from '@/infraestrutura/openai/modelos'
import { createBackendClient } from '@/infraestrutura/supabase/backend'

const MAX_ELEMENTOS_RELACOES_LOCAL = 40

export type ConfigRelacoesElementos = {
  modelo_ia_id: string
  identificador_modelo: string
  versao_prompt_id: string
  numero_versao_prompt: number
  conteudo_prompt: string
  schema_saida: Record<string, unknown>
}

export type PlanoRelacoesElementos = {
  ok: boolean
  execucaoId: string
  fragmentosIds?: string[]
  permitirCriacao?: boolean
  config?: ConfigRelacoesElementos
  motivo?: string
}

export type ResultadoRelacoesFragmento = {
  ok: boolean
  execucaoId: string
  fragmentoId?: string
  quantidadeRelacoes?: number
  deterministica?: boolean
  reutilizada?: boolean
  motivo?: string
}

export type ResultadoConclusaoRelacoes = {
  ok: boolean
  execucaoId: string
  quantidadeFragmentos?: number
  quantidadeRelacoes?: number
  reutilizada?: boolean
  motivo?: string
}

type ContextoRpc = {
  documento_processado_id: string
  fragmento_id: string
  fragmento_codigo: string
  fragmento_ordem: number
  elemento_id: string
  elemento_codigo: string
  elemento_tipo: string
  plano_analitico: 'conteudo' | 'metodo' | 'expressao'
  titulo: string
  descricao: string
  evidencia_id: string
  trecho_referencia: string
  evidencia_ordem: number
}

type PreparacaoIa = {
  auditoria_id: string
  estado: 'reservada' | 'em_execucao' | 'concluida' | 'falhou' | 'incerta' | 'cancelada'
  tentativa: number
  deve_chamar: boolean
  quantidade_relacoes: number | null
}

type ReplayAuditado = {
  auditoria_id: string
  quantidade_relacoes: number
}

async function obterConfigRelacoes(): Promise<ConfigRelacoesElementos> {
  const backend = createBackendClient()
  const modelo = obterModeloAnalise()
  const { data, error } = await backend
    .schema('aplicacao')
    .rpc('backend_obter_config_relacoes_elementos', { p_identificador_modelo: modelo })

  if (error) throw error
  const config = (Array.isArray(data) ? data[0] : null) as ConfigRelacoesElementos | null
  if (!config) throw new Error(`Modelo de análise não catalogado/ativo para relações: ${modelo}`)
  if (!schemaSaidaRelacoesElementosV1Compativel(config.schema_saida)) {
    throw new Error('SCHEMA_RELACOES_ELEMENTOS_DIVERGENTE')
  }
  return config
}

async function listarContextos(execucaoId: string): Promise<ContextoRpc[]> {
  const backend = createBackendClient()
  const { data, error } = await backend
    .schema('aplicacao')
    .rpc('backend_listar_contextos_relacoes', { p_execucao_id: execucaoId })
  if (error) throw error

  return ((Array.isArray(data) ? data : []) as Array<Record<string, unknown>>).map((linha) => ({
    documento_processado_id: String(linha.documento_processado_id),
    fragmento_id: String(linha.fragmento_id),
    fragmento_codigo: String(linha.fragmento_codigo),
    fragmento_ordem: Number(linha.fragmento_ordem),
    elemento_id: String(linha.elemento_id),
    elemento_codigo: String(linha.elemento_codigo),
    elemento_tipo: String(linha.elemento_tipo),
    plano_analitico: String(linha.plano_analitico) as ContextoRpc['plano_analitico'],
    titulo: String(linha.titulo),
    descricao: String(linha.descricao),
    evidencia_id: String(linha.evidencia_id),
    trecho_referencia: String(linha.trecho_referencia),
    evidencia_ordem: Number(linha.evidencia_ordem),
  }))
}

function agruparContextos(linhas: ContextoRpc[]): EntradaRelacoesElementos[] {
  const fragmentos = new Map<
    string,
    {
      fragmentoId: string
      fragmentoCodigo: string
      ordem: number
      elementos: Map<string, ElementoParaRelacoes>
    }
  >()

  for (const linha of linhas) {
    let fragmento = fragmentos.get(linha.fragmento_id)
    if (!fragmento) {
      fragmento = {
        fragmentoId: linha.fragmento_id,
        fragmentoCodigo: linha.fragmento_codigo,
        ordem: linha.fragmento_ordem,
        elementos: new Map(),
      }
      fragmentos.set(linha.fragmento_id, fragmento)
    }

    let elemento = fragmento.elementos.get(linha.elemento_id)
    if (!elemento) {
      elemento = {
        elementoId: linha.elemento_id,
        codigo: linha.elemento_codigo,
        tipo: linha.elemento_tipo,
        planoAnalitico: linha.plano_analitico,
        titulo: linha.titulo,
        descricao: linha.descricao,
        evidencias: [],
      }
      fragmento.elementos.set(linha.elemento_id, elemento)
    }

    if (!elemento.evidencias.includes(linha.trecho_referencia)) {
      elemento.evidencias.push(linha.trecho_referencia)
    }
  }

  return [...fragmentos.values()]
    .sort((a, b) => a.ordem - b.ordem || a.fragmentoId.localeCompare(b.fragmentoId))
    .map((fragmento) => ({
      fragmentoId: fragmento.fragmentoId,
      fragmentoCodigo: fragmento.fragmentoCodigo,
      elementos: [...fragmento.elementos.values()].sort(
        (a, b) => a.codigo.localeCompare(b.codigo) || a.elementoId.localeCompare(b.elementoId)
      ),
    }))
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
      p_nome_etapa: 'criar_relacoes',
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
  entrada,
  config,
  hashEntrada,
}: {
  execucaoId: string
  entrada: EntradaRelacoesElementos
  config: ConfigRelacoesElementos
  hashEntrada: string
}): Promise<PreparacaoIa> {
  const backend = createBackendClient()
  const { data, error } = await backend
    .schema('aplicacao')
    .rpc('backend_preparar_relacoes_elementos_ia', {
      p_execucao_id: execucaoId,
      p_fragmento_id: entrada.fragmentoId,
      p_modelo_ia_id: config.modelo_ia_id,
      p_versao_prompt_id: config.versao_prompt_id,
      p_hash_entrada: hashEntrada,
      p_elementos_ids: entrada.elementos.map((elemento) => elemento.elementoId),
    })
  if (error) throw error

  const preparo = (Array.isArray(data) ? data[0] : null) as PreparacaoIa | null
  if (!preparo) throw new Error('Reserva de relações por IA não retornou resultado.')
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
  config: ConfigRelacoesElementos
  hashEntrada: string
}): Promise<ReplayAuditado | null> {
  const backend = createBackendClient()
  const { data, error } = await backend
    .schema('aplicacao')
    .rpc('backend_obter_relacoes_elementos_auditadas', {
      p_execucao_id: execucaoId,
      p_fragmento_id: fragmentoId,
      p_modelo_ia_id: config.modelo_ia_id,
      p_versao_prompt_id: config.versao_prompt_id,
      p_hash_entrada: hashEntrada,
    })
  if (error) throw error
  return (Array.isArray(data) ? data[0] : null) as ReplayAuditado | null
}

async function concluirRelacoesComRetry({
  auditoriaId,
  resultado,
}: {
  auditoriaId: string
  resultado: Extract<Awaited<ReturnType<typeof inferirRelacoesElementos>>, { ok: true; origem: 'ia' }>
}): Promise<number> {
  let ultimoErro: unknown = null

  for (let tentativa = 1; tentativa <= 3; tentativa += 1) {
    const backend = createBackendClient()
    const { data, error } = await backend
      .schema('aplicacao')
      .rpc('backend_concluir_relacoes_elementos_ia', {
        p_auditoria_id: auditoriaId,
        p_relacoes: resultado.relacoes,
        p_tokens_entrada: resultado.tokensEntrada,
        p_tokens_saida: resultado.tokensSaida,
        p_duracao_ms: resultado.duracaoMs,
        p_custo_estimado: resultado.custoEstimadoUsd,
        p_response_id: resultado.responseId,
      })

    if (!error && typeof data === 'number') return data
    ultimoErro = error ?? new Error('Conclusão de relações não retornou contagem persistida.')
  }

  throw ultimoErro
}

export async function planejarRelacoesElementosStep(
  execucaoId: string
): Promise<PlanoRelacoesElementos> {
  'use step'

  const backend = createBackendClient()
  const { data: etapaData, error: etapaError } = await backend
    .schema('aplicacao')
    .rpc('backend_iniciar_etapa', {
      p_execucao_id: execucaoId,
      p_nome_etapa: 'criar_relacoes',
      p_estado_execucao: 'relacionando',
      p_percentual: 71,
    })
  if (etapaError) throw etapaError

  const etapa = Array.isArray(etapaData) ? etapaData[0] : null
  const [config, contextos] = await Promise.all([
    obterConfigRelacoes(),
    listarContextos(execucaoId),
  ])
  const entradas = agruparContextos(contextos)

  return {
    ok: true,
    execucaoId,
    fragmentosIds: entradas.map((entrada) => entrada.fragmentoId),
    permitirCriacao: etapa?.deve_executar !== false,
    config,
  }
}

export async function criarRelacoesFragmentoStep(
  execucaoId: string,
  fragmentoId: string,
  permitirCriacao: boolean,
  config: ConfigRelacoesElementos
): Promise<ResultadoRelacoesFragmento> {
  'use step'

  const entradas = agruparContextos(await listarContextos(execucaoId))
  const entrada = entradas.find((item) => item.fragmentoId === fragmentoId)
  if (!entrada) {
    if (permitirCriacao) {
      await falharPipeline(
        execucaoId,
        'FRAGMENTO_RELACOES_NAO_ENCONTRADO',
        'O fragmento planejado para criação de relações não possui mais contexto local.',
        { fragmento_id: fragmentoId }
      )
    }
    return { ok: false, execucaoId, fragmentoId, motivo: 'fragmento_relacoes_nao_encontrado' }
  }

  if (entrada.elementos.length < 2) {
    return {
      ok: true,
      execucaoId,
      fragmentoId,
      quantidadeRelacoes: 0,
      deterministica: true,
      reutilizada: !permitirCriacao,
    }
  }

  if (entrada.elementos.length > MAX_ELEMENTOS_RELACOES_LOCAL) {
    if (permitirCriacao) {
      await falharPipeline(
        execucaoId,
        'ELEMENTOS_RELACOES_EXCESSIVOS',
        'Um fragmento excede o limite seguro de elementos da criação local de relações.',
        { fragmento_id: fragmentoId, elementos: entrada.elementos.length }
      )
    }
    return { ok: false, execucaoId, fragmentoId, motivo: 'elementos_relacoes_excessivos' }
  }

  const textoEntrada = montarEntradaRelacoesElementos(entrada)
  const hashEntrada = calcularHashEntradaRelacoes(entrada)

  if (textoEntrada.length > LIMITE_CARACTERES_ENTRADA_RELACOES) {
    if (permitirCriacao) {
      await falharPipeline(
        execucaoId,
        'ENTRADA_RELACOES_EXCESSIVA',
        'Um fragmento excede o limite seguro de contexto da criação de relações.',
        { fragmento_id: fragmentoId, caracteres: textoEntrada.length }
      )
    }
    return { ok: false, execucaoId, fragmentoId, motivo: 'entrada_relacoes_excessiva' }
  }

  if (!permitirCriacao) {
    const replay = await obterReplayAuditado({ execucaoId, fragmentoId, config, hashEntrada })
    if (!replay) {
      return { ok: false, execucaoId, fragmentoId, motivo: 'relacoes_replay_ausente' }
    }
    return {
      ok: true,
      execucaoId,
      fragmentoId,
      quantidadeRelacoes: replay.quantidade_relacoes,
      deterministica: false,
      reutilizada: true,
    }
  }

  const preparo = await prepararChamadaIa({ execucaoId, entrada, config, hashEntrada })

  if (!preparo.deve_chamar) {
    if (preparo.estado === 'concluida' && preparo.quantidade_relacoes !== null) {
      return {
        ok: true,
        execucaoId,
        fragmentoId,
        quantidadeRelacoes: preparo.quantidade_relacoes,
        deterministica: false,
        reutilizada: true,
      }
    }

    if (preparo.estado === 'reservada' || preparo.estado === 'em_execucao') {
      throw new Error('CHAMADA_IA_RELACOES_EM_ANDAMENTO')
    }

    await falharPipeline(
      execucaoId,
      'RELACOES_IA_NAO_REUTILIZAVEL',
      'A chamada de relações por IA está em estado terminal e não pode ser repetida automaticamente.',
      { fragmento_id: fragmentoId, estado_ia: preparo.estado }
    )
    return { ok: false, execucaoId, fragmentoId, motivo: `chamada_ia_${preparo.estado}` }
  }

  const backend = createBackendClient()
  const { data: iniciou, error: inicioError } = await backend
    .schema('aplicacao')
    .rpc('backend_marcar_execucao_ia_iniciada', { p_auditoria_id: preparo.auditoria_id })
  if (inicioError) throw inicioError
  if (iniciou !== true) throw new Error('RESERVA_IA_RELACOES_NAO_PODE_SER_INICIADA')

  const inicioChamada = Date.now()
  let resultado: Awaited<ReturnType<typeof inferirRelacoesElementos>>

  try {
    resultado = await inferirRelacoesElementos({
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
        'RELACOES_HTTP_NAO_REPETIVEL',
        'A OpenAI recusou a chamada de relações de forma permanente; não haverá nova cobrança automática.',
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
      'RELACOES_IA_ESTADO_INCERTO',
      'A chamada externa de relações ficou em estado incerto e não será repetida automaticamente.',
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
      'A resposta de relações falhou na validação determinística e não será repetida automaticamente.',
      { fragmento_id: fragmentoId }
    )
    return { ok: false, execucaoId, fragmentoId, motivo: resultado.codigo.toLowerCase() }
  }

  if (resultado.origem !== 'ia') {
    await marcarEstadoIa(
      preparo.auditoria_id,
      'cancelada',
      'resultado_deterministico_apos_reserva_ia',
      resultado.duracaoMs
    )
    await falharPipeline(
      execucaoId,
      'RELACOES_FLUXO_INCONSISTENTE',
      'O conjunto de elementos mudou depois da reserva de IA; o resultado foi bloqueado.',
      { fragmento_id: fragmentoId }
    )
    return { ok: false, execucaoId, fragmentoId, motivo: 'fluxo_relacoes_inconsistente' }
  }

  let quantidadeRelacoes: number
  try {
    quantidadeRelacoes = await concluirRelacoesComRetry({
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
      // A chamada externa já ocorreu; não autorizar repetição quando a
      // persistência ficou em estado incerto.
    }
    await falharPipeline(
      execucaoId,
      'PERSISTENCIA_RELACOES_INCERTA',
      'A IA respondeu, mas a persistência das relações ficou em estado incerto.',
      { fragmento_id: fragmentoId }
    )
    return { ok: false, execucaoId, fragmentoId, motivo: 'persistencia_relacoes_estado_incerto' }
  }

  return {
    ok: true,
    execucaoId,
    fragmentoId,
    quantidadeRelacoes,
    deterministica: false,
    reutilizada: false,
  }
}

export async function concluirRelacoesElementosStep(
  execucaoId: string,
  permitirCriacao: boolean,
  quantidadeFragmentos: number,
  quantidadeRelacoes: number
): Promise<ResultadoConclusaoRelacoes> {
  'use step'

  if (quantidadeFragmentos < 0 || quantidadeRelacoes < 0) {
    return { ok: false, execucaoId, motivo: 'contagens_relacoes_invalidas' }
  }

  if (permitirCriacao) {
    const backend = createBackendClient()
    const { data, error } = await backend
      .schema('aplicacao')
      .rpc('backend_concluir_etapa', {
        p_execucao_id: execucaoId,
        p_nome_etapa: 'criar_relacoes',
        p_percentual: 74,
        p_proximo_estado: 'vetorizando',
        p_proxima_etapa: 'gerar_embeddings',
        p_detalhes: {
          quantidade_fragmentos_com_elementos: quantidadeFragmentos,
          quantidade_relacoes: quantidadeRelacoes,
          estrategia_v1: 'intra_fragmento',
        },
      })
    if (error) throw error
    if (data !== true) {
      throw new Error('A transição criar_relacoes → gerar_embeddings não foi aplicada.')
    }
  }

  return {
    ok: true,
    execucaoId,
    quantidadeFragmentos,
    quantidadeRelacoes,
    reutilizada: !permitirCriacao,
  }
}
