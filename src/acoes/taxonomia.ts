"use server";

import { revalidatePath } from "next/cache";
import { criarClienteAdmin } from "@/infraestrutura/supabase/cliente-admin";
import { obterUsuarioAtualId } from "@/infraestrutura/auth/usuario-atual";
import type { ConceitoTaxonomico, ArestaGrafoTaxonomia } from "@/tipos/taxonomia";

/**
 * Obtém todos os conceitos canônicos com sinônimos e total de ocorrências.
 */
export async function obterConceitos(filtroDominio?: string): Promise<ConceitoTaxonomico[]> {
  const admin = criarClienteAdmin();

  let query = admin
    .from("v_taxonomia_conceitos")
    .select("*")
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
  const admin = criarClienteAdmin();

  const { data, error } = await admin
    .from("v_taxonomia_grafo")
    .select("*");

  if (error) {
    console.error("Erro ao listar grafo da taxonomia:", error);
    return [];
  }

  return (data as ArestaGrafoTaxonomia[]) || [];
}

/**
 * Cadastra um novo conceito ontológico com termo preferencial e domínio.
 */
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
  const admin = criarClienteAdmin();

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

  const codigo = termoPreferencial
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  // 2. Inserir conceito
  const { data: conceito, error: errConceito } = await admin
    .schema("taxonomia")
    .from("conceitos")
    .insert({
      versao_taxonomia_id: versao.id,
      codigo,
      termo_preferencial: termoPreferencial.trim(),
      definicao: definicao.trim(),
      dominio,
      estado: "ativo",
    })
    .select()
    .single();

  if (errConceito || !conceito) {
    throw new Error(`Falha ao cadastrar conceito: ${errConceito?.message}`);
  }

  // 3. Inserir termo preferencial
  await admin
    .schema("taxonomia")
    .from("termos")
    .insert({
      conceito_id: conceito.id,
      termo: termoPreferencial.trim(),
      termo_normalizado: termoPreferencial.toLowerCase().trim(),
      tipo: "preferencial",
    });

  // 4. Inserir sinônimos adicionais
  for (const sin of sinonimos) {
    if (sin.trim()) {
      await admin
        .schema("taxonomia")
        .from("termos")
        .insert({
          conceito_id: conceito.id,
          termo: sin.trim(),
          termo_normalizado: sin.toLowerCase().trim(),
          tipo: "sinonimo",
        });
    }
  }

  try {
    revalidatePath("/taxonomia");
    revalidatePath("/cerebro");
  } catch {
    // Ignorado fora de requisição HTTP
  }

  return { sucesso: true, conceito };
}
