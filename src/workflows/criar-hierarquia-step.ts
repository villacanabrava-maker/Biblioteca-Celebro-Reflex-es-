import { createHash } from 'node:crypto'
import { LIMITES_EXTRACAO } from '@/dominios/processamento/extrair-conteudo'
import { validarArtefatoEstrutura } from '@/dominios/processamento/identificar-estrutura'
import { construirHierarquiaDocumento } from '@/dominios/processamento/criar-hierarquia'
import { createBackendClient } from '@/infraestrutura/supabase/backend'

export type ResultadoCriarHierarquiaStep = {
  ok: boolean
  execucaoId: string
  documentoProcessadoId?: string
  quantidadeSecoes?: number
  motivo?: string
  reutilizada?: boolean
}

type ContextoExecucao = {
  execucao_id: string
  usuario_id: string
  hash_sha256: string
}

type ArtefatoExecucao = {
  artefato_id: string
  usuario_id: string
  execucao_id: string
  tipo: string
  caminho_arquivo: string
  tipo_mime: string
  tamanho_bytes: number
  hash_sha256: string
  metadados: Record<string, unknown> | null
  criado_em: string
}

type DownloadArtefato =
  | { ok: true; dados: Uint8Array }
  | {
      ok: false
      motivo: 'tamanho_excedido' | 'integridade_divergente' | 'mime_invalido'
      detalhes: Record<string, string | number | boolean | null>
    }

async function obterContexto(execucaoId: string) {
  const backend = createBackendClient()
  const { data, error } = await backend
    .schema('aplicacao')
    .rpc('backend_obter_execucao', { p_execucao_id: execucaoId })

  if (error) throw error

  const contexto = (Array.isArray(data) ? data[0] : null) as
    | ContextoExecucao
    | undefined

  if (!contexto) throw new Error('Execução de processamento não encontrada.')
  return contexto
}

async function obterArtefato(
  execucaoId: string,
  tipo: 'conteudo_extraido' | 'conteudo_normalizado' | 'estrutura_identificada'
) {
  const backend = createBackendClient()
  const { data, error } = await backend
    .schema('aplicacao')
    .rpc('backend_obter_artefato_execucao', {
      p_execucao_id: execucaoId,
      p_tipo: tipo,
    })

  if (error) throw error
  return (Array.isArray(data) ? data[0] : null) as ArtefatoExecucao | null
}

async function registrarFalhaDeterministica(
  execucaoId: string,
  codigoErro: string,
  mensagemErro: string,
  detalhes: Record<string, unknown> = {}
) {
  const backend = createBackendClient()
  const { error } = await backend
    .schema('aplicacao')
    .rpc('backend_falhar_execucao', {
      p_execucao_id: execucaoId,
      p_nome_etapa: 'criar_hierarquia',
      p_codigo_erro: codigoErro,
      p_mensagem_erro: mensagemErro,
      p_detalhes: detalhes,
    })

  if (error) throw error
}

async function baixarArtefatoVerificado(
  artefato: ArtefatoExecucao,
  limiteBytes = LIMITES_EXTRACAO.artefatoJsonBytes
): Promise<DownloadArtefato> {
  if (!artefato.tipo_mime.toLowerCase().startsWith('application/json')) {
    return {
      ok: false,
      motivo: 'mime_invalido',
      detalhes: { tipo_mime: artefato.tipo_mime },
    }
  }

  if (Number(artefato.tamanho_bytes) > limiteBytes) {
    return {
      ok: false,
      motivo: 'tamanho_excedido',
      detalhes: {
        tamanho_registrado: Number(artefato.tamanho_bytes),
        limite_bytes: limiteBytes,
      },
    }
  }

  const backend = createBackendClient()
  const { data: urlData, error: urlError } = await backend.storage
    .from('artefatos-processamento')
    .createSignedUrl(artefato.caminho_arquivo, 300)

  if (urlError || !urlData?.signedUrl) {
    throw new Error('Não foi possível gerar URL temporária do artefato intermediário.')
  }

  const resposta = await fetch(urlData.signedUrl, {
    cache: 'no-store',
    signal: AbortSignal.timeout(60_000),
  })

  if (!resposta.ok || !resposta.body) {
    throw new Error(`Falha ao baixar artefato intermediário (${resposta.status}).`)
  }

  const tamanhoCabecalho = Number(resposta.headers.get('content-length') ?? 0)
  if (Number.isFinite(tamanhoCabecalho) && tamanhoCabecalho > limiteBytes) {
    await resposta.body.cancel()
    return {
      ok: false,
      motivo: 'tamanho_excedido',
      detalhes: { tamanho_observado: tamanhoCabecalho, limite_bytes: limiteBytes },
    }
  }

  const hash = createHash('sha256')
  const leitor = resposta.body.getReader()
  const partes: Uint8Array[] = []
  let total = 0

  while (true) {
    const { done, value } = await leitor.read()
    if (done) break

    if (total + value.byteLength > limiteBytes) {
      total += value.byteLength
      await leitor.cancel()
      return {
        ok: false,
        motivo: 'tamanho_excedido',
        detalhes: { tamanho_observado: total, limite_bytes: limiteBytes },
      }
    }

    hash.update(value)
    partes.push(value)
    total += value.byteLength
  }

  const hashObservado = hash.digest('hex')
  const hashEsperado = artefato.hash_sha256.toLowerCase()
  const tamanhoEsperado = Number(artefato.tamanho_bytes)

  if (hashObservado !== hashEsperado || total !== tamanhoEsperado) {
    return {
      ok: false,
      motivo: 'integridade_divergente',
      detalhes: {
        hash_corresponde: hashObservado === hashEsperado,
        tamanho_corresponde: total === tamanhoEsperado,
        tamanho_observado: total,
        tamanho_esperado: tamanhoEsperado,
      },
    }
  }

  const dados = new Uint8Array(total)
  let offset = 0
  for (const parte of partes) {
    dados.set(parte, offset)
    offset += parte.byteLength
  }

  return { ok: true, dados }
}

