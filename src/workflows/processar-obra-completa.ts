import { getRun, start } from 'workflow/api'
import { processarObraWorkflow } from '@/workflows/processar-obra'
import {
  concluirExtracaoElementosStep,
  extrairElementosFragmentoStep,
  planejarExtracaoElementosStep,
  type PlanoExtracaoElementos,
  type ResultadoConclusaoExtracao,
  type ResultadoExtracaoFragmento,
} from '@/workflows/extrair-elementos-step'
import { createBackendClient } from '@/infraestrutura/supabase/backend'

type ResultadoPipelineBase = Awaited<ReturnType<typeof processarObraWorkflow>>

type ResultadoProcessamentoCompleto = ResultadoPipelineBase & {
  planejamentoElementos?: PlanoExtracaoElementos
  extracoesElementos?: ResultadoExtracaoFragmento[]
  conclusaoElementos?: ResultadoConclusaoExtracao
}

async function iniciarPipelineBase(execucaoId: string): Promise<string> {
  'use step'

  const run = await start(processarObraWorkflow, [execucaoId])
  return run.runId
}

async function coletarPipelineBase(runId: string): Promise<ResultadoPipelineBase> {
  'use step'

  const run = getRun(runId)
  return (await run.returnValue) as ResultadoPipelineBase
}

async function registrarFalhaFinalExtracao(
  execucaoId: string,
  tipoErro: string
): Promise<void> {
  'use step'

  const backend = createBackendClient()
  const { error } = await backend
    .schema('aplicacao')
    .rpc('backend_falhar_execucao', {
      p_execucao_id: execucaoId,
      p_nome_etapa: 'extrair_elementos',
      p_codigo_erro: 'EXTRACAO_ELEMENTOS_ESGOTOU_RETRIES',
      p_mensagem_erro:
        'A extração de elementos falhou após as tentativas automáticas seguras do workflow.',
      p_detalhes: { tipo_erro: tipoErro },
    })

  if (error) throw error
}

export async function processarObraCompletaWorkflow(
  execucaoId: string
): Promise<ResultadoProcessamentoCompleto> {
  'use workflow'

  const runIdBase = await iniciarPipelineBase(execucaoId)
  const resultadoBase = await coletarPipelineBase(runIdBase)

  if (!resultadoBase.ok) return resultadoBase

  let planejamentoElementos: PlanoExtracaoElementos
  const extracoesElementos: ResultadoExtracaoFragmento[] = []
  let conclusaoElementos: ResultadoConclusaoExtracao | undefined

  try {
    planejamentoElementos = await planejarExtracaoElementosStep(execucaoId)

    if (
      !planejamentoElementos.ok ||
      !planejamentoElementos.fragmentosIds ||
      typeof planejamentoElementos.permitirCriacao !== 'boolean' ||
      !planejamentoElementos.config
    ) {
      return {
        ...resultadoBase,
        ok: false,
        planejamentoElementos,
        extracoesElementos,
      }
    }

    let quantidadeElementos = 0

    for (const fragmentoId of planejamentoElementos.fragmentosIds) {
      const resultado = await extrairElementosFragmentoStep(
        execucaoId,
        fragmentoId,
        planejamentoElementos.permitirCriacao,
        planejamentoElementos.config
      )
      extracoesElementos.push(resultado)

      if (!resultado.ok) {
        return {
          ...resultadoBase,
          ok: false,
          planejamentoElementos,
          extracoesElementos,
        }
      }

      quantidadeElementos += resultado.quantidadeElementos ?? 0
    }

    conclusaoElementos = await concluirExtracaoElementosStep(
      execucaoId,
      planejamentoElementos.permitirCriacao,
      planejamentoElementos.fragmentosIds.length,
      quantidadeElementos
    )
  } catch (error) {
    const tipoErro = error instanceof Error ? error.name : 'erro_desconhecido'
    await registrarFalhaFinalExtracao(execucaoId, tipoErro)
    throw error
  }

  return {
    ...resultadoBase,
    ok: conclusaoElementos.ok,
    planejamentoElementos,
    extracoesElementos,
    conclusaoElementos,
  }
}
