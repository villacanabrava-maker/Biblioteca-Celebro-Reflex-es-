"use server";

import { revalidatePath } from "next/cache";
import { criarClienteAdmin } from "@/infraestrutura/supabase/cliente-admin";
import { obterUsuarioAtualId } from "@/infraestrutura/auth/usuario-atual";
import { detectarConflitosEMontarDossie } from "@/dominios/reflexoes/detector-conflitos";
import { gerarPlanoReflexao } from "@/dominios/reflexoes/planejador-reflexao";
import { redigirReflexao } from "@/dominios/reflexoes/redator-reflexao";
import { auditarVersaoReflexao } from "@/dominios/auditoria/auditor-independente";
import type {
  ResumoReflexao,
  EntradaReflexao,
  PlanoReflexao,
  VersaoReflexao,
  CitacaoEvidencia,
  FormatoReflexao,
  TipoOrigemExterna,
  ConflitoDetectado,
  DossieContextual,
} from "@/tipos/reflexoes";
import type { RelatorioAuditoria } from "@/tipos/auditoria";

/**
 * Obtém a lista de todas as reflexões do usuário com métricas da última versão.
 */
export async function obterResumoReflexoes(): Promise<ResumoReflexao[]> {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  const { data, error } = await admin
    .from("v_reflexoes_resumo")
    .select("*")
    .eq("usuario_id", usuarioId)
    .order("atualizado_em", { ascending: false });

  if (error) {
    console.error("Erro ao obter resumo de reflexões:", error);
    return [];
  }

  return (data as ResumoReflexao[]) || [];
}

/**
 * Obtém os dados completos de uma reflexão (entrada, plano, versões, citações, auditoria).
 */
export async function obterReflexaoCompleta(entradaId: string): Promise<{
  entrada: EntradaReflexao | null;
  plano: PlanoReflexao | null;
  versoes: (VersaoReflexao & {
    citacoes: CitacaoEvidencia[];
    auditoria?: RelatorioAuditoria | null;
  })[];
}> {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  // 1. Entrada
  const { data: entrada } = await admin
    .schema("reflexoes")
    .from("entradas")
    .select("*")
    .eq("id", entradaId)
    .eq("usuario_id", usuarioId)
    .single();

  if (!entrada) {
    return { entrada: null, plano: null, versoes: [] };
  }

  // 2. Plano mais recente
  const { data: plano } = await admin
    .schema("reflexoes")
    .from("planos_reflexao")
    .select("*")
    .eq("entrada_id", entradaId)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  // 3. Versões
  const { data: versoes } = await admin
    .schema("reflexoes")
    .from("versoes_reflexao")
    .select("*")
    .eq("entrada_id", entradaId)
    .order("numero_versao", { ascending: false });

  const versoesCompletas = [];

  for (const v of versoes || []) {
    // Citações da versão
    const { data: citacoes } = await admin
      .schema("reflexoes")
      .from("citacoes_evidencias")
      .select("*")
      .eq("versao_reflexao_id", v.id);

    // Relatório de Auditoria da versão
    const { data: relatorio } = await admin
      .schema("auditoria")
      .from("relatorios_auditoria")
      .select("*")
      .eq("versao_reflexao_id", v.id)
      .order("criado_em", { ascending: false })
      .limit(1)
      .maybeSingle();

    versoesCompletas.push({
      ...v,
      citacoes: citacoes || [],
      auditoria: relatorio || null,
    });
  }

  return {
    entrada: entrada as EntradaReflexao,
    plano: (plano as PlanoReflexao) || null,
    versoes: versoesCompletas as any,
  };
}

/**
 * Inicia a esteira metodológica de reflexão:
 * 1. Salva estímulo externo e comentário do autor.
 * 2. Consulta memórias, regras e detecta tensões dialéticas e oportunidades conceituais.
 */
