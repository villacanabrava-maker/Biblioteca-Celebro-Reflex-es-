import { NextResponse } from 'next/server'
import { z } from 'zod'
import { start } from 'workflow/api'
import { createClient } from '@/infraestrutura/supabase/server'
import { createBackendClient } from '@/infraestrutura/supabase/backend'
import { processarObraWorkflow } from '@/workflows/processar-obra'

const entradaSchema = z.object({
  versaoObraId: z.string().uuid(),
})

export async function POST(request: Request) {
  if (process.env.PROCESSAMENTO_WORKFLOW_ATIVO !== 'true') {
    return NextResponse.json(
      {
        erro: 'workflow_desativado',
        mensagem:
          'O workflow documental ainda está em implantação controlada neste ambiente.',
      },
      { status: 503 }
    )
  }

  let entrada: z.infer<typeof entradaSchema>

  try {
    entrada = entradaSchema.parse(await request.json())
  } catch {
    return NextResponse.json(
      { erro: 'dados_invalidos', mensagem: 'versaoObraId inválido.' },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims()
  const usuarioId = claimsData?.claims?.sub

  if (claimsError || !usuarioId) {
    return NextResponse.json(
      { erro: 'nao_autenticado', mensagem: 'Autenticação obrigatória.' },
      { status: 401 }
    )
  }

  let backend
  try {
    backend = createBackendClient()
  } catch {
    return NextResponse.json(
      {
        erro: 'backend_nao_configurado',
        mensagem: 'O backend de processamento ainda não está configurado neste ambiente.',
      },
      { status: 503 }
    )
  }

  const { data, error } = await backend
    .schema('aplicacao')
    .rpc('backend_iniciar_processamento', {
      p_usuario_id: usuarioId,
      p_versao_obra_id: entrada.versaoObraId,
    })

  if (error) {
    const naoEncontrado = error.message.includes('versao_obra_nao_encontrada')
    return NextResponse.json(
      {
        erro: naoEncontrado ? 'versao_nao_encontrada' : 'falha_ao_iniciar',
        mensagem: naoEncontrado
          ? 'A versão informada não pertence ao usuário autenticado.'
          : 'Não foi possível preparar a execução documental.',
      },
      { status: naoEncontrado ? 404 : 500 }
    )
  }

  const execucao = Array.isArray(data) ? data[0] : null

  if (!execucao?.execucao_id) {
    return NextResponse.json(
      { erro: 'execucao_invalida', mensagem: 'O banco não retornou uma execução válida.' },
      { status: 500 }
    )
  }

  if (!execucao.criada) {
    return NextResponse.json({
      execucaoId: execucao.execucao_id,
      codigo: execucao.execucao_codigo,
      estado: execucao.estado,
      criada: false,
      workflowIniciado: false,
    })
  }

  try {
    // A região do Workflow será configurada somente após validarmos a API estável
    // da versão fixada do SDK. Primeiro preservamos compatibilidade e reprodutibilidade.
    await start(processarObraWorkflow, [execucao.execucao_id])
  } catch {
    await backend.schema('aplicacao').rpc('backend_falhar_execucao', {
      p_execucao_id: execucao.execucao_id,
      p_nome_etapa: 'validar_arquivo',
      p_codigo_erro: 'WORKFLOW_INICIO_FALHOU',
      p_mensagem_erro: 'Não foi possível iniciar o workflow durável.',
      p_detalhes: { origem: 'api_processamento_iniciar' },
    })

    return NextResponse.json(
      {
        erro: 'workflow_nao_iniciado',
        mensagem: 'A execução foi preparada, mas o workflow não pôde ser iniciado.',
      },
      { status: 500 }
    )
  }

  return NextResponse.json(
    {
      execucaoId: execucao.execucao_id,
      codigo: execucao.execucao_codigo,
      estado: execucao.estado,
      criada: true,
      workflowIniciado: true,
    },
    { status: 202 }
  )
}
