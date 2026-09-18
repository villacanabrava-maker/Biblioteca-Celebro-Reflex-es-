import { criarClienteAdmin } from "@/infraestrutura/supabase/cliente-admin";
import {
  analisarFontesParaTaxonomia,
  gerarCodigoTaxonomia,
  normalizarTermoTaxonomia,
  type ConceitoExistenteTaxonomia,
  type ConceitoTaxonomicoValidado,
  type FonteTaxonomica,
} from "./motor-taxonomico";
import type { DominioTaxonomico } from "@/tipos/taxonomia";

type TipoOrigem = "documento" | "reflexao";

interface ResultadoAplicacaoTaxonomia {
  sucesso: true;
  reutilizada: boolean;
  totalConceitosPropostos: number;
  totalConceitosReutilizados: number;
  conceitosIds: string[];
}

async function obterConceitosExistentes(
  usuarioId: string
): Promise<ConceitoExistenteTaxonomia[]> {
  const admin = criarClienteAdmin();
  const { data, error } = await admin
    .schema("taxonomia")
    .from("conceitos")
    .select("id, codigo, termo_preferencial, definicao, dominio, estado")
    .eq("usuario_id", usuarioId);

  if (error) {
    throw new Error(`Falha ao carregar conceitos existentes: ${error.message}`);
  }

  return ((data || []) as any[]).map((conceito) => ({
    id: conceito.id,
    codigo: conceito.codigo,
    termo_preferencial: conceito.termo_preferencial,
    definicao: conceito.definicao,
    dominio: conceito.dominio as DominioTaxonomico,
    estado: conceito.estado,
  }));
}

async function obterVersaoTaxonomiaAtiva() {
  const admin = criarClienteAdmin();
  const { data, error } = await admin
    .schema("taxonomia")
    .from("versoes")
    .select("id")
    .eq("estado", "ativa")
    .order("ativado_em", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error("Nenhuma versão ativa da Taxonomia está disponível.");
  }

  return data.id as string;
}

async function prepararRegistroAnalise({
  usuarioId,
  tipoOrigem,
  documentoProcessadoId,
  versaoReflexaoId,
  forcar,
}: {
  usuarioId: string;
  tipoOrigem: TipoOrigem;
  documentoProcessadoId?: string;
  versaoReflexaoId?: string;
  forcar: boolean;
}) {
  const admin = criarClienteAdmin();
  let query = admin
    .schema("taxonomia")
    .from("analises")
    .select("*")
    .eq("usuario_id", usuarioId)
    .eq("tipo_origem", tipoOrigem);

  query =
    tipoOrigem === "documento"
      ? query.eq("documento_processado_id", documentoProcessadoId!)
      : query.eq("versao_reflexao_id", versaoReflexaoId!);

  const { data: existente, error: erroBusca } = await query.maybeSingle();

  if (erroBusca) {
    throw new Error(`Falha ao consultar análise taxonômica: ${erroBusca.message}`);
  }

  if (existente?.estado === "concluida" && !forcar) {
    return { analise: existente, reutilizar: true };
  }

  if (existente) {
    const { data: atualizada, error } = await admin
      .schema("taxonomia")
      .from("analises")
      .update({
        estado: "em_execucao",
        erro_mensagem: null,
        resultado: {},
        total_conceitos_propostos: 0,
        total_conceitos_reutilizados: 0,
        atualizado_em: new Date().toISOString(),
        concluido_em: null,
      })
      .eq("id", existente.id)
      .eq("usuario_id", usuarioId)
      .select("*")
      .single();

    if (error || !atualizada) {
      throw new Error(`Falha ao reiniciar análise taxonômica: ${error?.message}`);
    }

    return { analise: atualizada, reutilizar: false };
  }

  const { data: criada, error } = await admin
    .schema("taxonomia")
    .from("analises")
    .insert({
      usuario_id: usuarioId,
      tipo_origem: tipoOrigem,
      documento_processado_id: documentoProcessadoId || null,
      versao_reflexao_id: versaoReflexaoId || null,
      pipeline_versao: "taxonomia_v1",
      estado: "em_execucao",
    })
    .select("*")
    .single();

  if (error || !criada) {
    throw new Error(`Falha ao iniciar análise taxonômica: ${error?.message}`);
  }

  return { analise: criada, reutilizar: false };
}