export async function iniciarEsteiraReflexao({
  reflexaoExterna,
  tipoOrigemExterna = "texto",
  comentarioAutor,
  temaCentral,
  titulo,
  formatoDesejado = "ensaio",
}: {
  reflexaoExterna: string;
  tipoOrigemExterna?: TipoOrigemExterna;
  comentarioAutor: string;
  temaCentral?: string;
  titulo?: string;
  formatoDesejado?: FormatoReflexao;
}): Promise<{
  sucesso: boolean;
  entradaId: string;
  conflitos: ConflitoDetectado[];
  dossie: DossieContextual;
}> {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  const tema = (temaCentral || titulo || reflexaoExterna.slice(0, 60)).trim();
  const tit = (titulo || `Reflexão sobre ${tema}`).trim();

  // 1. Detectar tensões cognitivas e montar dossiê de memórias
  const { conflitos, dossie } = await detectarConflitosEMontarDossie({
    usuarioId,
    reflexaoExterna,
    comentarioAutor,
    temaCentral: tema,
  });

  // 2. Salvar entrada de reflexão com o dossiê e conflitos
  const { data: entrada, error } = await admin
    .schema("reflexoes")
    .from("entradas")
    .insert({
      usuario_id: usuarioId,
      titulo: tit,
      tema_central: tema,
      provocacao_inicial: reflexaoExterna,
      reflexao_externa: reflexaoExterna,
      tipo_origem_externa: tipoOrigemExterna,
      comentario_autor: comentarioAutor,
      dossie_contexto: dossie,
      conflitos_detectados: conflitos,
      formato_desejado: formatoDesejado,
      estado: "criada",
    })
    .select()
    .single();

  if (error || !entrada) {
    throw new Error(`Falha ao iniciar esteira de reflexão: ${error?.message}`);
  }

  try {
    revalidatePath("/reflexoes");
  } catch {}

  return {
    sucesso: true,
    entradaId: entrada.id,
    conflitos,
    dossie,
  };
}

/**
 * Cria uma nova entrada de reflexão e dispara o planejamento cognitivo com IA.
 */
export async function criarNovaReflexao({
  titulo,
  temaCentral,
  provocacaoInicial,
  objetivoComunicativo,
  publicoAlvo,
  formatoDesejado = "ensaio",
  restricoesEspecificas,
}: {
  titulo: string;
  temaCentral: string;
  provocacaoInicial: string;
  objetivoComunicativo?: string;
  publicoAlvo?: string;
  formatoDesejado?: FormatoReflexao;
  restricoesEspecificas?: string;
}) {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  const { data: entrada, error: errEntrada } = await admin
    .schema("reflexoes")
    .from("entradas")
    .insert({
      usuario_id: usuarioId,
      titulo: titulo.trim(),
      tema_central: temaCentral.trim(),
      provocacao_inicial: provocacaoInicial.trim(),
      reflexao_externa: provocacaoInicial.trim(),
      objetivo_comunicativo: objetivoComunicativo?.trim() || null,
      publico_alvo: publicoAlvo?.trim() || null,
      formato_desejado: formatoDesejado,
      restricoes_especificas: restricoesEspecificas?.trim() || null,
      estado: "criada",
    })
    .select()
    .single();

  if (errEntrada || !entrada) {
    throw new Error(`Falha ao criar entrada de reflexão: ${errEntrada?.message}`);
  }

  try {
    const plano = await gerarPlanoReflexao({
      entradaId: entrada.id,
      usuarioId,
      titulo: entrada.titulo,
      temaCentral: entrada.tema_central,
      provocacaoInicial: entrada.provocacao_inicial,
      objetivoComunicativo: entrada.objetivo_comunicativo,
      publicoAlvo: entrada.publico_alvo,
      formatoDesejado: entrada.formato_desejado,
      restricoesEspecificas: entrada.restricoes_especificas,
    });

    try {
      revalidatePath("/reflexoes");
    } catch {}

    return { sucesso: true, entradaId: entrada.id, planoId: plano.id };
  } catch (err: any) {
    console.error("Erro no planejamento automático:", err);
    return { sucesso: true, entradaId: entrada.id, planoId: null, aviso: err.message };
  }
}

