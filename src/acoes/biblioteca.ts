"use server";

import { revalidatePath } from "next/cache";
import { criarClienteAdmin } from "@/infraestrutura/supabase/cliente-admin";
import { obterUsuarioAtualId } from "@/infraestrutura/auth/usuario-atual";
import { cadastrarObraSchema, type CadastrarObraInput } from "@/lib/validacoes/biblioteca";
import type { ObraDetalhada, EstatisticasBiblioteca } from "@/tipos/biblioteca";

export interface FiltrosObras {
  tipo?: string;
  natureza?: string;
  busca?: string;
}

/**
 * Obtém a lista de obras cadastradas com os dados da versão ativa.
 */
export async function obterObras(filtros?: FiltrosObras): Promise<ObraDetalhada[]> {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  let query = admin
    .from("v_obras_detalhadas")
    .select("*")
    .eq("usuario_id", usuarioId)
    .order("criado_em", { ascending: false });

  if (filtros?.tipo && filtros.tipo !== "todos") {
    query = query.eq("tipo", filtros.tipo);
  }

  if (filtros?.natureza && filtros.natureza !== "todas") {
    query = query.eq("natureza", filtros.natureza);
  }

  if (filtros?.busca && filtros.busca.trim().length > 0) {
    const termo = filtros.busca.trim();
    query = query.or(
      `titulo.ilike.%${termo}%,subtitulo.ilike.%${termo}%,autor_nome.ilike.%${termo}%,descricao.ilike.%${termo}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao obter obras:", error);
    throw new Error(`Falha ao carregar acervo da biblioteca: ${error.message}`);
  }

  return (data as ObraDetalhada[]) || [];
}

/**
 * Obtém estatísticas quantitativas consolidadas do acervo do autor.
 */
export async function obterEstatisticasBiblioteca(): Promise<EstatisticasBiblioteca> {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  const { data, error } = await admin
    .from("v_biblioteca_estatisticas")
    .select("*")
    .eq("usuario_id", usuarioId)
    .maybeSingle();

  if (error) {
    console.error("Erro ao obter estatísticas da biblioteca:", error);
  }

  if (!data) {
    return {
      total_obras: 0,
      total_autorais: 0,
      total_influencias_externas: 0,
      total_no_cerebro: 0,
      total_paginas: 0,
      total_palavras: 0,
    };
  }

  return data as EstatisticasBiblioteca;
}

/**
 * Cadastra uma nova obra e sua primeira versão de arquivo de forma atômica.
 */
export async function cadastrarObra(dadosBrutos: CadastrarObraInput) {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  const validado = cadastrarObraSchema.parse(dadosBrutos);

  const { data, error } = await admin.rpc("cadastrar_obra_com_versao", {
    p_usuario_id: usuarioId,
    p_titulo: validado.titulo,
    p_subtitulo: validado.subtitulo || null,
    p_autor_nome: validado.autor_nome,
    p_tipo: validado.tipo,
    p_natureza: validado.natureza,
    p_ano_publicacao: validado.ano_publicacao || null,
    p_descricao: validado.descricao || null,
    p_participa_cerebro: validado.participa_cerebro,
    p_peso_autoral: validado.peso_autoral,
    p_arquivo_caminho: validado.arquivo_caminho,
    p_arquivo_nome_original: validado.arquivo_nome_original,
    p_arquivo_tamanho_bytes: validado.arquivo_tamanho_bytes,
    p_arquivo_mime_type: validado.arquivo_mime_type,
    p_hash_sha256: validado.hash_sha256,
    p_metadados: validado.metadados || {},
  });

  if (error) {
    console.error("Erro ao cadastrar obra via RPC:", error);
    throw new Error(`Falha ao registrar obra no catálogo: ${error.message}`);
  }

  // Atualiza os eixos canônicos e influências deliberadas
  const obraCriadaId = (data as any)?.id;
  if (obraCriadaId) {
    await admin
      .schema("biblioteca")
      .from("obras")
      .update({
        papel_fonte: validado.papel_fonte,
        participacao_cerebro: validado.participacao_cerebro,
        escopos_influencia: validado.escopos_influencia || [],
        intensidade_influencia: validado.intensidade_influencia || null,
      })
      .eq("id", obraCriadaId);
  }

  try {
    revalidatePath("/biblioteca");
    revalidatePath("/");
  } catch {
    // Ignorado em scripts fora do ciclo de vida de requisição HTTP do Next.js
  }

  return { sucesso: true, obra: data as ObraDetalhada };
}

/**
 * Exclui uma obra e seus arquivos do storage.
 */
export async function excluirObra(obraId: string) {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  // 1. Obter versões para limpar os arquivos do storage
  const { data: versoes } = await admin
    .schema("biblioteca")
    .from("versoes_obras")
    .select("arquivo_caminho")
    .eq("obra_id", obraId)
    .eq("usuario_id", usuarioId);

  if (versoes && versoes.length > 0) {
    const caminhos = versoes.map((v) => v.arquivo_caminho);
    await admin.storage.from("originais-biblioteca").remove(caminhos);
  }

  // 2. Excluir registro no banco (deleção em cascata remove versões e processamento)
  const { error } = await admin
    .schema("biblioteca")
    .from("obras")
    .delete()
    .eq("id", obraId)
    .eq("usuario_id", usuarioId);

  if (error) {
    console.error("Erro ao excluir obra:", error);
    throw new Error(`Falha ao remover obra: ${error.message}`);
  }

  try {
    revalidatePath("/biblioteca");
    revalidatePath("/");
  } catch {
    // Ignorado em scripts fora do ciclo de vida de requisição HTTP do Next.js
  }

  return { sucesso: true };
}

/**
 * Gera uma URL assinada temporária para download seguro do arquivo original.
 */
export async function obterUrlDownloadOriginal(arquivoCaminho: string): Promise<string> {
  const admin = criarClienteAdmin();

  const { data, error } = await admin.storage
    .from("originais-biblioteca")
    .createSignedUrl(arquivoCaminho, 3600); // Válida por 1 hora

  if (error || !data?.signedUrl) {
    throw new Error("Não foi possível gerar o link seguro para download do arquivo.");
  }

  return data.signedUrl;
}

/**
 * Obtém os detalhes completos de uma obra pelo seu ID.
 */
export async function obterObraPorId(obraId: string): Promise<{
  obra: ObraDetalhada | null;
  fragmentos: Array<{ id: string; indice_sequencial: number; conteudo_texto: string; total_tokens: number }>;
}> {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  const { data: obra, error } = await admin
    .from("v_obras_detalhadas")
    .select("*")
    .eq("id", obraId)
    .eq("usuario_id", usuarioId)
    .maybeSingle();

  if (error || !obra) {
    return { obra: null, fragmentos: [] };
  }

  // Buscar fragmentos processados se houver
  const { data: fragmentos } = await admin
    .schema("processamento")
    .from("fragmentos")
    .select("id, indice_sequencial, conteudo_texto, total_tokens")
    .eq("obra_id", obraId)
    .order("indice_sequencial", { ascending: true })
    .limit(50);

  return {
    obra: obra as ObraDetalhada,
    fragmentos: fragmentos || [],
  };
}

/**
 * Salva anotações pessoais do autor sobre a obra.
 */
export async function salvarAnotacoesObra(obraId: string, anotacoes: string) {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  const { data: obraExistente } = await admin
    .schema("biblioteca")
    .from("obras")
    .select("metadados")
    .eq("id", obraId)
    .eq("usuario_id", usuarioId)
    .single();

  const metadadosAtuais = (obraExistente?.metadados as Record<string, any>) || {};
  const novosMetadados = {
    ...metadadosAtuais,
    anotacoes_autor: anotacoes,
    anotacoes_atualizadas_em: new Date().toISOString(),
  };

  const { error } = await admin
    .schema("biblioteca")
    .from("obras")
    .update({ metadados: novosMetadados, atualizado_em: new Date().toISOString() })
    .eq("id", obraId)
    .eq("usuario_id", usuarioId);

  if (error) {
    throw new Error(`Falha ao salvar anotações: ${error.message}`);
  }

  try {
    revalidatePath(`/biblioteca/${obraId}`);
  } catch {}

  return { sucesso: true };
}

