"use server";

import { revalidatePath } from "next/cache";
import { criarClienteAdmin } from "@/infraestrutura/supabase/cliente-admin";
import { obterUsuarioAtualId } from "@/infraestrutura/auth/usuario-atual";
import { cadastrarObraSchema, type CadastrarObraInput } from "@/lib/validacoes/biblioteca";
import type { ObraDetalhada, EstatisticasBiblioteca } from "@/tipos/biblioteca";
import { transcreverAudioBuffer } from "@/dominios/audio/transcritor";

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
 * Transcreve um áudio previamente enviado ao bucket privado da Biblioteca.
 * O objeto original permanece preservado e será ligado à obra após o cadastro.
 */
export async function transcreverAudioBibliotecaTemporario({
  storageCaminho,
  arquivoNomeOriginal,
  arquivoMimeType,
}: {
  storageCaminho: string;
  arquivoNomeOriginal: string;
  arquivoMimeType: string;
}) {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  if (!storageCaminho.startsWith(`${usuarioId}/`)) {
    throw new Error("Áudio inválido para o usuário autenticado.");
  }

  const { data, error } = await admin.storage
    .from("originais-biblioteca")
    .download(storageCaminho);

  if (error || !data) {
    throw new Error(`Não foi possível ler o áudio enviado: ${error?.message || "arquivo indisponível"}`);
  }

  const buffer = Buffer.from(await data.arrayBuffer());

  return transcreverAudioBuffer({
    buffer,
    nomeArquivo: arquivoNomeOriginal,
    mimeType: arquivoMimeType || "audio/webm",
    prompt:
      "Transcreva fielmente esta gravação destinada à Biblioteca do autor. Preserve nomes próprios, termos conceituais, hesitações relevantes e pontuação natural. Não resuma e não acrescente conteúdo.",
  });
}

/**
 * Registra a fonte original de uma obra já cadastrada.
 * Usado para preservar áudio original enquanto a versão processável é textual.
 */
