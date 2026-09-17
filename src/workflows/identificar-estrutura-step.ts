import { createHash } from 'node:crypto'
import { LIMITES_EXTRACAO } from '@/dominios/processamento/extrair-conteudo'
import {
  identificarEstruturaArtefatoNormalizado,
  validarArtefatoEstrutura,
} from '@/dominios/processamento/identificar-estrutura'
import { createBackendClient } from '@/infraestrutura/supabase/backend'

export type ResultadoIdentificacaoEstruturaStep = {
  ok: boolean
  execucaoId: string
  artefatoId?: string
  caminhoArtefato?: string
  hashArtefato?: string
  tamanhoArtefato?: number
  possuiIndiciosEstruturais?: boolean
  quantidadeUnidades?: number
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
      p_nome_etapa: 'identificar_estrutura',
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

async function concluirIdentificacaoEstrutura(
  execucaoId: string,
  artefato: ArtefatoExecucao,
  reutilizado: boolean,
  possuiIndiciosEstruturais: boolean,
  quantidadeUnidades: number
) {
  const backend = createBackendClient()
  const { error } = await backend
    .schema('aplicacao')
    .rpc('backend_concluir_etapa', {
      p_execucao_id: execucaoId,
      p_nome_etapa: 'identificar_estrutura',
      p_percentual: 30,
      p_proximo_estado: 'segmentando',
      p_proxima_etapa: 'criar_hierarquia',
      p_detalhes: {
        artefato_id: artefato.artefato_id,
        caminho_artefato: artefato.caminho_arquivo,
        hash_artefato: artefato.hash_sha256,
        tamanho_artefato: Number(artefato.tamanho_bytes),
        reutilizado,
        possui_indicios_estruturais: possuiIndiciosEstruturais,
        quantidade_unidades: quantidadeUnidades,
      },
    })

  if (error) throw error
}

export async function identificarEstruturaStep(
  execucaoId: string
): Promise<ResultadoIdentificacaoEstruturaStep> {
  'use step'

  const backend = createBackendClient()
  const { data: etapaData, error: etapaError } = await backend
    .schema('aplicacao')
    .rpc('backend_iniciar_etapa', {
      p_execucao_id: execucaoId,
      p_nome_etapa: 'identificar_estrutura',
      p_estado_execucao: 'estruturando',
      p_percentual: 25,
    })

  if (etapaError) throw etapaError

  const etapa = Array.isArray(etapaData) ? etapaData[0] : null
  const deveExecutar = etapa?.deve_executar !== false
  const artefatoEstruturaExistente = await obterArtefato(execucaoId, 'estrutura_identificada')

  if (!artefatoEstruturaExistente && !deveExecutar) {
    throw new Error('Etapa de identificação de estrutura concluída sem artefato registrado.')
  }

  const contexto = await obterContexto(execucaoId)
  const artefatoExtraido = await obterArtefato(execucaoId, 'conteudo_extraido')
  const artefatoNormalizado = await obterArtefato(execucaoId, 'conteudo_normalizado')

  if (!artefatoExtraido || !artefatoNormalizado) {
    await registrarFalhaDeterministica(
      execucaoId,
      'ARTEFATO_NORMALIZADO_AUSENTE',
      'A identificação de estrutura exige os artefatos extraído e normalizado da execução.'
    )
    return { ok: false, execucaoId, motivo: 'artefato_normalizado_ausente' }
  }

  if (artefatoEstruturaExistente) {
    const downloadEstrutura = await baixarArtefatoVerificado(artefatoEstruturaExistente)

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

    if (deveExecutar) {
      await concluirIdentificacaoEstrutura(
        execucaoId,
        artefatoEstruturaExistente,
        true,
        validacaoEstrutura.artefato.possui_indicios_estruturais,
        validacaoEstrutura.artefato.unidades.length
      )
    }

    return {
      ok: true,
      execucaoId,
      artefatoId: artefatoEstruturaExistente.artefato_id,
      caminhoArtefato: artefatoEstruturaExistente.caminho_arquivo,
      hashArtefato: artefatoEstruturaExistente.hash_sha256,
      tamanhoArtefato: Number(artefatoEstruturaExistente.tamanho_bytes),
      possuiIndiciosEstruturais: validacaoEstrutura.artefato.possui_indicios_estruturais,
      quantidadeUnidades: validacaoEstrutura.artefato.unidades.length,
      reutilizada: true,
    }
  }

  const downloadNormalizado = await baixarArtefatoVerificado(artefatoNormalizado)
  if (!downloadNormalizado.ok) {
    await registrarFalhaDeterministica(
      execucaoId,
      'ARTEFATO_NORMALIZADO_INTEGRIDADE_DIVERGENTE',
      'O artefato normalizado registrado não corresponde aos bytes armazenados.',
      downloadNormalizado.detalhes
    )
    return { ok: false, execucaoId, motivo: downloadNormalizado.motivo }
  }

  const identificacao = identificarEstruturaArtefatoNormalizado({
    bytes: downloadNormalizado.dados,
    hashArtefatoNormalizado: artefatoNormalizado.hash_sha256,
    hashOriginalEsperado: contexto.hash_sha256,
    hashArtefatoExtraidoEsperado: artefatoExtraido.hash_sha256,
  })

  if (!identificacao.ok) {
    await registrarFalhaDeterministica(
      execucaoId,
      identificacao.codigo,
      identificacao.motivo,
      identificacao.detalhes ?? {}
    )
    return { ok: false, execucaoId, motivo: identificacao.codigo.toLowerCase() }
  }

  const bytesEstrutura = new TextEncoder().encode(JSON.stringify(identificacao.artefato))

  if (bytesEstrutura.byteLength > LIMITES_EXTRACAO.artefatoJsonBytes) {
    await registrarFalhaDeterministica(
      execucaoId,
      'ARTEFATO_ESTRUTURA_EXCEDE_LIMITE',
      'O artefato de estrutura excede o limite operacional desta versão do Pipeline.',
      {
        tamanho_bytes: bytesEstrutura.byteLength,
        limite_bytes: LIMITES_EXTRACAO.artefatoJsonBytes,
      }
    )
    return { ok: false, execucaoId, motivo: 'artefato_estrutura_excede_limite' }
  }

  const hashEstrutura = createHash('sha256').update(bytesEstrutura).digest('hex')
  const caminhoEstrutura = `${contexto.usuario_id}/${execucaoId}/estrutura_identificada.json`
  const tipoMime = 'application/json; charset=utf-8'

  const { error: uploadError } = await backend.storage
    .from('artefatos-processamento')
    .upload(caminhoEstrutura, bytesEstrutura, {
      contentType: tipoMime,
      cacheControl: '0',
      upsert: true,
    })

  if (uploadError) throw uploadError

  const { data: artefatoIdData, error: artefatoError } = await backend
    .schema('aplicacao')
    .rpc('backend_registrar_artefato_execucao', {
      p_execucao_id: execucaoId,
      p_tipo: 'estrutura_identificada',
      p_caminho_arquivo: caminhoEstrutura,
      p_tipo_mime: tipoMime,
      p_tamanho_bytes: bytesEstrutura.byteLength,
      p_hash_sha256: hashEstrutura,
      p_metadados: {
        schema_version: identificacao.artefato.schema_version,
        formato: identificacao.artefato.formato,
        metodo: identificacao.artefato.metodo,
        possui_indicios_estruturais: identificacao.artefato.possui_indicios_estruturais,
        quantidade_unidades: identificacao.artefato.unidades.length,
        estatisticas: identificacao.artefato.estatisticas,
        hash_artefato_normalizado: artefatoNormalizado.hash_sha256,
      },
    })

  if (artefatoError) throw artefatoError
  if (typeof artefatoIdData !== 'string') {
    throw new Error('O banco não retornou o identificador do artefato de estrutura.')
  }

  const artefatoEstrutura: ArtefatoExecucao = {
    artefato_id: artefatoIdData,
    usuario_id: contexto.usuario_id,
    execucao_id: execucaoId,
    tipo: 'estrutura_identificada',
    caminho_arquivo: caminhoEstrutura,
    tipo_mime: tipoMime,
    tamanho_bytes: bytesEstrutura.byteLength,
    hash_sha256: hashEstrutura,
    metadados: null,
    criado_em: new Date().toISOString(),
  }

  await concluirIdentificacaoEstrutura(
    execucaoId,
    artefatoEstrutura,
    false,
    identificacao.artefato.possui_indicios_estruturais,
    identificacao.artefato.unidades.length
  )

  return {
    ok: true,
    execucaoId,
    artefatoId: artefatoIdData,
    caminhoArtefato: caminhoEstrutura,
    hashArtefato: hashEstrutura,
    tamanhoArtefato: bytesEstrutura.byteLength,
    possuiIndiciosEstruturais: identificacao.artefato.possui_indicios_estruturais,
    quantidadeUnidades: identificacao.artefato.unidades.length,
    reutilizada: false,
  }
}
