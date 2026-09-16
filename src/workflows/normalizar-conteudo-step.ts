import { createHash } from 'node:crypto'
import { LIMITES_EXTRACAO } from '@/dominios/processamento/extrair-conteudo'
import { normalizarArtefatoExtraido } from '@/dominios/processamento/normalizar-conteudo'
import { createBackendClient } from '@/infraestrutura/supabase/backend'

export type ResultadoNormalizacaoStep = {
  ok: boolean
  execucaoId: string
  artefatoId?: string
  caminhoArtefato?: string
  hashArtefato?: string
  tamanhoArtefato?: number
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

async function obterArtefato(execucaoId: string, tipo: 'conteudo_extraido' | 'conteudo_normalizado') {
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
      p_nome_etapa: 'normalizar_conteudo',
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

async function concluirNormalizacao(
  execucaoId: string,
  artefato: ArtefatoExecucao,
  reutilizado: boolean
) {
  const backend = createBackendClient()
  const { error } = await backend
    .schema('aplicacao')
    .rpc('backend_concluir_etapa', {
      p_execucao_id: execucaoId,
      p_nome_etapa: 'normalizar_conteudo',
      p_percentual: 24,
      p_proximo_estado: 'estruturando',
      p_proxima_etapa: 'identificar_estrutura',
      p_detalhes: {
        artefato_id: artefato.artefato_id,
        caminho_artefato: artefato.caminho_arquivo,
        hash_artefato: artefato.hash_sha256,
        tamanho_artefato: Number(artefato.tamanho_bytes),
        reutilizado,
        unicode: 'NFC',
        quebras_linha: 'LF',
      },
    })

  if (error) throw error
}

export async function normalizarConteudoStep(
  execucaoId: string
): Promise<ResultadoNormalizacaoStep> {
  'use step'

  const backend = createBackendClient()
  const { data: etapaData, error: etapaError } = await backend
    .schema('aplicacao')
    .rpc('backend_iniciar_etapa', {
      p_execucao_id: execucaoId,
      p_nome_etapa: 'normalizar_conteudo',
      p_estado_execucao: 'normalizando',
      p_percentual: 19,
    })

  if (etapaError) throw etapaError

  const etapa = Array.isArray(etapaData) ? etapaData[0] : null
  const artefatoNormalizadoExistente = await obterArtefato(execucaoId, 'conteudo_normalizado')

  if (artefatoNormalizadoExistente) {
    const verificacao = await baixarArtefatoVerificado(artefatoNormalizadoExistente)
    if (!verificacao.ok) {
      await registrarFalhaDeterministica(
        execucaoId,
        'ARTEFATO_NORMALIZADO_INTEGRIDADE_DIVERGENTE',
        'O artefato normalizado registrado não corresponde aos bytes armazenados.',
        verificacao.detalhes
      )
      return { ok: false, execucaoId, motivo: verificacao.motivo }
    }

    if (etapa?.deve_executar !== false) {
      await concluirNormalizacao(execucaoId, artefatoNormalizadoExistente, true)
    }

    return {
      ok: true,
      execucaoId,
      artefatoId: artefatoNormalizadoExistente.artefato_id,
      caminhoArtefato: artefatoNormalizadoExistente.caminho_arquivo,
      hashArtefato: artefatoNormalizadoExistente.hash_sha256,
      tamanhoArtefato: Number(artefatoNormalizadoExistente.tamanho_bytes),
      reutilizada: true,
    }
  }

  if (etapa?.deve_executar === false) {
    throw new Error('Etapa de normalização concluída sem artefato normalizado registrado.')
  }

  const contexto = await obterContexto(execucaoId)
  const artefatoExtraido = await obterArtefato(execucaoId, 'conteudo_extraido')

  if (!artefatoExtraido) {
    await registrarFalhaDeterministica(
      execucaoId,
      'ARTEFATO_EXTRAIDO_AUSENTE',
      'A normalização exige o artefato de conteúdo extraído da execução.'
    )
    return { ok: false, execucaoId, motivo: 'artefato_extraido_ausente' }
  }

  const download = await baixarArtefatoVerificado(artefatoExtraido)
  if (!download.ok) {
    await registrarFalhaDeterministica(
      execucaoId,
      'ARTEFATO_EXTRAIDO_INTEGRIDADE_DIVERGENTE',
      'O artefato extraído registrado não corresponde aos bytes armazenados.',
      download.detalhes
    )
    return { ok: false, execucaoId, motivo: download.motivo }
  }

  const normalizacao = normalizarArtefatoExtraido({
    bytes: download.dados,
    hashArtefatoExtraido: artefatoExtraido.hash_sha256,
    hashOriginalEsperado: contexto.hash_sha256,
  })

  if (!normalizacao.ok) {
    await registrarFalhaDeterministica(
      execucaoId,
      normalizacao.codigo,
      normalizacao.motivo,
      normalizacao.detalhes ?? {}
    )
    return { ok: false, execucaoId, motivo: normalizacao.codigo.toLowerCase() }
  }

  const bytesNormalizados = new TextEncoder().encode(JSON.stringify(normalizacao.artefato))
  if (bytesNormalizados.byteLength > LIMITES_EXTRACAO.artefatoJsonBytes) {
    await registrarFalhaDeterministica(
      execucaoId,
      'ARTEFATO_NORMALIZADO_EXCEDE_LIMITE',
      'O artefato normalizado excede o limite operacional desta versão do Pipeline.',
      {
        tamanho_bytes: bytesNormalizados.byteLength,
        limite_bytes: LIMITES_EXTRACAO.artefatoJsonBytes,
      }
    )
    return { ok: false, execucaoId, motivo: 'artefato_normalizado_excede_limite' }
  }

  const hashNormalizado = createHash('sha256').update(bytesNormalizados).digest('hex')
  const caminhoNormalizado = `${contexto.usuario_id}/${execucaoId}/conteudo_normalizado.json`
  const tipoMime = 'application/json; charset=utf-8'

  const { error: uploadError } = await backend.storage
    .from('artefatos-processamento')
    .upload(caminhoNormalizado, bytesNormalizados, {
      contentType: tipoMime,
      cacheControl: '0',
      upsert: true,
    })

  if (uploadError) throw uploadError

  const { data: artefatoIdData, error: artefatoError } = await backend
    .schema('aplicacao')
    .rpc('backend_registrar_artefato_execucao', {
      p_execucao_id: execucaoId,
      p_tipo: 'conteudo_normalizado',
      p_caminho_arquivo: caminhoNormalizado,
      p_tipo_mime: tipoMime,
      p_tamanho_bytes: bytesNormalizados.byteLength,
      p_hash_sha256: hashNormalizado,
      p_metadados: {
        schema_version: normalizacao.artefato.schema_version,
        formato: normalizacao.artefato.formato,
        metodo: normalizacao.artefato.metodo,
        unicode: normalizacao.artefato.normalizacao.unicode,
        quebras_linha: normalizacao.artefato.normalizacao.quebras_linha,
        hash_artefato_extraido: artefatoExtraido.hash_sha256,
        alteracoes: normalizacao.artefato.normalizacao.alteracoes,
      },
    })

  if (artefatoError) throw artefatoError
  if (typeof artefatoIdData !== 'string') {
    throw new Error('O banco não retornou o identificador do artefato normalizado.')
  }

  const artefatoNormalizado: ArtefatoExecucao = {
    artefato_id: artefatoIdData,
    usuario_id: contexto.usuario_id,
    execucao_id: execucaoId,
    tipo: 'conteudo_normalizado',
    caminho_arquivo: caminhoNormalizado,
    tipo_mime: tipoMime,
    tamanho_bytes: bytesNormalizados.byteLength,
    hash_sha256: hashNormalizado,
    metadados: normalizacao.artefato.normalizacao,
    criado_em: new Date().toISOString(),
  }

  await concluirNormalizacao(execucaoId, artefatoNormalizado, false)

  return {
    ok: true,
    execucaoId,
    artefatoId: artefatoIdData,
    caminhoArtefato: caminhoNormalizado,
    hashArtefato: hashNormalizado,
    tamanhoArtefato: bytesNormalizados.byteLength,
    reutilizada: false,
  }
}
