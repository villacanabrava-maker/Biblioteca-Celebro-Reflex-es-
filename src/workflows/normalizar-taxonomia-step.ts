import {
  LIMITE_CARACTERES_ENTRADA_TAXONOMIA,
  calcularHashEntradaTaxonomia,
  montarEntradaNormalizacaoTaxonomia,
  normalizarElementoTaxonomia,
  obterMatchExatoDeterministico,
  schemaSaidaNormalizacaoTaxonomiaV1Compativel,
  type CandidatoTaxonomia,
  type ElementoParaTaxonomia,
  type EntradaNormalizacaoTaxonomia,
} from '@/ia/taxonomia/normalizar-elemento-taxonomia'
import { criarClienteOpenAI } from '@/infraestrutura/openai/cliente'
import { obterModeloTaxonomia } from '@/infraestrutura/openai/modelos'
import { createBackendClient } from '@/infraestrutura/supabase/backend'

export type ConfigNormalizacaoTaxonomia = {
  modelo_ia_id: string
  identificador_modelo: string
  versao_prompt_id: string
  numero_versao_prompt: number
  conteudo_prompt: string
  schema_saida: Record<string, unknown>
}

export type PlanoNormalizacaoTaxonomia = {
  ok: boolean
  execucaoId: string
  elementosIds?: string[]
  permitirCriacao?: boolean
  config?: ConfigNormalizacaoTaxonomia
  motivo?: string
}

export type ResultadoNormalizacaoElemento = {
  ok: boolean
  execucaoId: string
  elementoId?: string
  tipoResultado?: 'classificacao' | 'proposta'
  referenciaId?: string
  deterministica?: boolean
  reutilizada?: boolean
  motivo?: string
}

export type ResultadoConclusaoTaxonomia = {
  ok: boolean
  execucaoId: string
  quantidadeElementos?: number
  quantidadeClassificacoes?: number
  quantidadePropostas?: number
  reutilizada?: boolean
  motivo?: string
}

type ElementoRpc = {
  documento_processado_id: string
  elemento_id: string
  codigo: string
  tipo: string
  plano_analitico: 'conteudo' | 'metodo' | 'expressao'
  titulo: string
  descricao: string
  importancia: number
  confianca: number
  quantidade_classificacoes: number
  quantidade_propostas: number
}

type CandidatoRpc = {
  conceito_id: string
  termo_preferencial: string
  definicao: string
  dominio: string
  termo_correspondente: string
  tipo_termo: string
  tipo_correspondencia: 'exata' | 'similaridade'
  similaridade: number
}

type PreparacaoIa = {
  auditoria_id: string
  estado: 'reservada' | 'em_execucao' | 'concluida' | 'falhou' | 'incerta' | 'cancelada'
  tentativa: number
  deve_chamar: boolean
  tipo_resultado: 'classificacao' | 'proposta' | null
  referencia_id: string | null
}

type ReplayAuditado = {
  auditoria_id: string
  tipo_resultado: 'classificacao' | 'proposta'
  referencia_id: string
}

type ResultadoPersistencia = {
  tipo_resultado: 'classificacao' | 'proposta'
  referencia_id: string
}

async function obterConfigTaxonomia(): Promise<ConfigNormalizacaoTaxonomia> {
  const backend = createBackendClient()
  const modelo = obterModeloTaxonomia()
  const { data, error } = await backend
    .schema('aplicacao')
    .rpc('backend_obter_config_normalizacao_taxonomia', {
      p_identificador_modelo: modelo,
    })

  if (error) throw error
  const config = (Array.isArray(data) ? data[0] : null) as ConfigNormalizacaoTaxonomia | null
  if (!config) {
    throw new Error(`Modelo de taxonomia não catalogado/ativo: ${modelo}`)
  }
  if (!schemaSaidaNormalizacaoTaxonomiaV1Compativel(config.schema_saida)) {
    throw new Error('SCHEMA_NORMALIZACAO_TAXONOMIA_DIVERGENTE')
  }
  return config
}

