import { createHash } from 'node:crypto'
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

export async function processarObraWorkflow(
  execucaoId: string
): Promise<ResultadoValidacao> {
  'use workflow'

  try {
    return await validarOriginal(execucaoId)
  } catch (error) {
    const tipoErro = error instanceof Error ? error.name : 'erro_desconhecido'
    await registrarFalhaFinalValidacao(execucaoId, tipoErro)
    throw error
  }
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

  const { data: contextoData, error: contextoError } = await backend
    .schema('aplicacao')
    .rpc('backend_obter_execucao', { p_execucao_id: execucaoId })

  if (contextoError) throw contextoError

  const contexto = (Array.isArray(contextoData) ? contextoData[0] : null) as
    | ContextoExecucao
    | undefined

  if (!contexto) {
    throw new Error('Execução de processamento não encontrada.')
  }

  const { data: urlAssinada, error: urlError } = await backend.storage
    .from('originais-biblioteca')
    .createSignedUrl(contexto.caminho_arquivo, 300)

  if (urlError || !urlAssinada?.signedUrl) {
    throw new Error('Não foi possível gerar URL temporária do original.')
  }

  const resposta = await fetch(urlAssinada.signedUrl, {
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

async function registrarFalhaFinalValidacao(
  execucaoId: string,
  tipoErro: string
) {
  'use step'

  const backend = createBackendClient()
  const { error: falhaError } = await backend
    .schema('aplicacao')
    .rpc('backend_falhar_execucao', {
      p_execucao_id: execucaoId,
      p_nome_etapa: 'validar_arquivo',
      p_codigo_erro: 'VALIDACAO_ORIGINAL_ESGOTOU_RETRIES',
      p_mensagem_erro:
        'A validação do arquivo original falhou após as tentativas automáticas do workflow.',
      p_detalhes: { tipo_erro: tipoErro },
    })

  if (falhaError) throw falhaError
}