async function concluirAnalise({
  analiseId,
  usuarioId,
  totalPropostos,
  totalReutilizados,
  conceitosIds,
}: {
  analiseId: string;
  usuarioId: string;
  totalPropostos: number;
  totalReutilizados: number;
  conceitosIds: string[];
}) {
  const admin = criarClienteAdmin();
  await admin
    .schema("taxonomia")
    .from("analises")
    .update({
      estado: "concluida",
      total_conceitos_propostos: totalPropostos,
      total_conceitos_reutilizados: totalReutilizados,
      resultado: { conceitos_ids: conceitosIds },
      erro_mensagem: null,
      atualizado_em: new Date().toISOString(),
      concluido_em: new Date().toISOString(),
    })
    .eq("id", analiseId)
    .eq("usuario_id", usuarioId);
}

async function falharAnalise({
  analiseId,
  usuarioId,
  erro,
}: {
  analiseId: string;
  usuarioId: string;
  erro: unknown;
}) {
  const admin = criarClienteAdmin();
  const mensagem = erro instanceof Error ? erro.message : String(erro);

  await admin
    .schema("taxonomia")
    .from("analises")
    .update({
      estado: "falha",
      erro_mensagem: mensagem.slice(0, 4000),
      atualizado_em: new Date().toISOString(),
      concluido_em: new Date().toISOString(),
    })
    .eq("id", analiseId)
    .eq("usuario_id", usuarioId);
}

async function inserirTermosConceito({
  conceitoId,
  termoPreferencial,
  sinonimos,
}: {
  conceitoId: string;
  termoPreferencial: string;
  sinonimos: string[];
}) {
  const admin = criarClienteAdmin();
  const valores = [
    {
      conceito_id: conceitoId,
      termo: termoPreferencial,
      termo_normalizado: normalizarTermoTaxonomia(termoPreferencial),
      tipo: "preferencial",
    },
    ...sinonimos.map((sinonimo) => ({
      conceito_id: conceitoId,
      termo: sinonimo,
      termo_normalizado: normalizarTermoTaxonomia(sinonimo),
      tipo: "sinonimo",
    })),
  ];

  for (const valor of valores) {
    const { data: existente } = await admin
      .schema("taxonomia")
      .from("termos")
      .select("id")
      .eq("conceito_id", conceitoId)
      .eq("termo_normalizado", valor.termo_normalizado)
      .maybeSingle();

    if (existente) continue;

    const { error } = await admin
      .schema("taxonomia")
      .from("termos")
      .insert(valor);

    if (error) {
      throw new Error(`Falha ao registrar termo taxonômico: ${error.message}`);
    }
  }
}

async function obterOuCriarConceito({
  candidato,
  usuarioId,
  versaoTaxonomiaId,
}: {
  candidato: ConceitoTaxonomicoValidado;
  usuarioId: string;
  versaoTaxonomiaId: string;
}) {
  const admin = criarClienteAdmin();

  if (candidato.conceitoExistenteId) {
    const { data: existente } = await admin
      .schema("taxonomia")
      .from("conceitos")
      .select("id, estado")
      .eq("id", candidato.conceitoExistenteId)
      .eq("usuario_id", usuarioId)
      .maybeSingle();

    if (
      existente &&
      existente.estado !== "rejeitado" &&
      existente.estado !== "obsoleto"
    ) {
      return { id: existente.id as string, criado: false };
    }
  }

  const codigo = gerarCodigoTaxonomia(candidato.termoPreferencial);
  const { data: porCodigo } = await admin
    .schema("taxonomia")
    .from("conceitos")
    .select("id, estado")
    .eq("usuario_id", usuarioId)
    .eq("codigo", codigo)
    .maybeSingle();

  if (porCodigo) {
    if (porCodigo.estado === "rejeitado" || porCodigo.estado === "obsoleto") {
      return null;
    }
    return { id: porCodigo.id as string, criado: false };
  }

  const { data: criado, error } = await admin
    .schema("taxonomia")
    .from("conceitos")
    .insert({
      versao_taxonomia_id: versaoTaxonomiaId,
      usuario_id: usuarioId,
      codigo,
      termo_preferencial: candidato.termoPreferencial,
      definicao: candidato.definicao,
      dominio: candidato.dominio,
      estado: "revisao",
      origem: "ia",
      confianca: candidato.confianca,
    })
    .select("id")
    .single();

  if (error || !criado) {
    // Uma corrida entre lotes/processos pode ter criado o mesmo código.
    const { data: aposConflito } = await admin
      .schema("taxonomia")
      .from("conceitos")
      .select("id, estado")
      .eq("usuario_id", usuarioId)
      .eq("codigo", codigo)
      .maybeSingle();

    if (
      aposConflito &&
      aposConflito.estado !== "rejeitado" &&
      aposConflito.estado !== "obsoleto"
    ) {
      return { id: aposConflito.id as string, criado: false };
    }

    throw new Error(`Falha ao propor conceito "${candidato.termoPreferencial}": ${error?.message}`);
  }

  try {
    await inserirTermosConceito({
      conceitoId: criado.id,
      termoPreferencial: candidato.termoPreferencial,
      sinonimos: candidato.sinonimos,
    });
  } catch (erro) {
    await admin
      .schema("taxonomia")
      .from("conceitos")
      .delete()
      .eq("id", criado.id)
      .eq("usuario_id", usuarioId);
    throw erro;
  }

  return { id: criado.id as string, criado: true };
}

