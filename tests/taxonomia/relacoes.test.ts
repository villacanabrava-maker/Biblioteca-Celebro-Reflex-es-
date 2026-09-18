import { describe, expect, it } from "vitest";
import { validarRelacoesTaxonomicas } from "@/dominios/taxonomia/gerador-relacoes";

const origem = {
  id: "origem",
  codigo: "memoria_reconstrutiva",
  termo_preferencial: "Memória reconstrutiva",
  definicao: "Memória entendida como reconstrução situada.",
  dominio: "reflexivo",
};

const destinos = [
  {
    id: "destino",
    codigo: "identidade_narrativa",
    termo_preferencial: "Identidade narrativa",
    definicao: "Identidade construída pela reorganização narrativa da experiência.",
    dominio: "narrativo",
  },
];

describe("relações taxonômicas propostas", () => {
  it("aceita apenas destinos conhecidos e confiança suficiente", () => {
    const relacoes = validarRelacoesTaxonomicas({
      origem,
      destinos,
      candidatas: [
        {
          destino_codigo: "identidade_narrativa",
          tipo_relacao: "relacionado",
          confianca: 0.85,
          justificativa: "As definições compartilham reconstrução da experiência.",
        },
        {
          destino_codigo: "conceito_inventado",
          tipo_relacao: "relacionado",
          confianca: 0.95,
          justificativa: "Destino inexistente.",
        },
        {
          destino_codigo: "identidade_narrativa",
          tipo_relacao: "contrasta_com",
          confianca: 0.4,
          justificativa: "Sinal fraco.",
        },
      ],
    });

    expect(relacoes).toHaveLength(1);
    expect(relacoes[0]).toMatchObject({
      destinoId: "destino",
      tipoRelacao: "relacionado",
      confianca: 0.85,
    });
  });

  it("deduplica a mesma relação", () => {
    const relacoes = validarRelacoesTaxonomicas({
      origem,
      destinos,
      candidatas: [
        {
          destino_codigo: "identidade_narrativa",
          tipo_relacao: "associado_a",
          confianca: 0.8,
          justificativa: "Relação sustentada.",
        },
        {
          destino_codigo: "identidade_narrativa",
          tipo_relacao: "associado_a",
          confianca: 0.9,
          justificativa: "Duplicata.",
        },
      ],
    });

    expect(relacoes).toHaveLength(1);
  });
});