async function listarElementos(execucaoId: string): Promise<ElementoRpc[]> {
  const backend = createBackendClient()
  const { data, error } = await backend
    .schema('aplicacao')
    .rpc('backend_listar_elementos_normalizacao', { p_execucao_id: execucaoId })
  if (error) throw error

  return ((Array.isArray(data) ? data : []) as Array<Record<string, unknown>>).map((linha) => ({
    documento_processado_id: String(linha.documento_processado_id),
    elemento_id: String(linha.elemento_id),
    codigo: String(linha.codigo),
    tipo: String(linha.tipo),
    plano_analitico: String(linha.plano_analitico) as ElementoRpc['plano_analitico'],
    titulo: String(linha.titulo),
    descricao: String(linha.descricao),
    importancia: Number(linha.importancia),
    confianca: Number(linha.confianca),
    quantidade_classificacoes: Number(linha.quantidade_classificacoes),
    quantidade_propostas: Number(linha.quantidade_propostas),
  }))
}

async function buscarCandidatos(
  execucaoId: string,
  elementoId: string
): Promise<CandidatoTaxonomia[]> {
  const backend = createBackendClient()
  const { data, error } = await backend
    .schema('aplicacao')
    .rpc('backend_buscar_candidatos_taxonomia', {
      p_execucao_id: execucaoId,
      p_elemento_id: elementoId,
      p_limite: 20,
    })
  if (error) throw error

  return ((Array.isArray(data) ? data : []) as CandidatoRpc[]).map((linha) => ({
    conceitoId: linha.conceito_id,
    termoPreferencial: linha.termo_preferencial,
    definicao: linha.definicao,
    dominio: linha.dominio,
    termoCorrespondente: linha.termo_correspondente,
    tipoTermo: linha.tipo_termo,
    tipoCorrespondencia: linha.tipo_correspondencia,
    similaridade: Number(linha.similaridade),
  }))
}