/**
 * Gera o plano metodológico da reflexão com base na entrada e seu dossiê.
 */
export async function gerarPlanoParaEntrada(entradaId: string) {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  const { data: entrada, error } = await admin
    .schema("reflexoes")
    .from("entradas")
    .select("*")
    .eq("id", entradaId)
    .eq("usuario_id", usuarioId)
    .single();

  if (error || !entrada) {
    throw new Error("Entrada de reflexão não encontrada.");
  }

  const plano = await gerarPlanoReflexao({
    entradaId: entrada.id,
    usuarioId,
    titulo: entrada.titulo,
    temaCentral: entrada.tema_central,
    provocacaoInicial: entrada.provocacao_inicial,
    reflexaoExterna: entrada.reflexao_externa,
    comentarioAutor: entrada.comentario_autor,
    objetivoComunicativo: entrada.objetivo_comunicativo,
    publicoAlvo: entrada.publico_alvo,
    formatoDesejado: entrada.formato_desejado,
    restricoesEspecificas: entrada.restricoes_especificas,
  });

  try {
    revalidatePath(`/reflexoes/${entradaId}`);
    revalidatePath("/reflexoes");
  } catch {}

  return { sucesso: true, plano };
}

/**
 * Aprova o plano de reflexão e aciona o motor de redação autoral e auditoria imediata.
 */
export async function acionarRedacaoReflexao({
  entradaId,
  planoId,
}: {
  entradaId: string;
  planoId: string;
}) {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  // 1. Atualizar estado do plano para aprovado_pelo_autor
  await admin
    .schema("reflexoes")
    .from("planos_reflexao")
    .update({ estado: "aprovado_pelo_autor" })
    .eq("id", planoId);

  // 2. Redigir reflexão completa
  const versao = await redigirReflexao({
    entradaId,
    planoId,
    usuarioId,
  });

  // 3. Executar Auditoria Crítica Independente
  const auditoria = await auditarVersaoReflexao({
    versaoId: versao.id,
    usuarioId,
  });

  try {
    revalidatePath(`/reflexoes/${entradaId}`);
    revalidatePath("/reflexoes");
  } catch {}

  return { sucesso: true, versaoId: versao.id, auditoriaId: auditoria.id };
}

/**
 * Incorpora a reflexão aprovada como Obra Autoral na Biblioteca,
 * alimentando permanentemente o Cérebro Autoral.
 */
export async function incorporarReflexaoMemoria({
  entradaId,
  versaoId,
}: {
  entradaId: string;
  versaoId: string;
}) {
  return incorporarReflexaoComoObra({ entradaId, versaoId });
}

/**
 * Salva as notas de revisão e o parecer final do autor sobre uma versão gerada.
 */
export async function registrarRevisaoAutor({
  versaoId,
  entradaId,
  comentarioGeral,
  ajustesSolicitados = [],
  aprovado,
}: {
  versaoId: string;
  entradaId: string;
  comentarioGeral?: string;
  ajustesSolicitados?: string[];
  aprovado: boolean;
}) {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  const { error } = await admin
    .schema("reflexoes")
    .from("revisoes_autor")
    .insert({
      versao_reflexao_id: versaoId,
      usuario_id: usuarioId,
      comentario_geral: comentarioGeral || null,
      ajustes_solicitados: ajustesSolicitados,
      aprovado,
    });

  if (error) {
    throw new Error(`Falha ao registrar revisão: ${error.message}`);
  }

  // Se aprovado pelo autor, marcar versão e entrada como aprovadas
  if (aprovado) {
    await admin
      .schema("reflexoes")
      .from("versoes_reflexao")
      .update({ estado: "aprovado" })
      .eq("id", versaoId);

    await admin
      .schema("reflexoes")
      .from("entradas")
      .update({ estado: "concluida" })
      .eq("id", entradaId);
  }

  try {
    revalidatePath(`/reflexoes/${entradaId}`);
    revalidatePath("/reflexoes");
  } catch {}

  return { sucesso: true };
}