function agruparEvidenciasPorFonte(candidato: ConceitoTaxonomicoValidado) {
  const porFonte = new Map<
    string,
    { relevancia: number; trechos: string[] }
  >();

  for (const evidencia of candidato.evidencias) {
    const atual = porFonte.get(evidencia.fonteId) || {
      relevancia: 0,
      trechos: [],
    };
    atual.relevancia = Math.max(atual.relevancia, evidencia.relevancia);
    if (!atual.trechos.includes(evidencia.trechoContextual)) {
      atual.trechos.push(evidencia.trechoContextual);
    }
    porFonte.set(evidencia.fonteId, atual);
  }

  return porFonte;
}

async function persistirCandidatos({
  usuarioId,
  tipoOrigem,
  versaoReflexaoId,
  candidatos,
}: {
  usuarioId: string;
  tipoOrigem: TipoOrigem;
  versaoReflexaoId?: string;
  candidatos: ConceitoTaxonomicoValidado[];
}) {
  const admin = criarClienteAdmin();
  const versaoTaxonomiaId = await obterVersaoTaxonomiaAtiva();
  const conceitosIds: string[] = [];
  let totalPropostos = 0;
  let totalReutilizados = 0;

  for (const candidato of candidatos) {
    const conceito = await obterOuCriarConceito({
      candidato,
      usuarioId,
      versaoTaxonomiaId,
    });
    if (!conceito) continue;

    conceitosIds.push(conceito.id);
    if (conceito.criado) totalPropostos++;
    else totalReutilizados++;

    const evidencias = agruparEvidenciasPorFonte(candidato);

    for (const [fonteId, evidencia] of evidencias) {
      const trechoContextual = evidencia.trechos.slice(0, 3).join("\n…\n");

      if (tipoOrigem === "documento") {
        const { error } = await admin
          .schema("taxonomia")
          .from("conceitos_fragmentos")
          .upsert(
            {
              conceito_id: conceito.id,
              fragmento_id: fonteId,
              usuario_id: usuarioId,
              relevancia: evidencia.relevancia,
              trecho_contextual: trechoContextual,
            },
            { onConflict: "conceito_id,fragmento_id" }
          );

        if (error) {
          throw new Error(`Falha ao vincular conceito ao fragmento: ${error.message}`);
        }
      } else if (versaoReflexaoId && fonteId === versaoReflexaoId) {
        const { error } = await admin
          .schema("taxonomia")
          .from("conceitos_reflexoes")
          .upsert(
            {
              conceito_id: conceito.id,
              versao_reflexao_id: versaoReflexaoId,
              usuario_id: usuarioId,
              relevancia: evidencia.relevancia,
              trecho_contextual: trechoContextual,
            },
            { onConflict: "conceito_id,versao_reflexao_id" }
          );

        if (error) {
          throw new Error(`Falha ao vincular conceito à reflexão: ${error.message}`);
        }
      }
    }
  }

  return {
    totalPropostos,
    totalReutilizados,
    conceitosIds: Array.from(new Set(conceitosIds)),
  };
}

