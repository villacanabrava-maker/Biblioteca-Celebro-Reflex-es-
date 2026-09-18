import { z } from "zod";
import {
  executarChamadaEstruturada,
  protegerEntradaDeDados,
  PAPEIS_IA,
} from "@/ia/orquestrador";
import type {
  DominioTaxonomico,
  EstadoConceitoTaxonomico,
} from "@/tipos/taxonomia";

const LIMITE_CARACTERES_LOTE = 16_000;
const CONCORRENCIA_ANALISE = 2;
const CONFIANCA_MINIMA = 0.65;

const DOMINIOS = [
  "intelectual",
  "axiologico",
  "reflexivo",
  "narrativo",
  "entidades",
  "temporal",
  "retorico",
  "linguistico",
  "estrutural",
  "autoral",
] as const;

const EsquemaAnaliseTaxonomicaZod = z.object({
  conceitos: z.array(
    z.object({
      acao: z.enum(["reutilizar", "propor_novo"]),
      codigo_existente: z.string().nullable(),
      termo_preferencial: z.string(),
      definicao: z.string(),
      dominio: z.enum(DOMINIOS),
      sinonimos: z.array(z.string()),
      confianca: z.number().min(0).max(1),
      evidencias: z.array(
        z.object({
          fonte_id: z.string(),
          trecho_contextual: z.string(),
          relevancia: z.number().min(0).max(1),
        })
      ),
    })
  ),
});

export interface FonteTaxonomica {
  id: string;
  conteudo: string;
}

export interface ConceitoExistenteTaxonomia {
  id: string;
  codigo: string;
  termo_preferencial: string;
  definicao: string;
  dominio: DominioTaxonomico;
  estado: EstadoConceitoTaxonomico;
}

export interface EvidenciaTaxonomicaValidada {
  fonteId: string;
  trechoContextual: string;
  relevancia: number;
}

export interface ConceitoTaxonomicoValidado {
  acao: "reutilizar" | "propor_novo";
  conceitoExistenteId?: string;
  codigo: string;
  termoPreferencial: string;
  definicao: string;
  dominio: DominioTaxonomico;
  sinonimos: string[];
  confianca: number;
  evidencias: EvidenciaTaxonomicaValidada[];
}