/**
 * Promove uma reflexão formalmente aprovada pelo autor a uma nova obra autoral
 * na Biblioteca, gerando arquivo Markdown no Storage e ativando o pipeline.
 */
export async function incorporarReflexaoComoObra({
  entradaId,
  versaoId,
}: {
  entradaId: string;
  versaoId: string;
}) {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  // 1. Chamar a RPC segura de incorporação com validação de aprovado_autor
  const { data: obraId, error } = await admin.rpc("incorporar_reflexao_como_obra", {
    p_entrada_id: entradaId,
    p_versao_id: versaoId,
    p_usuario_id: usuarioId,
  });

  if (error) {
    console.error("Erro ao incorporar reflexão como obra:", error);
    throw new Error(`Falha na incorporação da reflexão: ${error.message}`);
  }

  // 2. Gravar o conteúdo textual em Markdown no Supabase Storage
  try {
    const { data: versao } = await admin
      .schema("reflexoes")
      .from("versoes_reflexao")
      .select("conteudo_markdown, numero_versao")
      .eq("id", versaoId)
      .single();

    if (versao?.conteudo_markdown) {
      const caminhoStorage = `reflexoes/${usuarioId}/${entradaId}.md`;
      await admin.storage
        .from("originais-biblioteca")
        .upload(caminhoStorage, Buffer.from(versao.conteudo_markdown, "utf-8"), {
          contentType: "text/markdown; charset=utf-8",
          upsert: true,
        });
    }
  } catch (err) {
    console.warn("Aviso ao persistir arquivo markdown no storage:", err);
  }

  try {
    revalidatePath("/biblioteca");
    revalidatePath(`/reflexoes/${entradaId}`);
    revalidatePath("/reflexoes");
  } catch {}

  return { sucesso: true, obraId: obraId as string };
}

/**
 * Verificador determinístico de antialucinação e integridade de evidências
 * conforme Seção 61 do Documento Mestre v2.0.
 */
export async function verificarCitacoesRedacao({
  entradaId,
  versaoId: _versaoId,
  redacaoTexto,
}: {
  entradaId: string;
  versaoId: string;
  redacaoTexto: string;
}) {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  // 1. Obter os fragmentos mobilizados no dossiê de contexto
  const { data: contexto } = await admin
    .schema("reflexoes")
    .from("contextos")
    .select("fragmentos")
    .eq("entrada_id", entradaId)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  const fragmentosDossie = (contexto?.fragmentos as any[]) || [];

  // 2. Extrair potenciais citações no texto (trechos entre aspas)
  const padraoAspas = /"([^"]{15,})"/g;
  const correspondencias = [...redacaoTexto.matchAll(padraoAspas)];

  const citacoesParaSalvar: any[] = [];

  for (const match of correspondencias) {
    const trechoCitado = match[1];

    // Verificar se existe em algum fragmento real do usuário
    const fragmentoCorrespondente = fragmentosDossie.find(
      (f: any) =>
        f.conteudo &&
        f.conteudo.toLowerCase().includes(trechoCitado.toLowerCase().slice(0, 30))
    );

    citacoesParaSalvar.push({
      entrada_id: entradaId,
      usuario_id: usuarioId,
      redacao_versao: 1,
      fragmento_id: fragmentoCorrespondente?.id || null,
      texto_citado: trechoCitado,
      texto_original: fragmentoCorrespondente?.conteudo || null,
      alinhamento_valido: !!fragmentoCorrespondente,
      tipo_fonte:
        fragmentoCorrespondente?.papel_fonte === "externa"
          ? "referencia_externa"
          : "autoral",
    });
  }

  if (citacoesParaSalvar.length > 0) {
    await admin
      .schema("reflexoes")
      .from("citacoes_verificadas")
      .insert(citacoesParaSalvar);
  }

  return {
    totalCitacoes: citacoesParaSalvar.length,
    validas: citacoesParaSalvar.filter((c) => c.alinhamento_valido).length,
    invalidas: citacoesParaSalvar.filter((c) => !c.alinhamento_valido).length,
  };
}