export async function registrarFonteOriginalObra({
  obraId,
  versaoObraId,
  tipoFonte,
  storageCaminho,
  arquivoNomeOriginal,
  arquivoMimeType,
  arquivoTamanhoBytes,
  hashSha256,
  conteudoExtraido,
  conteudoConfirmado,
  metadados = {},
}: {
  obraId: string;
  versaoObraId?: string | null;
  tipoFonte: "arquivo" | "audio" | "texto" | "link";
  storageCaminho?: string | null;
  arquivoNomeOriginal?: string | null;
  arquivoMimeType?: string | null;
  arquivoTamanhoBytes?: number | null;
  hashSha256?: string | null;
  conteudoExtraido?: string | null;
  conteudoConfirmado?: string | null;
  metadados?: Record<string, unknown>;
}) {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  if (storageCaminho && !storageCaminho.startsWith(`${usuarioId}/`)) {
    throw new Error("Caminho da fonte original inválido.");
  }

  const { data: obra, error: erroObra } = await admin
    .schema("biblioteca")
    .from("obras")
    .select("id")
    .eq("id", obraId)
    .eq("usuario_id", usuarioId)
    .maybeSingle();

  if (erroObra || !obra) {
    throw new Error("Obra não encontrada para registrar a fonte original.");
  }

  if (versaoObraId) {
    const { data: versao, error: erroVersao } = await admin
      .schema("biblioteca")
      .from("versoes_obras")
      .select("id")
      .eq("id", versaoObraId)
      .eq("obra_id", obraId)
      .eq("usuario_id", usuarioId)
      .maybeSingle();

    if (erroVersao || !versao) {
      throw new Error("Versão da obra inválida para a fonte original.");
    }
  }

  const { data, error } = await admin
    .schema("biblioteca")
    .from("fontes_obras")
    .insert({
      obra_id: obraId,
      versao_obra_id: versaoObraId || null,
      usuario_id: usuarioId,
      tipo_fonte: tipoFonte,
      storage_bucket: storageCaminho ? "originais-biblioteca" : null,
      storage_caminho: storageCaminho || null,
      arquivo_nome_original: arquivoNomeOriginal || null,
      arquivo_mime_type: arquivoMimeType || null,
      arquivo_tamanho_bytes: arquivoTamanhoBytes ?? null,
      hash_sha256: hashSha256 || null,
      conteudo_extraido: conteudoExtraido || null,
      conteudo_confirmado: conteudoConfirmado || null,
      metadados,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Falha ao registrar a fonte original: ${error?.message || "erro desconhecido"}`);
  }

  return { sucesso: true, fonteId: data.id as string };
}

/**
 * Remove objetos temporários da Biblioteca pertencentes ao usuário autenticado.
 * É uma operação compensatória para fluxos interrompidos antes do cadastro final.
 */
export async function removerArquivosTemporariosBiblioteca(caminhos: string[]) {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  const seguros = Array.from(new Set(caminhos))
    .filter(Boolean)
    .filter((caminho) => caminho.startsWith(`${usuarioId}/`));

  if (!seguros.length) return { sucesso: true };

  const { error } = await admin.storage.from("originais-biblioteca").remove(seguros);
  if (error) {
    console.warn("Falha ao remover arquivos temporários da Biblioteca:", error.message);
    return { sucesso: false, erro: error.message };
  }

  return { sucesso: true };
}

/**
 * Exclui uma obra e seus arquivos do storage.
 */
export async function excluirObra(obraId: string) {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  // 1. Obter versões para limpar os arquivos do storage
  const [{ data: versoes }, { data: fontes }] = await Promise.all([
    admin
      .schema("biblioteca")
      .from("versoes_obras")
      .select("arquivo_caminho")
      .eq("obra_id", obraId)
      .eq("usuario_id", usuarioId),
    admin
      .schema("biblioteca")
      .from("fontes_obras")
      .select("storage_caminho")
      .eq("obra_id", obraId)
      .eq("usuario_id", usuarioId),
  ]);

  const caminhos = Array.from(
    new Set([
      ...(versoes || []).map((v) => v.arquivo_caminho).filter(Boolean),
      ...(fontes || []).map((f) => f.storage_caminho).filter(Boolean),
    ])
  );

  if (caminhos.length > 0) {
    await admin.storage.from("originais-biblioteca").remove(caminhos as string[]);
  }

  // 2. Excluir registro no banco (deleção em cascata remove versões, fontes e processamento)
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
export async function obterUrlDownloadOriginal(
  arquivoCaminho: string,
  titulo?: string,
  arquivoNomeOriginal?: string | null
): Promise<string> {
  const admin = criarClienteAdmin();

  const { data, error } = await admin.storage
    .from("originais-biblioteca")
    .createSignedUrl(arquivoCaminho, 3600); // Válida por 1 hora

  if (error || !data?.signedUrl) {
    throw new Error("Não foi possível gerar o link seguro para download do arquivo.");
  }

  const nomeReferencia = arquivoNomeOriginal || arquivoCaminho.split("/").pop() || "arquivo";
  const extensao = nomeReferencia.includes(".")
    ? `.${nomeReferencia.split(".").pop()}`
    : "";
  const baseSegura = (titulo || nomeReferencia.replace(/\.[^/.]+$/, "") || "arquivo")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 _.-]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 120) || "arquivo";

  const urlDownload = new URL(data.signedUrl);
  urlDownload.searchParams.set("download", `${baseSegura}${extensao}`);

  return urlDownload.toString();
}

export interface FragmentoVisual {
  id: string;
  indice_sequencial: number;
  conteudo_texto: string;
  total_tokens: number;
  total_palavras?: number;
  secao_id?: string | null;
  secao_titulo?: string;
}

export interface SecaoVisual {
  id: string;
  ordem: number;
  nivel: number;
  titulo: string;
  tipo_secao: string;
}

/**
 * Obtém os detalhes completos de uma obra pelo seu ID, incluindo seções e fragmentos processados.
 */
export async function obterObraPorId(obraId: string): Promise<{
  obra: ObraDetalhada | null;
  fragmentos: FragmentoVisual[];
  secoes: SecaoVisual[];
  documentoProcessado: {
    id: string;
    total_secoes: number;
    total_fragmentos: number;
    total_palavras: number;
    total_tokens_estimado: number;
    estado_publicacao: string;
  } | null;
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
    return { obra: null, fragmentos: [], secoes: [], documentoProcessado: null };
  }

  // Localizar o documento processado associado à versão da obra
  let docProc: any = null;
  if (obra.versao_id) {
    const { data: dp } = await admin
      .schema("processamento")
      .from("documentos_processados")
      .select("id, total_secoes, total_fragmentos, total_palavras, total_tokens_estimado, estado_publicacao")
      .eq("versao_obra_id", obra.versao_id)
      .maybeSingle();
    docProc = dp;
  }

  // Se não achou pela versao_id atual, tenta achar pelas unidades de conhecimento vinculadas à obra
  if (!docProc) {
    const { data: unidade } = await admin
      .schema("processamento")
      .from("unidades_conhecimento")
      .select("versao_obra_id")
      .eq("obra_id", obraId)
      .limit(1)
      .maybeSingle();

    if (unidade?.versao_obra_id) {
      const { data: dp } = await admin
        .schema("processamento")
        .from("documentos_processados")
        .select("id, total_secoes, total_fragmentos, total_palavras, total_tokens_estimado, estado_publicacao")
        .eq("versao_obra_id", unidade.versao_obra_id)
        .maybeSingle();
      docProc = dp;
    }
  }

  if (!docProc) {
    return { obra: obra as ObraDetalhada, fragmentos: [], secoes: [], documentoProcessado: null };
  }

  // 1. Buscar Seções estruturais
  const { data: secoesDb } = await admin
    .schema("processamento")
    .from("secoes")
    .select("id, ordem, nivel, titulo, tipo_secao")
    .eq("documento_processado_id", docProc.id)
    .order("ordem", { ascending: true });

  const mapaSecoes = new Map<string, string>();
  const secoes: SecaoVisual[] = (secoesDb || []).map((s) => {
    mapaSecoes.set(s.id, s.titulo);
    return {
      id: s.id,
      ordem: s.ordem,
      nivel: s.nivel,
      titulo: s.titulo,
      tipo_secao: s.tipo_secao,
    };
  });

  // 2. Buscar Fragmentos
  const { data: fragsDb } = await admin
    .schema("processamento")
    .from("fragmentos")
    .select("id, ordem, conteudo, total_palavras, total_tokens_estimado, secao_id")
    .eq("documento_processado_id", docProc.id)
    .order("ordem", { ascending: true });

  const fragmentos: FragmentoVisual[] = (fragsDb || []).map((f) => ({
    id: f.id,
    indice_sequencial: f.ordem,
    conteudo_texto: f.conteudo,
    total_tokens: f.total_tokens_estimado || Math.ceil(f.conteudo.length / 3.8),
    total_palavras: f.total_palavras,
    secao_id: f.secao_id,
    secao_titulo: f.secao_id ? mapaSecoes.get(f.secao_id) || "Seção" : "Geral",
  }));

  return {
    obra: obra as ObraDetalhada,
    fragmentos,
    secoes,
    documentoProcessado: docProc,
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

