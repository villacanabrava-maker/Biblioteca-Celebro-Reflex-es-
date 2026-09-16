import { createHash } from 'node:crypto'
import {
  LIMITES_EXTRACAO,
  extrairTextoPdf,
  extrairTextoUtf8,
  type FormatoConteudoExtraivel,
} from '@/dominios/processamento/extrair-conteudo'
import { identificarFormatoDocumento } from '@/dominios/processamento/identificar-formato'
import {
  normalizarConteudoStep,
  type ResultadoNormalizacaoStep,
} from '@/workflows/normalizar-conteudo-step'
import { createBackendClient } from '@/infraestrutura/supabase/backend'

type ContextoExecucao = {
  execucao_id: string
  usuario_id: string
  versao_obra_id: string
  obra_id: string
  estado: string
  etapa_atual: string | null
  versao_pipeline_id: string
  versao_taxonomia_id: string
  caminho_arquivo: string
  hash_sha256: string
  tamanho_bytes: number
  tipo_mime: string
  nome_arquivo: string
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

type ResultadoValidacao = {
  ok: boolean
  execucaoId: string
  hashVerificado?: string
  tamanhoVerificado?: number
  motivo?: string
  reutilizada?: boolean
}

type ResultadoFormato = {
  ok: boolean
  execucaoId: string
  formato?: FormatoConteudoExtraivel
  extensao?: string
  motivo?: string
}

type ResultadoExtracao = {
  ok: boolean
  execucaoId: string
  formato?: FormatoConteudoExtraivel
  artefatoId?: string
  caminhoArtefato?: string
  hashArtefato?: string
  tamanhoArtefato?: number
  quantidadeCaracteres?: number
  quantidadePaginas?: number | null
  motivo?: string
  reutilizada?: boolean
}

type ResultadoProcessamentoInicial = {
  ok: boolean
  execucaoId: string
  validacao: ResultadoValidacao
  identificacaoFormato?: ResultadoFormato
  extracao?: ResultadoExtracao
  normalizacao?: ResultadoNormalizacaoStep
}

export async function processarObraWorkflow(
  execucaoId: string
): Promise<ResultadoProcessamentoInicial> {
  'use workflow'

  let validacao: ResultadoValidacao

  try {
    validacao = await validarOriginal(execucaoId)
  } catch (error) {
    const tipoErro = error instanceof Error ? error.name : 'erro_desconhecido'
    await registrarFalhaFinalEtapa(
      execucaoId,
      'validar_arquivo',
      'VALIDACAO_ORIGINAL_ESGOTOU_RETRIES',
      'A validação do arquivo original falhou após as tentativas automáticas do workflow.',
      tipoErro
    )
    throw error
  }

  if (!validacao.ok) {
    return { ok: false, execucaoId, validacao }
  }

  let identificacaoFormato: ResultadoFormato

  try {
    identificacaoFormato = await identificarFormato(execucaoId)
  } catch (error) {
    const tipoErro = error instanceof Error ? error.name : 'erro_desconhecido'
    await registrarFalhaFinalEtapa(
      execucaoId,
      'identificar_formato',
      'IDENTIFICACAO_FORMATO_ESGOTOU_RETRIES',
      'A identificação do formato falhou após as tentativas automáticas do workflow.',
      tipoErro
    )
    throw error
  }

  if (!identificacaoFormato.ok || !identificacaoFormato.formato) {
    return {
      ok: false,
      execucaoId,
      validacao,
      identificacaoFormato,
    }
  }

  let extracao: ResultadoExtracao

  try {
    extracao = await extrairConteudo(execucaoId, identificacaoFormato.formato)
  } catch (error) {
    const tipoErro = error instanceof Error ? error.name : 'erro_desconhecido'
    await registrarFalhaFinalEtapa(
      execucaoId,
      'extrair_conteudo',
      'EXTRACAO_CONTEUDO_ESGOTOU_RETRIES',
      'A extração do conteúdo falhou após as tentativas automáticas do workflow.',
      tipoErro
    )
    throw error
  }

  if (!extracao.ok) {
    return {
      ok: false,
      execucaoId,
      validacao,
      identificacaoFormato,
      extracao,
    }
  }

  let normalizacao: ResultadoNormalizacaoStep

  try {
    normalizacao = await normalizarConteudoStep(execucaoId)
  } catch (error) {
    const tipoErro = error instanceof Error ? error.name : 'erro_desconhecido'
    await registrarFalhaFinalEtapa(
      execucaoId,
      'normalizar_conteudo',
      'NORMALIZACAO_CONTEUDO_ESGOTOU_RETRIES',
      'A normalização do conteúdo falhou após as tentativas automáticas do workflow.',
      tipoErro
    )
    throw error
  }

  return {
    ok: normalizacao.ok,
    execucaoId,
    validacao,
    identificacaoFormato,
    extracao,
    normalizacao,
  }
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

  if (!contexto) {
    throw new Error('Execução de processamento não encontrada.')
  }

  return { backend, contexto }
}

async function criarUrlOriginal(contexto: ContextoExecucao) {
  const backend = createBackendClient()
  const { data, error } = await backend.storage
    .from('originais-biblioteca')
    .createSignedUrl(contexto.caminho_arquivo, 300)

  if (error || !data?.signedUrl) {
    throw new Error('Não foi possível gerar URL temporária do original.')
  }

  return data.signedUrl
}

async function obterArtefatoExtraido(execucaoId: string) {
  const backend = createBackendClient()
  const { data, error } = await backend
    .schema('aplicacao')
    .rpc('backend_obter_artefato_execucao', {
      p_execucao_id: execucaoId,
      p_tipo: 'conteudo_extraido',
    })

  if (error) throw error

  return (Array.isArray(data) ? data[0] : null) as ArtefatoExecucao | null
}

async function concluirExtracaoComArtefato(
  execucaoId: string,
  artefato: ArtefatoExecucao,
  reutilizado: boolean
) {
  const backend = createBackendClient()
  const { error } = await backend
    .schema('aplicacao')
    .rpc('backend_concluir_etapa', {
      p_execucao_id: execucaoId,
      p_nome_etapa: 'extrair_conteudo',
      p_percentual: 18,
      p_proximo_estado: 'normalizando',
      p_proxima_etapa: 'normalizar_conteudo',
      p_detalhes: {
        artefato_id: artefato.artefato_id,
        caminho_artefato: artefato.caminho_arquivo,
        hash_artefato: artefato.hash_sha256,
        tamanho_artefato: Number(artefato.tamanho_bytes),
        reutilizado,
      },
    })

  if (error) throw error
}

async function registrarFalhaDeterministica(
  execucaoId: string,
  nomeEtapa: string,
  codigoErro: string,
  mensagemErro: string,
  detalhes: Record<string, unknown> = {}
) {
  const backend = createBackendClient()
  const { error } = await backend
    .schema('aplicacao')
    .rpc('backend_falhar_execucao', {
      p_execucao_id: execucaoId,
      p_nome_etapa: nomeEtapa,
      p_codigo_erro: codigoErro,
      p_mensagem_erro: mensagemErro,
      p_detalhes: detalhes,
    })

  if (error) throw error
}

async function validarOriginal(execucaoId: string): Promise<ResultadoValidacao> {
  'use step'

  const backend = createBackendClient()

  const { data: etapaData, error: etapaError } = await backend
    .schema('aplicacao')
    .rpc('backend_iniciar_etapa', {
      p_execucao_id: execucaoId,
      p_nome_etapa: 'validar_arquivo',
      p_estado_execucao: 'validando',
      p_percentual: 1,
    })

  if (etapaError) throw etapaError

  const etapa = Array.isArray(etapaData) ? etapaData[0] : null
  if (etapa?.deve_executar === false) {
    return { ok: true, execucaoId, reutilizada: true }
  }

  const { contexto } = await obterContexto(execucaoId)
  const signedUrl = await criarUrlOriginal(contexto)

  const resposta = await fetch(signedUrl, {
    cache: 'no-store',
    signal: AbortSignal.timeout(120_000),
  })

  if (!resposta.ok || !resposta.body) {
    throw new Error(`Falha ao ler original privado (${resposta.status}).`)
  }

  const hash = createHash('sha256')
  const leitor = resposta.body.getReader()
  let tamanhoVerificado = 0

  while (true) {
    const { done, value } = await leitor.read()
    if (done) break
    hash.update(value)
    tamanhoVerificado += value.byteLength
  }

  const hashVerificado = hash.digest('hex')
  const hashEsperado = contexto.hash_sha256.toLowerCase()

  if (
    hashVerificado !== hashEsperado ||
    tamanhoVerificado !== Number(contexto.tamanho_bytes)
  ) {
    await registrarFalhaDeterministica(
      execucaoId,
      'validar_arquivo',
      'ORIGINAL_INTEGRIDADE_DIVERGENTE',
      'O arquivo armazenado não corresponde ao hash ou tamanho registrado.',
      {
        hash_corresponde: hashVerificado === hashEsperado,
        tamanho_corresponde: tamanhoVerificado === Number(contexto.tamanho_bytes),
      }
    )

    return {
      ok: false,
      execucaoId,
      motivo: 'integridade_divergente',
      hashVerificado,
      tamanhoVerificado,
    }
  }

  const { error: concluirError } = await backend
    .schema('aplicacao')
    .rpc('backend_concluir_etapa', {
      p_execucao_id: execucaoId,
      p_nome_etapa: 'validar_arquivo',
      p_percentual: 5,
      p_proximo_estado: 'validando',
      p_proxima_etapa: 'identificar_formato',
      p_detalhes: {
        hash_verificado: true,
        tamanho_verificado: tamanhoVerificado,
        tipo_mime_registrado: contexto.tipo_mime,
      },
    })

  if (concluirError) throw concluirError

  return {
    ok: true,
    execucaoId,
    hashVerificado,
    tamanhoVerificado,
  }
}

async function baixarAmostraOriginal(
  signedUrl: string,
  limiteBytes = 64 * 1024
): Promise<Uint8Array> {
  const resposta = await fetch(signedUrl, {
    cache: 'no-store',
    headers: { Range: `bytes=0-${limiteBytes - 1}` },
    signal: AbortSignal.timeout(30_000),
  })

  if (!resposta.ok || !resposta.body) {
    throw new Error(`Falha ao ler amostra do original privado (${resposta.status}).`)
  }

  const leitor = resposta.body.getReader()
  const partes: Uint8Array[] = []
  let total = 0

  while (total < limiteBytes) {
    const { done, value } = await leitor.read()
    if (done) break

    const restante = limiteBytes - total
    const parte = value.byteLength > restante ? value.slice(0, restante) : value
    partes.push(parte)
    total += parte.byteLength

    if (total >= limiteBytes) {
      await leitor.cancel()
      break
    }
  }

  const amostra = new Uint8Array(total)
  let offset = 0
  for (const parte of partes) {
    amostra.set(parte, offset)
    offset += parte.byteLength
  }

  return amostra
}

async function identificarFormato(execucaoId: string): Promise<ResultadoFormato> {
  'use step'

  const backend = createBackendClient()
  const { data: etapaData, error: etapaError } = await backend
    .schema('aplicacao')
    .rpc('backend_iniciar_etapa', {
      p_execucao_id: execucaoId,
      p_nome_etapa: 'identificar_formato',
      p_estado_execucao: 'validando',
      p_percentual: 6,
    })

  if (etapaError) throw etapaError

  const etapa = Array.isArray(etapaData) ? etapaData[0] : null
  const devePersistir = etapa?.deve_executar !== false

  const { contexto } = await obterContexto(execucaoId)
  const signedUrl = await criarUrlOriginal(contexto)
  const amostra = await baixarAmostraOriginal(signedUrl)
  const identificacao = identificarFormatoDocumento({
    nomeArquivo: contexto.nome_arquivo,
    mimeRegistrado: contexto.tipo_mime,
    amostra,
  })

  if (!identificacao.suportado) {
    if (devePersistir) {
      const codigo =
        identificacao.motivo === 'extensao_nao_suportada' ||
        identificacao.motivo === 'docx_ainda_nao_suportado'
          ? 'FORMATO_NAO_SUPORTADO'
          : 'FORMATO_INCONSISTENTE'

      await registrarFalhaDeterministica(
        execucaoId,
        'identificar_formato',
        codigo,
        'O formato do arquivo não é suportado ou não corresponde à extensão/MIME registrados.',
        {
          motivo: identificacao.motivo,
          extensao: identificacao.extensao,
          mime_registrado: identificacao.mimeRegistrado,
          bytes_amostrados: amostra.byteLength,
        }
      )
    }

    return {
      ok: false,
      execucaoId,
      motivo: identificacao.motivo,
      extensao: identificacao.extensao ?? undefined,
    }
  }

  if (devePersistir) {
    const { error: concluirError } = await backend
      .schema('aplicacao')
      .rpc('backend_concluir_etapa', {
        p_execucao_id: execucaoId,
        p_nome_etapa: 'identificar_formato',
        p_percentual: 8,
        p_proximo_estado: 'extraindo',
        p_proxima_etapa: 'extrair_conteudo',
        p_detalhes: {
          formato: identificacao.formato,
          extensao: identificacao.extensao,
          mime_registrado: identificacao.mimeRegistrado,
          assinatura: identificacao.assinatura,
          bytes_amostrados: amostra.byteLength,
        },
      })

    if (concluirError) throw concluirError
  }

  return {
    ok: true,
    execucaoId,
    formato: identificacao.formato,
    extensao: identificacao.extensao,
  }
}

async function baixarOriginalComLimite(
  signedUrl: string,
  limiteBytes: number
): Promise<{ dados: Uint8Array | null; tamanhoObservado: number }> {
  const resposta = await fetch(signedUrl, {
    cache: 'no-store',
    signal: AbortSignal.timeout(120_000),
  })

  if (!resposta.ok || !resposta.body) {
    throw new Error(`Falha ao baixar original para extração (${resposta.status}).`)
  }

  const tamanhoCabecalho = Number(resposta.headers.get('content-length') ?? 0)
  if (Number.isFinite(tamanhoCabecalho) && tamanhoCabecalho > limiteBytes) {
    await resposta.body.cancel()
    return { dados: null, tamanhoObservado: tamanhoCabecalho }
  }

  const leitor = resposta.body.getReader()
  const partes: Uint8Array[] = []
  let total = 0

  while (true) {
    const { done, value } = await leitor.read()
    if (done) break

    if (total + value.byteLength > limiteBytes) {
      total += value.byteLength
      await leitor.cancel()
      return { dados: null, tamanhoObservado: total }
    }

    partes.push(value)
    total += value.byteLength
  }

  const dados = new Uint8Array(total)
  let offset = 0
  for (const parte of partes) {
    dados.set(parte, offset)
    offset += parte.byteLength
  }

  return { dados, tamanhoObservado: total }
}

async function extrairConteudo(
  execucaoId: string,
  formato: FormatoConteudoExtraivel
): Promise<ResultadoExtracao> {
  'use step'

  const backend = createBackendClient()
  const { data: etapaData, error: etapaError } = await backend
    .schema('aplicacao')
    .rpc('backend_iniciar_etapa', {
      p_execucao_id: execucaoId,
      p_nome_etapa: 'extrair_conteudo',
      p_estado_execucao: 'extraindo',
      p_percentual: 9,
    })

  if (etapaError) throw etapaError

  const etapa = Array.isArray(etapaData) ? etapaData[0] : null
  const artefatoExistente = await obterArtefatoExtraido(execucaoId)

  if (artefatoExistente) {
    if (etapa?.deve_executar !== false) {
      await concluirExtracaoComArtefato(execucaoId, artefatoExistente, true)
    }

    return {
      ok: true,
      execucaoId,
      formato,
      artefatoId: artefatoExistente.artefato_id,
      caminhoArtefato: artefatoExistente.caminho_arquivo,
      hashArtefato: artefatoExistente.hash_sha256,
      tamanhoArtefato: Number(artefatoExistente.tamanho_bytes),
      reutilizada: true,
    }
  }

  if (etapa?.deve_executar === false) {
    throw new Error('Etapa de extração concluída sem artefato intermediário registrado.')
  }

  const { contexto } = await obterContexto(execucaoId)
  const limiteOriginal =
    formato === 'pdf'
      ? LIMITES_EXTRACAO.originalPdfBytes
      : LIMITES_EXTRACAO.originalTextoBytes

  if (Number(contexto.tamanho_bytes) > limiteOriginal) {
    await registrarFalhaDeterministica(
      execucaoId,
      'extrair_conteudo',
      'ORIGINAL_EXCEDE_LIMITE_EXTRACAO',
      'O arquivo excede o limite operacional desta versão do extrator.',
      {
        formato,
        tamanho_bytes: Number(contexto.tamanho_bytes),
        limite_bytes: limiteOriginal,
      }
    )

    return {
      ok: false,
      execucaoId,
      formato,
      motivo: 'original_excede_limite_extracao',
    }
  }

  const signedUrl = await criarUrlOriginal(contexto)
  const download = await baixarOriginalComLimite(signedUrl, limiteOriginal)

  if (!download.dados) {
    await registrarFalhaDeterministica(
      execucaoId,
      'extrair_conteudo',
      'ORIGINAL_EXCEDE_LIMITE_EXTRACAO',
      'O arquivo excede o limite operacional desta versão do extrator.',
      {
        formato,
        tamanho_observado: download.tamanhoObservado,
        limite_bytes: limiteOriginal,
      }
    )

    return {
      ok: false,
      execucaoId,
      formato,
      motivo: 'original_excede_limite_extracao',
    }
  }

  const hashOriginalAtual = createHash('sha256').update(download.dados).digest('hex')
  if (
    hashOriginalAtual !== contexto.hash_sha256.toLowerCase() ||
    download.dados.byteLength !== Number(contexto.tamanho_bytes)
  ) {
    await registrarFalhaDeterministica(
      execucaoId,
      'extrair_conteudo',
      'ORIGINAL_ALTERADO_APOS_VALIDACAO',
      'O original mudou entre a validação de integridade e a extração.',
      {
        hash_corresponde: hashOriginalAtual === contexto.hash_sha256.toLowerCase(),
        tamanho_corresponde:
          download.dados.byteLength === Number(contexto.tamanho_bytes),
      }
    )

    return {
      ok: false,
      execucaoId,
      formato,
      motivo: 'original_alterado_apos_validacao',
    }
  }

  const resultado =
    formato === 'pdf'
      ? await extrairTextoPdf({
          dados: download.dados,
          nomeArquivo: contexto.nome_arquivo,
          tipoMimeRegistrado: contexto.tipo_mime,
          hashSha256Original: contexto.hash_sha256.toLowerCase(),
        })
      : extrairTextoUtf8({
          dados: download.dados,
          formato,
          nomeArquivo: contexto.nome_arquivo,
          tipoMimeRegistrado: contexto.tipo_mime,
          hashSha256Original: contexto.hash_sha256.toLowerCase(),
        })

  if (!resultado.ok) {
    await registrarFalhaDeterministica(
      execucaoId,
      'extrair_conteudo',
      resultado.codigo,
      resultado.motivo,
      {
        formato,
        ...(resultado.detalhes ?? {}),
      }
    )

    return {
      ok: false,
      execucaoId,
      formato,
      motivo: resultado.codigo.toLowerCase(),
    }
  }

  const jsonArtefato = JSON.stringify(resultado.artefato)
  const bytesArtefato = new TextEncoder().encode(jsonArtefato)

  if (bytesArtefato.byteLength > LIMITES_EXTRACAO.artefatoJsonBytes) {
    await registrarFalhaDeterministica(
      execucaoId,
      'extrair_conteudo',
      'ARTEFATO_EXTRAIDO_EXCEDE_LIMITE',
      'O artefato extraído excede o limite operacional desta versão do Pipeline.',
      {
        tamanho_bytes: bytesArtefato.byteLength,
        limite_bytes: LIMITES_EXTRACAO.artefatoJsonBytes,
      }
    )

    return {
      ok: false,
      execucaoId,
      formato,
      motivo: 'artefato_extraido_excede_limite',
    }
  }

  const hashArtefato = createHash('sha256').update(bytesArtefato).digest('hex')
  const caminhoArtefato = `${contexto.usuario_id}/${execucaoId}/conteudo_extraido.json`
  const tipoMimeArtefato = 'application/json; charset=utf-8'

  const { error: uploadError } = await backend.storage
    .from('artefatos-processamento')
    .upload(caminhoArtefato, bytesArtefato, {
      contentType: tipoMimeArtefato,
      cacheControl: '0',
      upsert: true,
    })

  if (uploadError) throw uploadError

  const { data: artefatoIdData, error: artefatoError } = await backend
    .schema('aplicacao')
    .rpc('backend_registrar_artefato_execucao', {
      p_execucao_id: execucaoId,
      p_tipo: 'conteudo_extraido',
      p_caminho_arquivo: caminhoArtefato,
      p_tipo_mime: tipoMimeArtefato,
      p_tamanho_bytes: bytesArtefato.byteLength,
      p_hash_sha256: hashArtefato,
      p_metadados: {
        schema_version: resultado.artefato.schema_version,
        formato,
        metodo: resultado.artefato.metodo,
        quantidade_caracteres: resultado.quantidadeCaracteres,
        quantidade_paginas: resultado.quantidadePaginas,
        paginas_com_texto: resultado.paginasComTexto,
      },
    })

  if (artefatoError) throw artefatoError
  if (typeof artefatoIdData !== 'string') {
    throw new Error('O banco não retornou o identificador do artefato extraído.')
  }

  const artefato: ArtefatoExecucao = {
    artefato_id: artefatoIdData,
    usuario_id: contexto.usuario_id,
    execucao_id: execucaoId,
    tipo: 'conteudo_extraido',
    caminho_arquivo: caminhoArtefato,
    tipo_mime: tipoMimeArtefato,
    tamanho_bytes: bytesArtefato.byteLength,
    hash_sha256: hashArtefato,
    metadados: {
      formato,
      metodo: resultado.artefato.metodo,
    },
    criado_em: new Date().toISOString(),
  }

  await concluirExtracaoComArtefato(execucaoId, artefato, false)

  return {
    ok: true,
    execucaoId,
    formato,
    artefatoId: artefato.artefato_id,
    caminhoArtefato,
    hashArtefato,
    tamanhoArtefato: bytesArtefato.byteLength,
    quantidadeCaracteres: resultado.quantidadeCaracteres,
    quantidadePaginas: resultado.quantidadePaginas,
    reutilizada: false,
  }
}

async function registrarFalhaFinalEtapa(
  execucaoId: string,
  nomeEtapa: string,
  codigoErro: string,
  mensagemErro: string,
  tipoErro: string
) {
  'use step'

  const backend = createBackendClient()
  const { error: falhaError } = await backend
    .schema('aplicacao')
    .rpc('backend_falhar_execucao', {
      p_execucao_id: execucaoId,
      p_nome_etapa: nomeEtapa,
      p_codigo_erro: codigoErro,
      p_mensagem_erro: mensagemErro,
      p_detalhes: { tipo_erro: tipoErro },
    })

  if (falhaError) throw falhaError
}
