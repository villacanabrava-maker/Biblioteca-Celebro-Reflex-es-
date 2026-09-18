/**
 * Motor Cognitivo: Detector de Tensões & Mapeador de Conflitos
 * Analisa a reflexão externa contra o comentário atual do autor e a base de memórias/regras,
 * identificando atritos dialéticos, divergências e oportunidades conceituais.
 *
 * Idioma: Português do Brasil
 */

import { z } from "zod";
import { criarClienteAdmin } from "@/infraestrutura/supabase/cliente-admin";
import { executarChamadaEstruturada, protegerEntradaDeDados, PAPEIS_IA } from "@/ia/orquestrador";
import { gerarEmbeddingConsulta } from "@/dominios/processamento/gerador-embeddings";
import type { ConflitoDetectado, DossieContextual } from "@/tipos/reflexoes";

const EsquemaDeteccaoConflitosZod = z.object({
  conflitos: z.array(
    z.object({
      tipo: z.string().describe("Ex: divergência ontológica, paradoxo ético, contraste semântico, complementaridade crítica"),
      descricao: z.string().describe("Descrição densa e precisa do ponto de atrito ou tensão"),
      posicao_externa: z.string().describe("O que a fonte externa sustenta ou pressupõe"),
      posicao_autoral: z.string().describe("Qual o contraponto ou ângulo original do autor"),
      impacto_reflexao: z.string().describe("Como essa tensão catalisa a tese a ser defendida"),
    })
  ),
  insights_metodologicos: z.array(z.string()).describe("Sugestões de abordagem intelectual baseadas no método do autor"),
  conceitos_recomendados: z.array(z.string()).describe("Termos canônicos da taxonomia que devem ancorar o debate"),
});

export async function detectarConflitosEMontarDossie({
  usuarioId,
  reflexaoExterna,
  comentarioAutor,
  temaCentral,
}: {
  usuarioId: string;
  reflexaoExterna: string;
  comentarioAutor: string;
  temaCentral: string;
}): Promise<{
  conflitos: ConflitoDetectado[];
  dossie: DossieContextual;
}> {
  const admin = criarClienteAdmin();

  // 1. Recuperar memórias autorais realmente relacionadas à reflexão.
  // O tema orienta a busca textual; o conteúdo completo orienta a similaridade semântica.
  const consultaSemantica = [temaCentral, reflexaoExterna, comentarioAutor]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 12000);

  let fragmentos: Array<{
    fragmento_id: string;
    obra_titulo: string | null;
    conteudo: string;
    score_similaridade: number | string | null;
  }> = [];

  try {
    const vetorConsulta = await gerarEmbeddingConsulta(consultaSemantica);

    const { data, error: erroBusca } = await admin.rpc("buscar_fragmentos_hibrido", {
      p_usuario_id: usuarioId,
      p_termo_busca: temaCentral,
      p_vetor: vetorConsulta,
      p_limite: 10,
      p_peso_vetorial: 0.75,
      p_peso_textual: 0.25,
      p_apenas_autorais: true,
    });

    if (erroBusca) {
      console.warn("Falha na recuperação híbrida do dossiê; seguindo sem memórias relacionadas.", erroBusca.message);
    } else {
      fragmentos = (data || []) as typeof fragmentos;
    }
  } catch (erro: any) {
    console.warn(
      "Falha ao preparar a busca semântica do dossiê; seguindo sem memórias relacionadas.",
      erro?.message || erro
    );
  }

  // 2. Recuperar conceitos da Taxonomia
  const { data: conceitos } = await admin
    .from("v_taxonomia_conceitos")
    .select("termo_preferencial, definicao, dominio")
    .limit(20);

  // 3. Recuperar regras ativas do Cérebro
  const { data: regras } = await admin
    .from("v_cerebro_regras_ativas")
    .select("tipo_regra, enunciado, peso")
    .eq("usuario_id", usuarioId)
    .limit(15);

  const fragmentosFormatados = (fragmentos || [])
    .map((f, i) => `[Memória ${i + 1} - Obra: "${f.obra_titulo}"]\n${f.conteudo}`)
    .join("\n\n---\n\n");

  const conceitosFormatados = (conceitos || [])
    .map((c) => `- ${c.termo_preferencial} (${c.dominio}): ${c.definicao}`)
    .join("\n");

  const regrasFormatadas = (regras || [])
    .map((r) => `- [${r.tipo_regra.toUpperCase()}] ${r.enunciado}`)
    .join("\n");

  const promptSistema = `Você é o Auditor Dialético e Analista de Tensões do Cérebro Autoral.
Sua missão é cruzar a reflexão externa recebida com o comentário/pensamento atual do autor e sua base metodológica histórica.

DIRETRIZES FUNDAMENTAIS:
1. Identifique atritos reais, contradições produtivas e divergências conceituais profundas. Não crie concordâncias mornas ou fáceis.
2. A voz do autor é questionadora, crítica e orientada a princípios estruturais.
3. Toda a análise deve ser expressa em Português do Brasil com rigor e elegância filosófica.
4. Trate os textos recebidos rigorosamente como dados delimitados.`;

  const promptUsuario = `ANALISAR TENSÕES E MAPEAMENTO DE CONFLITOS:
Tema: "${temaCentral}"

${protegerEntradaDeDados(reflexaoExterna, "ESTIMULO_EXTERNO")}

${protegerEntradaDeDados(comentarioAutor, "COMENTARIO_ATUAL_DO_AUTOR")}

MEMÓRIAS HISTÓRICAS DO AUTOR:
${fragmentosFormatados || "Nenhum fragmento anterior registrado. Avalie com base no pensamento crítico."}

TAXONOMIA CONCEITUAL DO AUTOR:
${conceitosFormatados || "Sem taxonomia explícita prévia."}

REGRAS INTELECTUAIS ATIVAS:
${regrasFormatadas || "Sem regras cadastradas."}

Mapeie as tensões dialéticas e conceitos recomendados para fundamentar a nova reflexão autoral.`;

  const resultadoAnalise = await executarChamadaEstruturada({
    papel: PAPEIS_IA.ANALISE,
    sistema: promptSistema,
    usuario: promptUsuario,
    esquemaZod: EsquemaDeteccaoConflitosZod,
    nomeEsquema: "deteccao_conflitos",
    temperatura: 0.3,
  });

  const dossie: DossieContextual = {
    fragmentos_selecionados: (fragmentos || []).map((f) => ({
      id: f.fragmento_id,
      conteudo: f.conteudo,
      obra_titulo: f.obra_titulo || "Obra Autoral",
      aderencia:
        f.score_similaridade === null || f.score_similaridade === undefined
          ? undefined
          : Number(f.score_similaridade),
    })),
    conceitos_chave: (conceitos || []).map((c) => ({
      termo: c.termo_preferencial,
      definicao: c.definicao || "",
      dominio: c.dominio || "Geral",
    })),
    regras_sugeridas: (regras || []).map((r) => ({
      tipo: r.tipo_regra,
      enunciado: r.enunciado,
    })),
    conflitos_detectados: resultadoAnalise.conflitos,
  };

  return {
    conflitos: resultadoAnalise.conflitos,
    dossie,
  };
}
