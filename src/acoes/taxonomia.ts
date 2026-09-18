"use server";

import { revalidatePath } from "next/cache";
import { criarClienteAdmin } from "@/infraestrutura/supabase/cliente-admin";
import { obterUsuarioAtualId } from "@/infraestrutura/auth/usuario-atual";

import type {
  ConceitoTaxonomico,
  ArestaGrafoTaxonomia,
  SugestaoTagTaxonomia,
} from "@/tipos/taxonomia";
import {
  taxonomizarDocumentoProcessado,
  taxonomizarReflexaoAprovada,
} from "@/dominios/taxonomia/aplicador-taxonomia";
import { gerarRelacoesParaConceitoConfirmado } from "@/dominios/taxonomia/gerador-relacoes";

/**
 * Obtém todos os conceitos canônicos com sinônimos e total de ocorrências.
 */
export async function obterConceitos(filtroDominio?: string): Promise<ConceitoTaxonomico[]> {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  let query = admin
    .from("v_taxonomia_conceitos")
    .select("*")
    .eq("usuario_id", usuarioId)
    .in("estado", ["ativo", "revisao"])
    .order("total_fragmentos", { ascending: false });

  if (filtroDominio && filtroDominio !== "todos") {
    query = query.eq("dominio", filtroDominio);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao listar conceitos da taxonomia:", error);
    return [];
  }

  return (data as ConceitoTaxonomico[]) || [];
}

/**
 * Sugestões canônicas para o formulário da Biblioteca.
 * Somente conceitos ativos/confirmados podem virar tags sugeridas.
 */
export async function obterSugestoesTagsTaxonomia(): Promise<SugestaoTagTaxonomia[]> {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  const { data, error } = await admin
    .from("v_taxonomia_conceitos")
    .select("id, codigo, termo_preferencial, dominio, total_fragmentos, total_reflexoes")
    .eq("usuario_id", usuarioId)
    .eq("estado", "ativo")
    .order("total_fragmentos", { ascending: false })
    .order("total_reflexoes", { ascending: false })
    .limit(40);

  if (error) {
    console.error("Erro ao obter sugestões de tags da Taxonomia:", error);
    return [];
  }

  return (data || []).map((conceito: any) => ({
    id: conceito.id,
    codigo: conceito.codigo,
    termo: conceito.termo_preferencial,
    dominio: conceito.dominio,
    total_ocorrencias:
      Number(conceito.total_fragmentos || 0) +
      Number(conceito.total_reflexoes || 0),
  })) as SugestaoTagTaxonomia[];
}

/**
 * Obtém o grafo semântico completo de nós e arestas da taxonomia.
 */
export async function obterGrafoTaxonomia(): Promise<ArestaGrafoTaxonomia[]> {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  const { data, error } = await admin
    .from("v_taxonomia_grafo")
    .select("*")
    .eq("usuario_id", usuarioId)
    .eq("estado", "ativo");

  if (error) {
    console.error("Erro ao listar grafo da taxonomia:", error);
    return [];
  }

  return (data as ArestaGrafoTaxonomia[]) || [];
}

/**
 * Lista relações propostas pela IA que aguardam decisão humana.
 */
export async function obterRelacoesEmRevisao(): Promise<ArestaGrafoTaxonomia[]> {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  const { data, error } = await admin
    .from("v_taxonomia_grafo")
    .select("*")
    .eq("usuario_id", usuarioId)
    .eq("estado", "revisao")
    .order("confianca", { ascending: false });

  if (error) {
    console.error("Erro ao obter relações em revisão:", error);
    return [];
  }

  return (data as ArestaGrafoTaxonomia[]) || [];
}

/**
 * Cadastra um novo conceito ontológico com termo preferencial e domínio.
 */