function mapearElemento(linha: ElementoRpc): ElementoParaTaxonomia {
  return {
    elementoId: linha.elemento_id,
    codigo: linha.codigo,
    tipo: linha.tipo,
    planoAnalitico: linha.plano_analitico,
    titulo: linha.titulo,
    descricao: linha.descricao,
  }
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
      p_nome_etapa: 'normalizar_taxonomia',
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

async function classificarExato(
  execucaoId: string,
  elementoId: string,
  conceitoId: string
): Promise<string> {
  const backend = createBackendClient()
  const { data, error } = await backend
    .schema('aplicacao')
    .rpc('backend_classificar_elemento_taxonomia_exata', {
      p_execucao_id: execucaoId,
      p_elemento_id: elementoId,
      p_conceito_id: conceitoId,
    })
  if (error) throw error
  if (typeof data !== 'string' || data.length === 0) {
    throw new Error('Classificação taxonômica exata não retornou ID.')
  }
  return data
}

async function obterReplayExato(
  execucaoId: string,
  elementoId: string,
  conceitoId: string
): Promise<string | null> {
  const backend = createBackendClient()
  const { data, error } = await backend
    .schema('aplicacao')
    .rpc('backend_obter_classificacao_taxonomia_exata', {
      p_execucao_id: execucaoId,
      p_elemento_id: elementoId,
      p_conceito_id: conceitoId,
    })
  if (error) throw error
  return typeof data === 'string' && data.length > 0 ? data : null
}

async function prepararChamadaIa({
  execucaoId,
  elementoId,
  config,
  hashEntrada,
  candidatos,
}: {
  execucaoId: string
  elementoId: string
  config: ConfigNormalizacaoTaxonomia
  hashEntrada: string
  candidatos: CandidatoTaxonomia[]
}): Promise<PreparacaoIa> {
  const backend = createBackendClient()
  const { data, error } = await backend
    .schema('aplicacao')
    .rpc('backend_preparar_normalizacao_taxonomia_ia', {
      p_execucao_id: execucaoId,
      p_elemento_id: elementoId,
      p_modelo_ia_id: config.modelo_ia_id,
      p_versao_prompt_id: config.versao_prompt_id,
      p_hash_entrada: hashEntrada,
      p_candidatos_ids: candidatos.map((candidato) => candidato.conceitoId),
    })
  if (error) throw error

  const preparo = (Array.isArray(data) ? data[0] : null) as PreparacaoIa | null
  if (!preparo) throw new Error('Reserva da normalização taxonômica não retornou resultado.')
  return preparo
}

async function obterReplayAuditado({
  execucaoId,
  elementoId,
  config,
  hashEntrada,
}: {
  execucaoId: string
  elementoId: string
  config: ConfigNormalizacaoTaxonomia
  hashEntrada: string
}): Promise<ReplayAuditado | null> {
  const backend = createBackendClient()
  const { data, error } = await backend
    .schema('aplicacao')
    .rpc('backend_obter_normalizacao_taxonomia_auditada', {
      p_execucao_id: execucaoId,
      p_elemento_id: elementoId,
      p_modelo_ia_id: config.modelo_ia_id,
      p_versao_prompt_id: config.versao_prompt_id,
      p_hash_entrada: hashEntrada,
    })
  if (error) throw error
  return (Array.isArray(data) ? data[0] : null) as ReplayAuditado | null
}

async function concluirNormalizacaoComRetry({
  auditoriaId,
  resultado,
}: {
  auditoriaId: string
  resultado: Extract<
    Awaited<ReturnType<typeof normalizarElementoTaxonomia>>,
    { ok: true; origem: 'ia' }
  >
}): Promise<ResultadoPersistencia> {
  let ultimoErro: unknown = null

  for (let tentativa = 1; tentativa <= 3; tentativa += 1) {
    const backend = createBackendClient()
    const { data, error } = await backend
      .schema('aplicacao')
      .rpc('backend_concluir_normalizacao_taxonomia_ia', {
        p_auditoria_id: auditoriaId,
        p_decisao: resultado.decisao.decisao,
        p_conceito_id: resultado.decisao.conceito_id,
        p_proposta: resultado.decisao.proposta,
        p_papel: resultado.decisao.papel,
        p_confianca: resultado.decisao.confianca,
        p_justificativa: resultado.decisao.justificativa,
        p_tokens_entrada: resultado.tokensEntrada,
        p_tokens_saida: resultado.tokensSaida,
        p_duracao_ms: resultado.duracaoMs,
        p_custo_estimado: resultado.custoEstimadoUsd,
        p_response_id: resultado.responseId,
      })

    const persistido = (Array.isArray(data) ? data[0] : null) as ResultadoPersistencia | null
    if (!error && persistido?.referencia_id) return persistido
    ultimoErro = error ?? new Error('Conclusão taxonômica não retornou referência persistida.')
  }

  throw ultimoErro
}

export async function planejarNormalizacaoTaxonomiaStep(
  execucaoId: string
): Promise<PlanoNormalizacaoTaxonomia> {
  'use step'

  const backend = createBackendClient()
  const { data: etapaData, error: etapaError } = await backend
    .schema('aplicacao')
    .rpc('backend_iniciar_etapa', {
      p_execucao_id: execucaoId,
      p_nome_etapa: 'normalizar_taxonomia',
      p_estado_execucao: 'classificando',
      p_percentual: 66,
    })
  if (etapaError) throw etapaError

  const etapa = Array.isArray(etapaData) ? etapaData[0] : null
  const [config, elementos] = await Promise.all([
    obterConfigTaxonomia(),
    listarElementos(execucaoId),
  ])

  return {
    ok: true,
    execucaoId,
    elementosIds: elementos.map((elemento) => elemento.elemento_id),
    permitirCriacao: etapa?.deve_executar !== false,
    config,
  }
}

export async function normalizarElementoTaxonomiaStep(
  execucaoId: string,
  elementoId: string,
  permitirCriacao: boolean,
  config: ConfigNormalizacaoTaxonomia
): Promise<ResultadoNormalizacaoElemento> {
  'use step'

  const elementos = await listarElementos(execucaoId)
  const linha = elementos.find((elemento) => elemento.elemento_id === elementoId)
  if (!linha) {
    if (permitirCriacao) {
      await falharPipeline(
        execucaoId,
        'ELEMENTO_TAXONOMIA_NAO_ENCONTRADO',
        'O elemento planejado para normalização taxonômica não existe.',
        { elemento_id: elementoId }
      )
    }
    return { ok: false, execucaoId, elementoId, motivo: 'elemento_nao_encontrado' }
  }

  const candidatos = await buscarCandidatos(execucaoId, elementoId)
  const elemento = mapearElemento(linha)
  const entrada: EntradaNormalizacaoTaxonomia = { elemento, candidatos }
  const exato = obterMatchExatoDeterministico(candidatos)

  if (exato) {
    const referenciaId = permitirCriacao
      ? await classificarExato(execucaoId, elementoId, exato.conceitoId)
      : await obterReplayExato(execucaoId, elementoId, exato.conceitoId)

    if (!referenciaId) {
      return {
        ok: false,
        execucaoId,
        elementoId,
        motivo: 'classificacao_exata_replay_ausente',
      }
    }

    return {
      ok: true,
      execucaoId,
      elementoId,
      tipoResultado: 'classificacao',
      referenciaId,
      deterministica: true,
      reutilizada: !permitirCriacao,
    }
  }

  const textoEntrada = montarEntradaNormalizacaoTaxonomia(entrada)
  const hashEntrada = calcularHashEntradaTaxonomia(entrada)

  if (textoEntrada.length > LIMITE_CARACTERES_ENTRADA_TAXONOMIA) {
    if (permitirCriacao) {
      await falharPipeline(
        execucaoId,
        'ENTRADA_TAXONOMIA_EXCESSIVA',
        'Um elemento excede o limite seguro da normalização taxonômica.',
        { elemento_id: elementoId, caracteres: textoEntrada.length }
      )
    }
    return { ok: false, execucaoId, elementoId, motivo: 'entrada_taxonomia_excessiva' }
  }

  if (!permitirCriacao) {
    const replay = await obterReplayAuditado({ execucaoId, elementoId, config, hashEntrada })
    if (!replay) {
      return { ok: false, execucaoId, elementoId, motivo: 'normalizacao_taxonomia_replay_ausente' }
    }
    return {
      ok: true,
      execucaoId,
      elementoId,
      tipoResultado: replay.tipo_resultado,
      referenciaId: replay.referencia_id,
      deterministica: false,
      reutilizada: true,
    }
  }

  const preparo = await prepararChamadaIa({
    execucaoId,
    elementoId,
    config,
    hashEntrada,
    candidatos,
  })

  if (!preparo.deve_chamar) {
    if (preparo.estado === 'concluida' && preparo.tipo_resultado && preparo.referencia_id) {
      return {
        ok: true,
        execucaoId,
        elementoId,
        tipoResultado: preparo.tipo_resultado,
        referenciaId: preparo.referencia_id,
        deterministica: false,
        reutilizada: true,
      }
    }

    if (preparo.estado === 'reservada' || preparo.estado === 'em_execucao') {
      throw new Error('CHAMADA_IA_TAXONOMIA_EM_ANDAMENTO')
    }

    await falharPipeline(
      execucaoId,
      'NORMALIZACAO_TAXONOMIA_IA_NAO_REUTILIZAVEL',
      'A chamada taxonômica por IA está em estado terminal e não pode ser repetida automaticamente.',
      { elemento_id: elementoId, estado_ia: preparo.estado }
    )
    return {
      ok: false,
      execucaoId,
      elementoId,
      motivo: `chamada_ia_${preparo.estado}`,
    }
  }

  const backend = createBackendClient()
  const { data: iniciou, error: inicioError } = await backend
    .schema('aplicacao')
    .rpc('backend_marcar_execucao_ia_iniciada', { p_auditoria_id: preparo.auditoria_id })
  if (inicioError) throw inicioError
  if (iniciou !== true) throw new Error('RESERVA_IA_TAXONOMIA_NAO_PODE_SER_INICIADA')

  const inicioChamada = Date.now()
  let resultado: Awaited<ReturnType<typeof normalizarElementoTaxonomia>>

  try {
    resultado = await normalizarElementoTaxonomia({
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
        'NORMALIZACAO_TAXONOMIA_HTTP_NAO_REPETIVEL',
        'A OpenAI recusou a chamada taxonômica de forma permanente; não haverá nova cobrança automática.',
        { elemento_id: elementoId, status_http: statusHttp }
      )
      return {
        ok: false,
        execucaoId,
        elementoId,
        motivo: `chamada_ia_http_${statusHttp}_nao_repetivel`,
      }
    }

    await marcarEstadoIa(preparo.auditoria_id, 'incerta', erroSeguro, duracaoMs)
    await falharPipeline(
      execucaoId,
      'NORMALIZACAO_TAXONOMIA_IA_ESTADO_INCERTO',
      'A chamada externa ficou em estado incerto e não será repetida automaticamente.',
      { elemento_id: elementoId }
    )
    return { ok: false, execucaoId, elementoId, motivo: 'chamada_ia_estado_incerto' }
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
      'A decisão taxonômica falhou na validação determinística e não será repetida automaticamente.',
      { elemento_id: elementoId }
    )
    return {
      ok: false,
      execucaoId,
      elementoId,
      motivo: resultado.codigo.toLowerCase(),
    }
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
      'NORMALIZACAO_TAXONOMIA_FLUXO_INCONSISTENTE',
      'Um match exato surgiu depois da reserva de IA; o resultado foi bloqueado para revisão.',
      { elemento_id: elementoId }
    )
    return { ok: false, execucaoId, elementoId, motivo: 'fluxo_taxonomia_inconsistente' }
  }

  let persistido: ResultadoPersistencia
  try {
    persistido = await concluirNormalizacaoComRetry({
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
      // A chamada externa já ocorreu. Não autorizar nova chamada quando a
      // persistência ficou em estado incerto.
    }
    await falharPipeline(
      execucaoId,
      'PERSISTENCIA_NORMALIZACAO_TAXONOMIA_INCERTA',
      'A IA respondeu, mas a persistência da decisão taxonômica ficou em estado incerto.',
      { elemento_id: elementoId }
    )
    return {
      ok: false,
      execucaoId,
      elementoId,
      motivo: 'persistencia_taxonomia_estado_incerto',
    }
  }

  return {
    ok: true,
    execucaoId,
    elementoId,
    tipoResultado: persistido.tipo_resultado,
    referenciaId: persistido.referencia_id,
    deterministica: false,
    reutilizada: false,
  }
}

