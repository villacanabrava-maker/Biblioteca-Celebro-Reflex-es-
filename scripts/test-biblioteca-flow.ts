import { cadastrarObra, obterObras, obterEstatisticasBiblioteca } from "../src/acoes/biblioteca";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function testarFluxoBiblioteca() {
  console.log("--- TESTANDO FLUXO DA BIBLIOTECA ---");

  // 1. Estatísticas iniciais
  const statsIniciais = await obterEstatisticasBiblioteca();
  console.log("Estatísticas Iniciais:", statsIniciais);

  // 2. Cadastrar Obra 1: Núcleo Autoral
  console.log("-> Cadastrando Obra do Núcleo Autoral...");
  const obraAutoral = await cadastrarObra({
    titulo: "A Poética do Silêncio e a Matéria do Tempo",
    subtitulo: "Tratado sobre a atenção reflexiva e a escuta interior",
    autor_nome: "Autor",
    tipo: "livro",
    natureza: "autoral",
    papel_fonte: "autoral",
    participacao_cerebro: "nucleo_autoral",
    ano_publicacao: 2024,
    descricao: "Ensaio filosófico e poético sobre os intervalos entre pensamento e fala.",
    participa_cerebro: true,
    peso_autoral: 1.0,
    arquivo_caminho: "fa373fbb-3024-45ce-be24-268dc228a6d0/teste/a-poetica-do-silencio.pdf",
    arquivo_nome_original: "a-poetica-do-silencio.pdf",
    arquivo_tamanho_bytes: 2048500,
    arquivo_mime_type: "application/pdf",
    hash_sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    metadados: { formato: "PDF", paginas_estimadas: 180 },
  });
  console.log("Obra Autoral cadastrada:", obraAutoral.obra.id, obraAutoral.obra.titulo);

  // 3. Cadastrar Obra 2: Influência Externa Aprovada
  console.log("-> Cadastrando Obra de Influência Externa...");
  const obraExterna = await cadastrarObra({
    titulo: "A Condição Humana",
    subtitulo: "Ação, labor e obra na esfera pública",
    autor_nome: "Hannah Arendt",
    tipo: "livro",
    natureza: "externa_aprovada",
    papel_fonte: "externa",
    participacao_cerebro: "influencia_deliberada",
    escopos_influencia: ["filosofia_politica", "esfera_publica"],
    intensidade_influencia: "forte",
    ano_publicacao: 1958,
    descricao: "Influência fundamental sobre ação política, narrativa e natalidade.",
    participa_cerebro: true,
    peso_autoral: 0.75,
    arquivo_caminho: "fa373fbb-3024-45ce-be24-268dc228a6d0/teste/condicao-humana.pdf",
    arquivo_nome_original: "condicao-humana.pdf",
    arquivo_tamanho_bytes: 4194304,
    arquivo_mime_type: "application/pdf",
    hash_sha256: "cca994498fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855aa".slice(0, 64),
    metadados: { formato: "PDF", paginas_estimadas: 350 },
  });
  console.log("Obra Externa cadastrada:", obraExterna.obra.id, obraExterna.obra.titulo);

  // 4. Consultar listagem geral
  const todasObras = await obterObras();
  console.log(`Total de obras na listagem: ${todasObras.length}`);
  todasObras.forEach((o) => {
    console.log(`  - [${o.natureza}] ${o.titulo} (${o.tipo}) | Status: ${o.estado_processamento}`);
  });

  // 5. Consultar apenas Núcleo Autoral
  const apenasAutorais = await obterObras({ natureza: "autoral" });
  console.log(`Obras do Núcleo Autoral filtradas: ${apenasAutorais.length}`);

  // 6. Consultar Estatísticas Atualizadas
  const statsFinais = await obterEstatisticasBiblioteca();
  console.log("Estatísticas Finais:", statsFinais);

  console.log("--- TESTE CONCLUÍDO COM SUCESSO! ---");
}

testarFluxoBiblioteca().catch((err) => {
  console.error("Erro no teste da biblioteca:", err);
  process.exit(1);
});