function normalizarTermoTaxonomico(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function gerarCodigoConceito(valor: string): string {
  return normalizarTermoTaxonomico(valor)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

export async function cadastrarConceito({
  termoPreferencial,
  definicao,
  dominio,
  sinonimos = [],
}: {
  termoPreferencial: string;
  definicao: string;
  dominio: string;
  sinonimos?: string[];
}) {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  const termoLimpo = termoPreferencial.trim();
  const definicaoLimpa = definicao.trim();

  if (!termoLimpo || !definicaoLimpa) {
    throw new Error("Termo preferencial e definição são obrigatórios.");
  }

  // 1. Obter versão ativa da taxonomia
  const { data: versao } = await admin
    .schema("taxonomia")
    .from("versoes")
    .select("id")
    .eq("estado", "ativa")
    .limit(1)
    .single();

  if (!versao) {
    throw new Error("Nenhuma versão ativa da taxonomia encontrada.");
  }

  const codigo = gerarCodigoConceito(termoLimpo);

  if (!codigo) {
    throw new Error("Não foi possível gerar um código válido para o conceito.");
  }

  const { data: existente } = await admin
    .schema("taxonomia")
    .from("conceitos")
    .select("id")
    .eq("usuario_id", usuarioId)
    .eq("codigo", codigo)
    .maybeSingle();

  if (existente) {
    throw new Error("Já existe um conceito com este termo na sua Taxonomia.");
  }

  // 2. Inserir conceito
  const { data: conceito, error: errConceito } = await admin
    .schema("taxonomia")
    .from("conceitos")
    .insert({
      versao_taxonomia_id: versao.id,
      usuario_id: usuarioId,
      codigo,
      termo_preferencial: termoLimpo,
      definicao: definicaoLimpa,
      dominio,
      estado: "ativo",
      origem: "curadoria",
      confianca: 1,
    })
    .select()
    .single();

  if (errConceito || !conceito) {
    throw new Error(`Falha ao cadastrar conceito: ${errConceito?.message}`);
  }

  // 3. Persistir termo preferencial e sinônimos de forma validada.
  const sinonimosLimpos = Array.from(
    new Set(
      sinonimos
        .map((sinonimo) => sinonimo.trim())
        .filter(Boolean)
        .filter(
          (sinonimo) =>
            normalizarTermoTaxonomico(sinonimo) !==
            normalizarTermoTaxonomico(termoLimpo)
        )
    )
  );

  const termosParaInserir = [
    {
      conceito_id: conceito.id,
      termo: termoLimpo,
      termo_normalizado: normalizarTermoTaxonomico(termoLimpo),
      tipo: "preferencial",
    },
    ...sinonimosLimpos.map((sinonimo) => ({
      conceito_id: conceito.id,
      termo: sinonimo,
      termo_normalizado: normalizarTermoTaxonomico(sinonimo),
      tipo: "sinonimo",
    })),
  ];

  const { error: errTermos } = await admin
    .schema("taxonomia")
    .from("termos")
    .insert(termosParaInserir);

  if (errTermos) {
    await admin
      .schema("taxonomia")
      .from("conceitos")
      .delete()
      .eq("id", conceito.id)
      .eq("usuario_id", usuarioId);

    throw new Error(`Falha ao cadastrar termos do conceito: ${errTermos.message}`);
  }

  let totalRelacoesPropostas = 0;
  let avisoRelacoes: string | null = null;

  try {
    const relacoes = await gerarRelacoesParaConceitoConfirmado({
      conceitoId: conceito.id,
      usuarioId,
    });
    totalRelacoesPropostas = relacoes.totalPropostas;
  } catch (erroRelacoes: unknown) {
    console.error("Conceito cadastrado; geração de relações falhou:", erroRelacoes);
    avisoRelacoes =
      "O conceito foi salvo, mas as relações sugeridas não puderam ser geradas agora.";
  }

  try {
    revalidatePath("/taxonomia");
    revalidatePath("/cerebro");
  } catch {
    // Ignorado fora de requisição HTTP
  }

  return {
    sucesso: true,
    conceito,
    totalRelacoesPropostas,
    avisoRelacoes,
  };
}


/**
 * Executa ou reutiliza a análise taxonômica de um documento processado.
 * O documento continua válido mesmo se esta análise falhar em outro fluxo.
 */
export async function analisarTaxonomiaDocumento({
  documentoProcessadoId,
  forcar = false,
}: {
  documentoProcessadoId: string;
  forcar?: boolean;
}) {
  const usuarioId = await obterUsuarioAtualId();
  const resultado = await taxonomizarDocumentoProcessado({
    documentoProcessadoId,
    usuarioId,
    forcar,
  });

  try {
    revalidatePath(`/documentos-processados/${documentoProcessadoId}`);
    revalidatePath("/taxonomia");
  } catch {}

  return resultado;
}

/**
 * Executa ou reutiliza a análise taxonômica de uma reflexão já aprovada.
 */
export async function analisarTaxonomiaReflexao({
  versaoReflexaoId,
  forcar = false,
}: {
  versaoReflexaoId: string;
  forcar?: boolean;
}) {
  const usuarioId = await obterUsuarioAtualId();
  const resultado = await taxonomizarReflexaoAprovada({
    versaoReflexaoId,
    usuarioId,
    forcar,
  });

  try {
    revalidatePath("/taxonomia");
    revalidatePath("/reflexoes");
  } catch {}

  return resultado;
}

/**
 * Decisão soberana sobre um conceito proposto pela IA.
 * Rejeitar preserva o registro/evidências, mas impede reutilização automática.
 */
export async function decidirConceitoSugerido({
  conceitoId,
  decisao,
}: {
  conceitoId: string;
  decisao: "confirmar" | "rejeitar";
}) {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  const { data: conceito, error: erroBusca } = await admin
    .schema("taxonomia")
    .from("conceitos")
    .select("id, estado, origem")
    .eq("id", conceitoId)
    .eq("usuario_id", usuarioId)
    .single();

  if (erroBusca || !conceito) {
    throw new Error("Conceito sugerido não encontrado.");
  }

  if (conceito.origem !== "ia") {
    throw new Error("Somente conceitos propostos pela IA usam este fluxo de decisão.");
  }

  if (conceito.estado !== "revisao") {
    throw new Error("Este conceito já recebeu uma decisão.");
  }

  const novoEstado = decisao === "confirmar" ? "ativo" : "rejeitado";
  const { error: erroAtualizacao } = await admin
    .schema("taxonomia")
    .from("conceitos")
    .update({ estado: novoEstado })
    .eq("id", conceitoId)
    .eq("usuario_id", usuarioId)
    .eq("estado", "revisao");

  if (erroAtualizacao) {
    throw new Error(`Falha ao registrar decisão do conceito: ${erroAtualizacao.message}`);
  }

  let totalRelacoesPropostas = 0;
  let avisoRelacoes: string | null = null;

  if (decisao === "confirmar") {
    try {
      const relacoes = await gerarRelacoesParaConceitoConfirmado({
        conceitoId,
        usuarioId,
      });
      totalRelacoesPropostas = relacoes.totalPropostas;
    } catch (erroRelacoes: unknown) {
      console.error("Conceito confirmado; geração de relações falhou:", erroRelacoes);
      avisoRelacoes =
        "O conceito foi confirmado, mas as relações sugeridas não puderam ser geradas agora.";
    }
  }

  try {
    revalidatePath("/taxonomia");
    revalidatePath("/biblioteca");
  } catch {}

  return {
    sucesso: true,
    estado: novoEstado,
    totalRelacoesPropostas,
    avisoRelacoes,
  };
}

/**
 * Confirma ou rejeita uma relação proposta pela IA.
 */
export async function decidirRelacaoSugerida({
  relacaoId,
  decisao,
}: {
  relacaoId: string;
  decisao: "confirmar" | "rejeitar";
}) {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  const { data: relacaoView, error: erroBusca } = await admin
    .from("v_taxonomia_grafo")
    .select("relacao_id, usuario_id, origem, estado")
    .eq("relacao_id", relacaoId)
    .eq("usuario_id", usuarioId)
    .maybeSingle();

  if (
    erroBusca ||
    !relacaoView ||
    relacaoView.origem !== "ia" ||
    relacaoView.estado !== "revisao"
  ) {
    throw new Error("Relação sugerida não encontrada ou já decidida.");
  }

  const novoEstado = decisao === "confirmar" ? "ativo" : "rejeitado";
  const { error } = await admin
    .schema("taxonomia")
    .from("relacoes")
    .update({ estado: novoEstado })
    .eq("id", relacaoId)
    .eq("estado", "revisao");

  if (error) {
    throw new Error(`Falha ao registrar decisão da relação: ${error.message}`);
  }

  try {
    revalidatePath("/taxonomia");
  } catch {}

  return { sucesso: true, estado: novoEstado };
}
