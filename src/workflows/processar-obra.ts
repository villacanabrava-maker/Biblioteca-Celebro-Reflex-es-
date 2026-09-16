import { createHash } from 'node:crypto'
import { identificarFormatoDocumento } from '@/dominios/processamento/identificar-formato'
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
  formato?: 'pdf' | 'texto' | 'markdown'
  extensao?: string
  motivo?: string
}

type ResultadoProcessamentoInicial = {
  ok: boolean
  execucaoId: string
  validacao: ResultadoValidacao
  identificacaoFormato?: ResultadoFormato
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

  return {
    ok: identificacaoFormato.ok,
    execucaoId,
    validacao,
    identificacaoFormato,
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
    const { error: falhaError } = await backend
      .schema('aplicacao')
      .rpc('backend_falhar_execucao', {
        p_execucao_id: execucaoId,
        p_nome_etapa: 'validar_arquivo',
        p_codigo_erro: 'ORIGINAL_INTEGRIDADE_DIVERGENTE',
        p_mensagem_erro:
          'O arquivo armazenado não corresponde ao hash ou tamanho registrado.',
        p_detalhes: {
          hash_corresponde: hashVerificado === hashEsperado,
          tamanho_corresponde:
            tamanhoVerificado === Number(contexto.tamanho_bytes),
        },
      })

    if (falhaError) throw falhaError

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

      const { error: falhaError } = await backend
        .schema('aplicacao')
        .rpc('backend_falhar_execucao', {
          p_execucao_id: execucaoId,
          p_nome_etapa: 'identificar_formato',
          p_codigo_erro: codigo,
          p_mensagem_erro:
            'O formato do arquivo não é suportado ou não corresponde à extensão/MIME registrados.',
          p_detalhes: {
            motivo: identificacao.motivo,
            extensao: identificacao.extensao,
            mime_registrado: identificacao.mimeRegistrado,
            bytes_amostrados: amostra.byteLength,
          },
        })

      if (falhaError) throw falhaError
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
