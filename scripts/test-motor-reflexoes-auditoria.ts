/**
 * Script de teste automatizado ponta a ponta para Motor de Reflexões e Auditor Crítico
 * Execução: npx tsx scripts/test-motor-reflexoes-auditoria.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { criarClienteAdmin } from "../src/infraestrutura/supabase/cliente-admin";
import { obterUsuarioAtualId } from "../src/infraestrutura/auth/usuario-atual";
import { gerarPlanoReflexao } from "../src/dominios/reflexoes/planejador-reflexao";
import { redigirReflexao } from "../src/dominios/reflexoes/redator-reflexao";
import { auditarVersaoReflexao } from "../src/dominios/auditoria/auditor-independente";
import { obterReflexaoCompleta } from "../src/acoes/reflexoes";

async function principal() {
  console.log("=== INICIANDO TESTE INTEGRADO DO MOTOR DE REFLEXÕES & AUDITOR ===");

  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  // 1. Criar Entrada de Reflexão de Teste
  console.log("\n1. Criando entrada de reflexão...");
  const { data: entrada, error: errEntrada } = await admin
    .schema("reflexoes")
    .from("entradas")
    .insert({
      usuario_id: usuarioId,
      titulo: `Ensaio sobre a Densidade do Pensamento ${Date.now().toString().slice(-4)}`,
      tema_central: "Autonomia reflexiva frente à automação de sínteses",
      provocacao_inicial:
        "Se delegamos toda a síntese para a máquina, o que resta do processo de metabolização das ideias que funda a verdadeira autoria?",
      formato_desejado: "ensaio",
      objetivo_comunicativo: "Provocação epistêmica profunda",
      publico_alvo: "Pensadores contemporâneos",
      estado: "criada",
    })
    .select()
    .single();

  if (errEntrada || !entrada) {
    throw new Error(`Falha ao criar entrada de teste: ${errEntrada?.message}`);
  }
  console.log(`Entrada criada com ID: ${entrada.id}`);

  try {
    // 2. Executar Planejador Cognitivo (OpenAI gpt-4o com Zod)
    console.log("\n2. Executando Planejador Cognitivo com IA...");
    const plano = await gerarPlanoReflexao({
      entradaId: entrada.id,
      usuarioId,
      titulo: entrada.titulo,
      temaCentral: entrada.tema_central,
      provocacaoInicial: entrada.provocacao_inicial,
      formatoDesejado: entrada.formato_desejado,
    });

    console.log("Plano gerado com sucesso!");
    console.log(`Tese Central: "${plano.tese_central}"`);
    console.log(`Total de Movimentos Argumentativos: ${plano.movimentos_argumentativos.length}`);
    console.log(`Conceitos Mobilizados: ${plano.conceitos_mobilizados.join(", ") || "Nenhum"}`);

    // 3. Executar Redator Autoral (OpenAI gpt-4o com Zod)
    console.log("\n3. Executando Redator Autoral...");
    const versao = await redigirReflexao({
      entradaId: entrada.id,
      planoId: plano.id,
      usuarioId,
    });

    console.log("Versão redigida com sucesso!");
    console.log(`Título Gerado: "${versao.titulo_gerado}"`);
    console.log(`Total de Palavras: ${versao.total_palavras}`);
    console.log(`Prévia do Texto:\n${versao.conteudo_markdown.slice(0, 300)}...`);

    // 4. Executar Auditor Crítico Independente (OpenAI gpt-4o)
    console.log("\n4. Executando Auditor Crítico Independente...");
    const auditoria = await auditarVersaoReflexao({
      versaoId: versao.id,
      usuarioId,
    });

    console.log("Auditoria concluída com sucesso!");
    console.log(`Veredito: ${auditoria.veredito.toUpperCase()}`);
    console.log(`Pontuação Geral: ${Math.round(auditoria.pontuacao_geral * 100)}%`);
    console.log(`Fidelidade Ontológica: ${Math.round(auditoria.pontuacao_fidelidade_ontologica * 100)}%`);
    console.log(`Fidelidade Metodológica: ${Math.round(auditoria.pontuacao_fidelidade_metodologica * 100)}%`);
    console.log(`Precisão de Evidências: ${Math.round(auditoria.pontuacao_precisao_evidencias * 100)}%`);
    console.log(`Expressão & Estilo: ${Math.round(auditoria.pontuacao_expressao_estilo * 100)}%`);
    console.log(`Anti-regras: ${Math.round(auditoria.pontuacao_anti_regras * 100)}%`);

    // 5. Validar Consulta Completa via Server Action
    console.log("\n5. Validando consulta da reflexão completa...");
    const completa = await obterReflexaoCompleta(entrada.id);
    if (!completa.entrada || !completa.plano || completa.versoes.length === 0) {
      throw new Error("Falha na consulta completa da reflexão agregada.");
    }
    console.log(`Consulta completa validada com ${completa.versoes.length} versão(ões) e citações vinculadas.`);

  } finally {
    // 6. Limpeza dos dados de teste
    console.log("\n6. Limpando dados de teste do banco...");
    await admin.schema("reflexoes").from("entradas").delete().eq("id", entrada.id);
    console.log("Dados de teste removidos.");
  }

  console.log("\n=== TESTE DO MOTOR DE REFLEXÕES E AUDITOR CONCLUÍDO COM 100% DE SUCESSO! ===");
}

principal().catch((err) => {
  console.error("ERRO NO TESTE:", err);
  process.exit(1);
});