export async function concluirNormalizacaoTaxonomiaStep(
  execucaoId: string,
  permitirCriacao: boolean,
  quantidadeElementos: number,
  quantidadeClassificacoes: number,
  quantidadePropostas: number
): Promise<ResultadoConclusaoTaxonomia> {
  'use step'

  if (
    quantidadeElementos < 0 ||
    quantidadeClassificacoes < 0 ||
    quantidadePropostas < 0 ||
    quantidadeClassificacoes + quantidadePropostas !== quantidadeElementos
  ) {
    return { ok: false, execucaoId, motivo: 'contagens_taxonomia_invalidas' }
  }

  if (permitirCriacao) {
    const backend = createBackendClient()
    const { data, error } = await backend
      .schema('aplicacao')
      .rpc('backend_concluir_etapa', {
        p_execucao_id: execucaoId,
        p_nome_etapa: 'normalizar_taxonomia',
        p_percentual: 70,
        p_proximo_estado: 'relacionando',
        p_proxima_etapa: 'criar_relacoes',
        p_detalhes: {
          quantidade_elementos: quantidadeElementos,
          quantidade_classificacoes: quantidadeClassificacoes,
          quantidade_propostas: quantidadePropostas,
        },
      })
    if (error) throw error
    if (data !== true) {
      throw new Error('A transição normalizar_taxonomia → criar_relacoes não foi aplicada.')
    }
  }

  return {
    ok: true,
    execucaoId,
    quantidadeElementos,
    quantidadeClassificacoes,
    quantidadePropostas,
    reutilizada: !permitirCriacao,
  }
}
