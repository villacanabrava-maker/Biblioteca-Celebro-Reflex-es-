"use server";

import { revalidatePath } from "next/cache";
import { criarClienteAdmin } from "@/infraestrutura/supabase/cliente-admin";
import { obterUsuarioAtualId } from "@/infraestrutura/auth/usuario-atual";

import type { ConceitoTaxonomico, ArestaGrafoTaxonomia } from "@/tipos/taxonomia";

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
 * Obtém o grafo semântico completo de nós e arestas da taxonomia.
 */
export async function obterGrafoTaxonomia(): Promise<ArestaGrafoTaxonomia[]> {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  const { data, error } = await admin
    .from("v_taxonomia_grafo")
    .select("*")
    .eq("usuario_id", usuarioId);

  if (error) {
    console.error("Erro ao listar grafo da taxonomia:", error);
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

  try {
    revalidatePath("/taxonomia");
    revalidatePath("/cerebro");
  } catch {
    // Ignorado fora de requisição HTTP
  }

  return { sucesso: true, conceito };
}
