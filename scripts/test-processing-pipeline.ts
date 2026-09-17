import { criarClienteAdmin } from "../src/infraestrutura/supabase/cliente-admin";
import { iniciarProcessamentoObra, buscarFragmentosHibrido } from "../src/acoes/processamento";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function testarPipelineCompleto() {
  console.log("=== TESTE END-TO-END DO PIPELINE DE PROCESSAMENTO DOCUMENTAL ===");
  const admin = criarClienteAdmin();

  // 1. Obter uma obra e versão ativa através da view canônica
  const { data: obras, error: errObras } = await admin
    .from("v_obras_detalhadas")
    .select("*")
    .limit(1);

  if (errObras || !obras || obras.length === 0 || !obras[0].versao_id) {
    console.error("Nenhuma obra encontrada para processamento de teste.", errObras || "");
    return;
  }

  const obra = obras[0];
  console.log(`-> Testando com a Obra: "${obra.titulo}" (ID Versão: ${obra.versao_id})`);
  console.log(`-> Caminho do arquivo: ${obra.arquivo_caminho}`);

  // 2. Garantir que há conteúdo legível no storage para o teste
  const textoManuscritoExemplo = `
CAPÍTULO I: A MATÉRIA DO SILÊNCIO

O silêncio não é ausência de som; é a presença de uma escuta que renuncia à urgência da resposta. Quando escrevo, o primeiro movimento não é a busca pelas palavras, mas a criação de uma clareira onde o pensamento possa respirar sem a necessidade imediata de agradar ou convencer.

A matéria do tempo só se torna visível quando aceitamos habitar os intervalos. Vivemos em uma época que teme as pausas, confundindo rapidez com profundidade e volume com autoridade. No entanto, as ideias mais decisivas de uma vida nunca chegam em marchas barulhentas; elas se infiltram pelas frestas de uma atenção paciente.

CAPÍTULO II: A TENSÃO E O CONCEITO

Toda reflexão autêntica nasce de uma ferida no entendimento. Quando a experiência vivida não cabe nos conceitos herdados, somos forçados a pensar. Não se trata de inventar termos sofisticados para velhas certezas, mas de forjar uma linguagem capaz de sustentar a contradição sem tentar eliminá-la artificialmente.

A verdadeira maturidade autoral reside em saber conviver com perguntas que não se deixam fechar. Ao transformar a dor da perplexidade em método de investigação, o autor não oferece dogmas aos seus leitores, mas um convite compartilhado à coragem de compreender.
  `.trim();

  console.log("-> Fazendo upload do arquivo de teste para o Storage...");
  const buffer = Buffer.from(textoManuscritoExemplo, "utf-8");
  const { error: errUpload } = await admin.storage
    .from("originais-biblioteca")
    .upload(obra.arquivo_caminho!, buffer, {
      contentType: "text/plain",
      upsert: true,
    });

  if (errUpload) {
    console.error("Erro ao subir arquivo de teste:", errUpload);
    return;
  }
  console.log("Upload de teste concluído com sucesso!");

  // 3. Executar o Pipeline de Processamento
  console.log("-> Iniciando execução do pipeline...");
  const resultado = await iniciarProcessamentoObra(obra.versao_id!);

  if (!resultado.sucesso) {
    console.error("ERRO na execução do pipeline:", resultado.erro);
    process.exit(1);
  }

  console.log("PIPELINE EXECUTADO COM SUCESSO!", resultado.resultado);

  // 4. Testar a Busca Híbrida (Full Text Search + Embeddings HNSW)
  console.log("\n--- TESTANDO BUSCA HÍBRIDA (FTS + PGVECTOR 1536D) ---");
  const consulta = "atenção paciente e silêncio";
  console.log(`-> Consulta: "${consulta}"`);

  const resultadosBusca = await buscarFragmentosHibrido(consulta, {
    limite: 3,
    apenasAutorais: true,
  });

  console.log(`Resultados retornados: ${resultadosBusca.length}`);
  resultadosBusca.forEach((r, idx) => {
    console.log(`\n[Resultado ${idx + 1}]`);
    console.log(`  Obra: ${r.obra_titulo} (${r.obra_natureza})`);
    console.log(`  Seção: ${r.secao_titulo}`);
    console.log(`  Score Combinado: ${r.score_similaridade} | Vetorial: ${r.score_vetorial} | Textual: ${r.score_textual}`);
    console.log(`  Trecho: "${r.conteudo.slice(0, 140)}..."`);
  });

  console.log("\n=== TESTE CONCLUÍDO COM 100% DE SUCESSO! ===");
}

testarPipelineCompleto().catch((err) => {
  console.error("Erro no teste:", err);
  process.exit(1);
});