export function normalizarTermoTaxonomia(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function gerarCodigoTaxonomia(valor: string): string {
  return normalizarTermoTaxonomia(valor)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

function normalizarParaComparacao(valor: string): string {
  return normalizarTermoTaxonomia(valor).replace(/\s+/g, " ");
}

function trechoEhSuportado(conteudo: string, trecho: string): boolean {
  const agulha = normalizarParaComparacao(trecho);
  if (agulha.length < 8) return false;
  return normalizarParaComparacao(conteudo).includes(agulha);
}

function quebrarFonteLonga(
  fonte: FonteTaxonomica,
  limite = LIMITE_CARACTERES_LOTE
): FonteTaxonomica[] {
  if (fonte.conteudo.length <= limite) return [fonte];

  const partes: FonteTaxonomica[] = [];
  let restante = fonte.conteudo.trim();

  while (restante.length > limite) {
    let corte = restante.lastIndexOf("\n\n", limite);
    if (corte < Math.floor(limite * 0.55)) corte = restante.lastIndexOf(". ", limite);
    if (corte < Math.floor(limite * 0.55)) corte = restante.lastIndexOf(" ", limite);
    if (corte < Math.floor(limite * 0.55)) corte = limite;

    partes.push({
      id: fonte.id,
      conteudo: restante.slice(0, corte).trim(),
    });
    restante = restante.slice(corte).trim();
  }

  if (restante) partes.push({ id: fonte.id, conteudo: restante });
  return partes;
}

export function agruparFontesTaxonomia(
  fontes: FonteTaxonomica[],
  limite = LIMITE_CARACTERES_LOTE
): FonteTaxonomica[][] {
  const expandidas = fontes.flatMap((fonte) => quebrarFonteLonga(fonte, limite));
  const lotes: FonteTaxonomica[][] = [];
  let atual: FonteTaxonomica[] = [];
  let tamanho = 0;

  for (const fonte of expandidas) {
    if (atual.length > 0 && tamanho + fonte.conteudo.length > limite) {
      lotes.push(atual);
      atual = [];
      tamanho = 0;
    }

    atual.push(fonte);
    tamanho += fonte.conteudo.length;
  }

  if (atual.length > 0) lotes.push(atual);
  return lotes;
}

async function mapearComConcorrencia<T, R>(
  itens: T[],
  concorrencia: number,
  tarefa: (item: T, indice: number) => Promise<R>
): Promise<R[]> {
  const resultados = new Array<R>(itens.length);
  let proximo = 0;
  const workers = Array.from(
    { length: Math.max(1, Math.min(concorrencia, itens.length || 1)) },
    async () => {
      while (true) {
        const indice = proximo++;
        if (indice >= itens.length) return;
        resultados[indice] = await tarefa(itens[indice], indice);
      }
    }
  );

  await Promise.all(workers);
  return resultados;
}

export function validarConceitosTaxonomicos({
  candidatos,
  fontes,
  conceitosExistentes,
}: {
  candidatos: z.infer<typeof EsquemaAnaliseTaxonomicaZod>["conceitos"];
  fontes: FonteTaxonomica[];
  conceitosExistentes: ConceitoExistenteTaxonomia[];
}): ConceitoTaxonomicoValidado[] {
  const fontesPorId = new Map<string, string>();
  for (const fonte of fontes) {
    const atual = fontesPorId.get(fonte.id);
    fontesPorId.set(
      fonte.id,
      atual ? `${atual}\n\n${fonte.conteudo}` : fonte.conteudo
    );
  }

  const conceitosPorCodigo = new Map(
    conceitosExistentes.map((conceito) => [conceito.codigo, conceito])
  );
  const saida: ConceitoTaxonomicoValidado[] = [];

  for (const candidato of candidatos.slice(0, 14)) {
    const termo = candidato.termo_preferencial.trim();
    const definicao = candidato.definicao.trim();
    const codigoGerado = gerarCodigoTaxonomia(termo);

    if (!termo || !definicao || !codigoGerado) continue;
    if (candidato.confianca < CONFIANCA_MINIMA) continue;

    const evidencias: EvidenciaTaxonomicaValidada[] = [];
    const chavesEvidencia = new Set<string>();

    for (const evidencia of candidato.evidencias) {
      const conteudoFonte = fontesPorId.get(evidencia.fonte_id);
      const trecho = evidencia.trecho_contextual.trim();

      if (!conteudoFonte || !trechoEhSuportado(conteudoFonte, trecho)) continue;

      const chave = `${evidencia.fonte_id}::${normalizarParaComparacao(trecho)}`;
      if (chavesEvidencia.has(chave)) continue;
      chavesEvidencia.add(chave);

      evidencias.push({
        fonteId: evidencia.fonte_id,
        trechoContextual: trecho,
        relevancia: Math.min(1, Math.max(0, evidencia.relevancia)),
      });
    }

    if (evidencias.length === 0) continue;

    const solicitado =
      candidato.acao === "reutilizar" && candidato.codigo_existente
        ? conceitosPorCodigo.get(candidato.codigo_existente)
        : undefined;

    if (candidato.acao === "reutilizar" && !solicitado) {
      // Não transformar uma referência inventada a conceito existente em um
      // novo conceito silenciosamente.
      continue;
    }

    const porCodigoGerado = conceitosPorCodigo.get(codigoGerado);
    const existente = solicitado || porCodigoGerado;

    if (
      existente &&
      (existente.estado === "rejeitado" || existente.estado === "obsoleto")
    ) {
      continue;
    }

    const sinonimos = Array.from(
      new Set(
        candidato.sinonimos
          .map((sinonimo) => sinonimo.trim())
          .filter(Boolean)
          .filter(
            (sinonimo) =>
              normalizarTermoTaxonomia(sinonimo) !== normalizarTermoTaxonomia(termo)
          )
      )
    ).slice(0, 8);

    if (existente) {
      saida.push({
        acao: "reutilizar",
        conceitoExistenteId: existente.id,
        codigo: existente.codigo,
        termoPreferencial: existente.termo_preferencial,
        definicao: existente.definicao,
        dominio: existente.dominio,
        sinonimos: [],
        confianca: Math.min(0.95, candidato.confianca),
        evidencias,
      });
      continue;
    }

    saida.push({
      acao: "propor_novo",
      codigo: codigoGerado,
      termoPreferencial: termo,
      definicao,
      dominio: candidato.dominio,
      sinonimos,
      // Um único lote de conteúdo não torna o conceito automaticamente canônico.
      confianca: Math.min(0.9, candidato.confianca),
      evidencias,
    });
  }

  return saida;
}

export async function analisarFontesParaTaxonomia({
  fontes,
  conceitosExistentes,
}: {
  fontes: FonteTaxonomica[];
  conceitosExistentes: ConceitoExistenteTaxonomia[];
}): Promise<ConceitoTaxonomicoValidado[]> {
  const fontesValidas = fontes.filter((fonte) => fonte.conteudo.trim().length >= 40);
  if (fontesValidas.length === 0) return [];

  const lotes = agruparFontesTaxonomia(fontesValidas);
  const conceitosParaPrompt = conceitosExistentes
    .filter((conceito) => conceito.estado === "ativo" || conceito.estado === "revisao")
    .slice(0, 120)
    .map((conceito) => ({
      codigo: conceito.codigo,
      termo: conceito.termo_preferencial,
      definicao: conceito.definicao,
      dominio: conceito.dominio,
      estado: conceito.estado,
    }));

  const resultados = await mapearComConcorrencia(
    lotes,
    CONCORRENCIA_ANALISE,
    async (lote) => {
      const sistema = `
Você é o motor de extração da Taxonomia pessoal do usuário.

TAREFA
Identifique conceitos realmente sustentados pelo material fornecido e reutilize
conceitos existentes quando houver equivalência semântica clara.

REGRAS OBRIGATÓRIAS
1. É permitido retornar zero conceitos.
2. Não transforme nomes, palavras frequentes ou assuntos passageiros em conceitos apenas para preencher a saída.
3. Nunca invente evidência. Cada evidência deve usar um fonte_id fornecido e um trecho textual realmente presente naquela fonte.
4. "reutilizar" exige codigo_existente exatamente igual a um código da lista fornecida.
5. "propor_novo" deve representar um conceito semanticamente distinto dos existentes.
6. Não infira crenças do autor apenas porque um material externo menciona algo.
7. Domínio descreve a função do conceito no mapa de conhecimento, não a origem do texto.
8. Prefira poucos conceitos densos a uma lista superficial.
9. A decisão canônica pertence ao usuário: novos conceitos serão apenas propostas em revisão.
      `.trim();

      const dados = protegerEntradaDeDados(
        JSON.stringify(
          {
            conceitos_existentes: conceitosParaPrompt,
            fontes: lote,
          },
          null,
          2
        ),
        "MATERIAL_TAXONOMICO"
      );

      const resposta = await executarChamadaEstruturada({
        papel: PAPEIS_IA.ANALISE,
        modelo: "gpt-4o-mini",
        sistema,
        usuario: `Analise o material e devolva apenas conceitos sustentados.\n\n${dados}`,
        esquemaZod: EsquemaAnaliseTaxonomicaZod,
        nomeEsquema: "extracao_taxonomica",
        temperatura: 0.1,
        maxTentativas: 2,
      });

      return validarConceitosTaxonomicos({
        candidatos: resposta.conceitos,
        fontes: lote,
        conceitosExistentes,
      });
    }
  );

  const combinados = resultados.flat();
  const porChave = new Map<string, ConceitoTaxonomicoValidado>();

  for (const conceito of combinados) {
    const chave = conceito.conceitoExistenteId
      ? `existente:${conceito.conceitoExistenteId}`
      : `novo:${conceito.codigo}`;
    const atual = porChave.get(chave);

    if (!atual) {
      porChave.set(chave, { ...conceito, evidencias: [...conceito.evidencias] });
      continue;
    }

    const evidencias = [...atual.evidencias];
    const existentes = new Set(
      evidencias.map(
        (evidencia) =>
          `${evidencia.fonteId}::${normalizarParaComparacao(evidencia.trechoContextual)}`
      )
    );

    for (const evidencia of conceito.evidencias) {
      const chaveEvidencia = `${evidencia.fonteId}::${normalizarParaComparacao(
        evidencia.trechoContextual
      )}`;
      if (!existentes.has(chaveEvidencia)) {
        existentes.add(chaveEvidencia);
        evidencias.push(evidencia);
      }
    }

    porChave.set(chave, {
      ...atual,
      confianca: Math.max(atual.confianca, conceito.confianca),
      sinonimos: Array.from(new Set([...atual.sinonimos, ...conceito.sinonimos])).slice(0, 8),
      evidencias,
    });
  }

  return Array.from(porChave.values()).slice(0, 30);
}