async function concluirCriacaoHierarquia(
  execucaoId: string,
  documentoProcessadoId: string,
  reutilizado: boolean,
  quantidadeSecoes: number
) {
  const backend = createBackendClient()
  const { error } = await backend
    .schema('aplicacao')
    .rpc('backend_concluir_etapa', {
      p_execucao_id: execucaoId,
      p_nome_etapa: 'criar_hierarquia',
      p_percentual: 35,
      p_proximo_estado: 'segmentando',
      p_proxima_etapa: 'criar_fragmentos',
      p_detalhes: {
        documento_processado_id: documentoProcessadoId,
        reutilizado,
        quantidade_secoes: quantidadeSecoes,
      },
    })

  if (error) throw error
}

export async function criarHierarquiaStep(
  execucaoId: string
): Promise<ResultadoCriarHierarquiaStep> {
  'use step'

  const backend = createBackendClient()
  const { data: etapaData, error: etapaError } = await backend
    .schema('aplicacao')
    .rpc('backend_iniciar_etapa', {
      p_execucao_id: execucaoId,
      p_nome_etapa: 'criar_hierarquia',
      p_estado_execucao: 'segmentando',
      p_percentual: 31,
    })

  if (etapaError) throw etapaError

  const etapa = Array.isArray(etapaData) ? etapaData[0] : null
  const deveExecutar = etapa?.deve_executar !== false

  const contexto = await obterContexto(execucaoId)
  const artefatoExtraido = await obterArtefato(execucaoId, 'conteudo_extraido')
  const artefatoNormalizado = await obterArtefato(execucaoId, 'conteudo_normalizado')
  const artefatoEstrutura = await obterArtefato(execucaoId, 'estrutura_identificada')

  if (!artefatoExtraido || !artefatoNormalizado || !artefatoEstrutura) {
    await registrarFalhaDeterministica(
      execucaoId,
      'ARTEFATO_ESTRUTURA_AUSENTE',
      'A criação de hierarquia exige os artefatos extraído, normalizado e de estrutura da execução.'
    )
    return { ok: false, execucaoId, motivo: 'artefato_estrutura_ausente' }
  }

  const downloadEstrutura = await baixarArtefatoVerificado(artefatoEstrutura)
  if (!downloadEstrutura.ok) {
    await registrarFalhaDeterministica(
      execucaoId,
      'ARTEFATO_ESTRUTURA_INTEGRIDADE_DIVERGENTE',
      'O artefato de estrutura registrado não corresponde aos bytes armazenados.',
      downloadEstrutura.detalhes
    )
    return { ok: false, execucaoId, motivo: downloadEstrutura.motivo }
  }

  const validacaoEstrutura = validarArtefatoEstrutura({
    bytes: downloadEstrutura.dados,
    hashOriginalEsperado: contexto.hash_sha256,
    hashArtefatoExtraidoEsperado: artefatoExtraido.hash_sha256,
    hashArtefatoNormalizadoEsperado: artefatoNormalizado.hash_sha256,
  })

  if (!validacaoEstrutura.ok) {
    await registrarFalhaDeterministica(
      execucaoId,
      validacaoEstrutura.codigo,
      validacaoEstrutura.motivo,
      validacaoEstrutura.detalhes ?? {}
    )
    return { ok: false, execucaoId, motivo: validacaoEstrutura.codigo.toLowerCase() }
  }

  if (!deveExecutar) {
    // A etapa já está concluída; apenas relatar o documento já existente,
    // sem tentar recriar hierarquia nem reconcluir a etapa.
    return { ok: true, execucaoId, reutilizada: true }
  }

  const nos = construirHierarquiaDocumento({
    unidades: validacaoEstrutura.artefato.unidades,
    totalPaginas: validacaoEstrutura.artefato.total_paginas,
  })

  const { data: resultadoRpc, error: hierarquiaError } = await backend
    .schema('aplicacao')
    .rpc('backend_criar_hierarquia_documento', {
      p_execucao_id: execucaoId,
      p_secoes: nos,
    })

  if (hierarquiaError) throw hierarquiaError

  const resultado = Array.isArray(resultadoRpc) ? resultadoRpc[0] : null
  if (!resultado?.documento_processado_id) {
    throw new Error('O banco não retornou o identificador do Documento Processado.')
  }

  await concluirCriacaoHierarquia(
    execucaoId,
    resultado.documento_processado_id,
    resultado.criado === false,
    nos.length
  )

  return {
    ok: true,
    execucaoId,
    documentoProcessadoId: resultado.documento_processado_id,
    quantidadeSecoes: nos.length,
    reutilizada: resultado.criado === false,
  }
}
