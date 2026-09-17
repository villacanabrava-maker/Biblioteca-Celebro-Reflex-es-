/**
 * Script de validação e teste para Taxonomia e Cérebro Autoral
 * Execução: npx tsx scripts/test-cerebro-taxonomia.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { criarClienteAdmin } from "../src/infraestrutura/supabase/cliente-admin";
import { obterDimensoesCerebro, obterResumoCerebro } from "../src/acoes/cerebro";
import { obterConceitos, cadastrarConceito } from "../src/acoes/taxonomia";

async function principal() {
  console.log("=== INICIANDO TESTE DO CÉREBRO AUTORAL & TAXONOMIA ===");

  const admin = criarClienteAdmin();

  // 1. Testar conexão com as tabelas e views do Cérebro
  console.log("\n1. Verificando dimensões canônicas (18)...");
  const dimensoes = await obterDimensoesCerebro();
  console.log(`Dimensões encontradas: ${dimensoes.length}`);
  if (dimensoes.length !== 18) {
    throw new Error(`Esperado 18 dimensões canônicas, obtido: ${dimensoes.length}`);
  }

  const planos = {
    conteudo: dimensoes.filter((d) => d.plano === "conteudo").length,
    metodo: dimensoes.filter((d) => d.plano === "metodo").length,
    expressao: dimensoes.filter((d) => d.plano === "expressao").length,
  };
  console.log(`Distribuição por planos: Conteúdo=${planos.conteudo}, Método=${planos.metodo}, Expressão=${planos.expressao}`);

  // 2. Testar métricas resumidas do Cérebro
  console.log("\n2. Verificando métricas resumidas do Cérebro...");
  const resumo = await obterResumoCerebro();
  console.log("Resumo:", JSON.stringify(resumo, null, 2));

  // 3. Testar cadastro e consulta de conceito na Taxonomia
  console.log("\n3. Testando Taxonomia Semântica...");
  const conceitosIniciais = await obterConceitos();
  console.log(`Conceitos existentes: ${conceitosIniciais.length}`);

  const termoTeste = `Tese Autoral de Teste ${Date.now().toString().slice(-4)}`;
  console.log(`Cadastrando conceito de teste: "${termoTeste}"...`);

  const resCadastro = await cadastrarConceito({
    termoPreferencial: termoTeste,
    definicao: "Definição epistemológica de teste para validação ontológica.",
    dominio: "intelectual",
    sinonimos: ["Conceito Teste A", "Variação B"],
  });

  console.log("Conceito cadastrado com sucesso! ID:", resCadastro.conceito.id);

  const conceitosApos = await obterConceitos();
  const encontrado = conceitosApos.find((c) => c.id === resCadastro.conceito.id);
  if (!encontrado) {
    throw new Error("Conceito cadastrado não foi encontrado na view v_taxonomia_conceitos!");
  }
  console.log(`Conceito validado na view com ${encontrado.termos_sinonimos.length} sinônimos.`);

  // 4. Limpar conceito de teste
  console.log("\n4. Limpando conceito de teste...");
  await admin.schema("taxonomia").from("termos").delete().eq("conceito_id", resCadastro.conceito.id);
  await admin.schema("taxonomia").from("conceitos").delete().eq("id", resCadastro.conceito.id);
  console.log("Limpeza concluída com sucesso.");

  console.log("\n=== TESTE FINALIZADO COM 100% DE SUCESSO! ===");
}

principal().catch((err) => {
  console.error("FALHA NO TESTE:", err);
  process.exit(1);
});
