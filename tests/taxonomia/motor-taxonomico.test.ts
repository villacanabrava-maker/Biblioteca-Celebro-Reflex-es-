import { describe, expect, it } from "vitest";
import {
  agruparFontesTaxonomia,
  gerarCodigoTaxonomia,
  validarConceitosTaxonomicos,
} from "@/dominios/taxonomia/motor-taxonomico";

const fontes = [
  {
    id: "frag-1",
    conteudo:
      "A memória não funciona como arquivo passivo. Ela reorganiza o passado quando o presente muda.",
  },
];

const existentes = [
  {
    id: "conceito-1",
    codigo: "memoria_reconstrutiva",
    termo_preferencial: "Memória reconstrutiva",
    definicao: "Memória entendida como reconstrução situada.",
    dominio: "reflexivo" as const,
    estado: "ativo" as const,
  },
];

describe("motor taxonômico", () => {
  it("normaliza códigos de conceitos", () => {
    expect(gerarCodigoTaxonomia("  Memória & Reconstrução  ")).toBe(
      "memoria_reconstrucao"
    );
  });

  it("descarta evidência que não existe no texto real", () => {
    const resultado = validarConceitosTaxonomicos({
      fontes,
      conceitosExistentes: [],
      candidatos: [
        {
          acao: "propor_novo",
          codigo_existente: null,
          termo_preferencial: "Memória ativa",
          definicao: "Uma visão dinâmica da memória.",
          dominio: "reflexivo",
          sinonimos: [],
          confianca: 0.9,
          evidencias: [
            {
              fonte_id: "frag-1",
              trecho_contextual: "A memória é um arquivo imutável.",
              relevancia: 0.95,
            },
          ],
        },
      ],
    });

    expect(resultado).toEqual([]);
  });

  it("preserva candidato quando a evidência é reencontrada no material", () => {
    const resultado = validarConceitosTaxonomicos({
      fontes,
      conceitosExistentes: [],
      candidatos: [
        {
          acao: "propor_novo",
          codigo_existente: null,
          termo_preferencial: "Memória Reconstrutiva",
          definicao: "Memória que reorganiza o passado a partir do presente.",
          dominio: "reflexivo",
          sinonimos: ["memória dinâmica"],
          confianca: 0.88,
          evidencias: [
            {
              fonte_id: "frag-1",
              trecho_contextual:
                "Ela reorganiza o passado quando o presente muda.",
              relevancia: 0.91,
            },
          ],
        },
      ],
    });

    expect(resultado).toHaveLength(1);
    expect(resultado[0]).toMatchObject({
      acao: "propor_novo",
      codigo: "memoria_reconstrutiva",
      dominio: "reflexivo",
    });
    expect(resultado[0].evidencias).toHaveLength(1);
  });

  it("reutiliza conceito existente em vez de propor duplicata", () => {
    const resultado = validarConceitosTaxonomicos({
      fontes,
      conceitosExistentes: existentes,
      candidatos: [
        {
          acao: "propor_novo",
          codigo_existente: null,
          termo_preferencial: "Memória reconstrutiva",
          definicao: "Definição redundante.",
          dominio: "intelectual",
          sinonimos: [],
          confianca: 0.84,
          evidencias: [
            {
              fonte_id: "frag-1",
              trecho_contextual:
                "A memória não funciona como arquivo passivo.",
              relevancia: 0.9,
            },
          ],
        },
      ],
    });

    expect(resultado).toHaveLength(1);
    expect(resultado[0]).toMatchObject({
      acao: "reutilizar",
      conceitoExistenteId: "conceito-1",
      codigo: "memoria_reconstrutiva",
      dominio: "reflexivo",
    });
  });

  it("descarta pedido de reutilização que aponta para código inexistente", () => {
    const resultado = validarConceitosTaxonomicos({
      fontes,
      conceitosExistentes: existentes,
      candidatos: [
        {
          acao: "reutilizar",
          codigo_existente: "codigo_inventado",
          termo_preferencial: "Outro conceito",
          definicao: "Não deve virar conceito novo por fallback.",
          dominio: "reflexivo",
          sinonimos: [],
          confianca: 0.9,
          evidencias: [
            {
              fonte_id: "frag-1",
              trecho_contextual:
                "A memória não funciona como arquivo passivo.",
              relevancia: 0.9,
            },
          ],
        },
      ],
    });

    expect(resultado).toEqual([]);
  });

  it("não reativa automaticamente conceito rejeitado", () => {
    const resultado = validarConceitosTaxonomicos({
      fontes,
      conceitosExistentes: [
        {
          ...existentes[0],
          estado: "rejeitado" as const,
        },
      ],
      candidatos: [
        {
          acao: "reutilizar",
          codigo_existente: "memoria_reconstrutiva",
          termo_preferencial: "Memória reconstrutiva",
          definicao: "Definição.",
          dominio: "reflexivo",
          sinonimos: [],
          confianca: 0.9,
          evidencias: [
            {
              fonte_id: "frag-1",
              trecho_contextual:
                "A memória não funciona como arquivo passivo.",
              relevancia: 0.9,
            },
          ],
        },
      ],
    });

    expect(resultado).toEqual([]);
  });

  it("divide fontes longas em lotes sem perder o id canônico", () => {
    const lotes = agruparFontesTaxonomia(
      [
        {
          id: "origem-1",
          conteudo: Array.from(
            { length: 100 },
            (_, indice) => `trecho ${indice} com conteúdo suficiente.`
          ).join(" "),
        },
      ],
      180
    );

    const partes = lotes.flat();
    expect(partes.length).toBeGreaterThan(1);
    expect(partes.every((parte) => parte.id === "origem-1")).toBe(true);
    expect(partes.every((parte) => parte.conteudo.length <= 180)).toBe(true);
  });
});
