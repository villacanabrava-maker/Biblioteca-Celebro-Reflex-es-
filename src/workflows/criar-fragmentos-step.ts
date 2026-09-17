import { createHash } from 'node:crypto'
import { LIMITES_EXTRACAO } from '@/dominios/processamento/extrair-conteudo'
import { validarArtefatoNormalizado } from '@/dominios/processamento/normalizar-conteudo'
import {
  montarFragmentosDocumento,
  type SecaoDocumento,
} from '@/dominios/processamento/criar-fragmentos'
import { createBackendClient } from '@/infraestrutura/supabase/backend'

export type ResultadoCriarFragmentosStep = {
  ok: boolean
  execucaoId: string
  documentoProcessadoId?: string
  quantidadeFragmentos?: number
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
  tipo: 'conteudo_extraido' | 'conteudo_normalizado'
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

async function obterSecoesDocumento(execucaoId: string): Promise<SecaoDocumento[]> {
  const backend = createBackendClient()
  const { data, error } = await backend
    .schema('aplicacao')
    .rpc('backend_listar_secoes_documento', { p_execucao_id: execucaoId })

  if (error) throw error

  const linhas = (Array.isArray(data) ? data : []) as Array<{
    secao_id: string
    secao_pai_id: string | null
    codigo: string
    tipo: SecaoDocumento['tipo']
    titulo: string | null
    ordem: number
    pagina_inicial: number | null
    pagina_final: number | null
    indice_inicio: number | null
    indice_fim: number | null
  }>

  return linhas.map((linha) => ({
    secao_id: linha.secao_id,
    secao_pai_id: linha.secao_pai_id,
    codigo: linha.codigo,
    tipo: linha.tipo,
    titulo: linha.titulo,
    ordem: linha.ordem,
    pagina_inicial: linha.pagina_inicial,
    pagina_final: linha.pagina_final,
    indice_inicio: linha.indice_inicio,
    indice_fim: linha.indice_fim,
  }))
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
      p_nome_etapa: 'criar_fragmentos',
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

async function concluirCriacaoFragmentos(
  execucaoId: string,
  documentoProcessadoId: string,
  reutilizado: boolean,
  quantidadeFragmentos: number
) {
  const backend = createBackendClient()
  const { error } = await backend
    .schema('aplicacao')
    .rpc('backend_concluir_etapa', {
      p_execucao_id: execucaoId,
      p_nome_etapa: 'criar_fragmentos',
      p_percentual: 45,
      p_proximo_estado: 'analisando',
      p_proxima_etapa: 'criar_sinteses',
      p_detalhes: {
        documento_processado_id: documentoProcessadoId,
        reutilizado,
        quantidade_fragmentos: quantidadeFragmentos,
      },
    })

  if (error) throw error
}

export async function criarFragmentosStep(
  execucaoId: string
): Promise<ResultadoCriarFragmentosStep> {
  'use step'

  const backend = createBackendClient()
  const { data: etapaData, error: etapaError } = await backend
    .schema('aplicacao')
    .rpc('backend_iniciar_etapa', {
      p_execucao_id: execucaoId,
      p_nome_etapa: 'criar_fragmentos',
      p_estado_execucao: 'segmentando',
      p_percentual: 36,
    })

  if (etapaError) throw etapaError

  const etapa = Array.isArray(etapaData) ? etapaData[0] : null
  if (etapa?.deve_executar === false) {
    return { ok: true, execucaoId, reutilizada: true }
  }

  const contexto = await obterContexto(execucaoId)
  const artefatoExtraido = await obterArtefato(execucaoId, 'conteudo_extraido')
  const artefatoNormalizado = await obterArtefato(execucaoId, 'conteudo_normalizado')

  if (!artefatoExtraido || !artefatoNormalizado) {
    await registrarFalhaDeterministica(
      execucaoId,
      'ARTEFATO_NORMALIZADO_AUSENTE',
      'A criação de fragmentos exige os artefatos extraído e normalizado da execução.'
    )
    return { ok: false, execucaoId, motivo: 'artefato_normalizado_ausente' }
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

  const validacaoNormalizado = validarArtefatoNormalizado({
    bytes: downloadNormalizado.dados,
    hashOriginalEsperado: contexto.hash_sha256,
    hashArtefatoExtraidoEsperado: artefatoExtraido.hash_sha256,
  })

  if (!validacaoNormalizado.ok) {
    await registrarFalhaDeterministica(
      execucaoId,
      validacaoNormalizado.codigo,
      validacaoNormalizado.motivo,
      validacaoNormalizado.detalhes ?? {}
    )
    return { ok: false, execucaoId, motivo: validacaoNormalizado.codigo.toLowerCase() }
  }

  const secoes = await obterSecoesDocumento(execucaoId)
  if (secoes.length === 0) {
    await registrarFalhaDeterministica(
      execucaoId,
      'SECOES_AUSENTES',
      'A criação de fragmentos exige que criar_hierarquia já tenha materializado as seções da execução.'
    )
    return { ok: false, execucaoId, motivo: 'secoes_ausentes' }
  }

  const fragmentos = montarFragmentosDocumento({
    secoes,
    normalizado: validacaoNormalizado.artefato,
  })

  if (fragmentos.length === 0) {
    await registrarFalhaDeterministica(
      execucaoId,
      'NENHUM_FRAGMENTO_EXTRAIDO',
      'Nenhuma seção produziu conteúdo extraível para fragmentação.'
    )
    return { ok: false, execucaoId, motivo: 'nenhum_fragmento_extraido' }
  }

  const { data: resultadoRpc, error: fragmentosError } = await backend
    .schema('aplicacao')
    .rpc('backend_criar_fragmentos_documento', {
      p_execucao_id: execucaoId,
      p_fragmentos: fragmentos,
    })

  if (fragmentosError) throw fragmentosError

  const resultado = Array.isArray(resultadoRpc) ? resultadoRpc[0] : null
  if (!resultado?.documento_processado_id) {
    throw new Error('O banco não retornou o identificador do Documento Processado.')
  }

  await concluirCriacaoFragmentos(
    execucaoId,
    resultado.documento_processado_id,
    resultado.criado === false,
    resultado.quantidade
  )

  return {
    ok: true,
    execucaoId,
    documentoProcessadoId: resultado.documento_processado_id,
    quantidadeFragmentos: resultado.quantidade,
    reutilizada: resultado.criado === false,
  }
}