async function executarAnalise({
  usuarioId,
  tipoOrigem,
  fontes,
  documentoProcessadoId,
  versaoReflexaoId,
  forcar = false,
}: {
  usuarioId: string;
  tipoOrigem: TipoOrigem;
  fontes: FonteTaxonomica[];
  documentoProcessadoId?: string;
  versaoReflexaoId?: string;
  forcar?: boolean;
}): Promise<ResultadoAplicacaoTaxonomia> {
  const preparado = await prepararRegistroAnalise({
    usuarioId,
    tipoOrigem,
    documentoProcessadoId,
    versaoReflexaoId,
    forcar,
  });

  if (preparado.reutilizar) {
    return {
      sucesso: true,
      reutilizada: true,
      totalConceitosPropostos:
        preparado.analise.total_conceitos_propostos || 0,
      totalConceitosReutilizados:
        preparado.analise.total_conceitos_reutilizados || 0,
      conceitosIds: Array.isArray(preparado.analise.resultado?.conceitos_ids)
        ? preparado.analise.resultado.conceitos_ids
        : [],
    };
  }

  try {
    const existentes = await obterConceitosExistentes(usuarioId);
    const candidatos = await analisarFontesParaTaxonomia({
      fontes,
      conceitosExistentes: existentes,
    });

    const persistidos = await persistirCandidatos({
      usuarioId,
      tipoOrigem,
      versaoReflexaoId,
      candidatos,
    });

    await concluirAnalise({
      analiseId: preparado.analise.id,
      usuarioId,
      totalPropostos: persistidos.totalPropostos,
      totalReutilizados: persistidos.totalReutilizados,
      conceitosIds: persistidos.conceitosIds,
    });

    return {
      sucesso: true,
      reutilizada: false,
      totalConceitosPropostos: persistidos.totalPropostos,
      totalConceitosReutilizados: persistidos.totalReutilizados,
      conceitosIds: persistidos.conceitosIds,
    };
  } catch (erro) {
    await falharAnalise({
      analiseId: preparado.analise.id,
      usuarioId,
      erro,
    });
    throw erro;
  }
}

export async function taxonomizarDocumentoProcessado({
  documentoProcessadoId,
  usuarioId,
  forcar = false,
}: {
  documentoProcessadoId: string;
  usuarioId: string;
  forcar?: boolean;
}): Promise<ResultadoAplicacaoTaxonomia> {
  const admin = criarClienteAdmin();

  const { data: documento, error: erroDocumento } = await admin
    .schema("processamento")
    .from("documentos_processados")
    .select("id")
    .eq("id", documentoProcessadoId)
    .eq("usuario_id", usuarioId)
    .single();

  if (erroDocumento || !documento) {
    throw new Error("Documento processado não encontrado para análise taxonômica.");
  }

  const { data: fragmentos, error: erroFragmentos } = await admin
    .schema("processamento")
    .from("fragmentos")
    .select("id, conteudo, ordem")
    .eq("documento_processado_id", documentoProcessadoId)
    .eq("usuario_id", usuarioId)
    .order("ordem", { ascending: true });

  if (erroFragmentos) {
    throw new Error(`Falha ao carregar fragmentos para Taxonomia: ${erroFragmentos.message}`);
  }

  const fontes: FonteTaxonomica[] = (fragmentos || []).map((fragmento) => ({
    id: fragmento.id,
    conteudo: fragmento.conteudo,
  }));

  return executarAnalise({
    usuarioId,
    tipoOrigem: "documento",
    documentoProcessadoId,
    fontes,
    forcar,
  });
}

export async function taxonomizarReflexaoAprovada({
  versaoReflexaoId,
  usuarioId,
  forcar = false,
}: {
  versaoReflexaoId: string;
  usuarioId: string;
  forcar?: boolean;
}): Promise<ResultadoAplicacaoTaxonomia> {
  const admin = criarClienteAdmin();

  const { data: versao, error } = await admin
    .schema("reflexoes")
    .from("versoes_reflexao")
    .select("id, conteudo_markdown, estado")
    .eq("id", versaoReflexaoId)
    .eq("usuario_id", usuarioId)
    .single();

  if (error || !versao) {
    throw new Error("Versão de reflexão não encontrada para análise taxonômica.");
  }

  if (versao.estado !== "aprovado" && versao.estado !== "publicado") {
    throw new Error(
      "Somente uma reflexão aprovada pelo autor pode alimentar a Taxonomia."
    );
  }

  return executarAnalise({
    usuarioId,
    tipoOrigem: "reflexao",
    versaoReflexaoId,
    fontes: [
      {
        id: versaoReflexaoId,
        conteudo: versao.conteudo_markdown,
      },
    ],
    forcar,
  });
}
