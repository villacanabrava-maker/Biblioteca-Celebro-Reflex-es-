import { describe, expect, it } from "vitest";
import { validarPropostasAprendizado } from "@/dominios/cerebro/analisador-edicao-autoral";
import type { DiffEdicaoAutor } from "@/tipos/reflexoes";

const dimensoes = [
  {
    id: "dim-escrita",
    codigo: "metodologia_de_escrita",
    nome: "Metodologia de Escrita",
    descricao: "Escolhas recorrentes de construção textual.",
  },
];

const diff: DiffEdicaoAutor = {
  versao_base_id: "base",
  versao_editada_id: "editada",
  estrategia: "palavra",
  alteracoes: [
    {
      tipo: "substituicao",
      antes: "resposta rápida",
      depois: "resposta paciente",
      palavras_removidas: 2,
      palavras_adicionadas: 2,
    },
    {
      tipo: "adicao",
      antes: "",
      depois: "sem antecipar a conclusão",
      palavras_removidas: 0,
      palavras_adicionadas: 4,
    },
  ],
  total_palavras_base: 100,
  total_palavras_editada: 104,
  palavras_removidas: 2,
  palavras_adicionadas: 6,
  blocos_alterados: 2,
  percentual_alteracao: 3.9,
};

describe("validação de propostas de aprendizado por edição", () => {
  it("reconstrói evidências a partir dos índices reais do diff e limita confiança", () => {
    const resultado = validarPropostasAprendizado({
      dimensoes,
      diff,
      propostas: [
        {
          tipo_proposta: "nova_caracteristica",
          dimensao_codigo: "metodologia_de_escrita",
          titulo: "Preferência por maturação argumentativa",
          descricao: "O autor substituiu urgência por uma formulação mais paciente.",
          enunciado_regra: null,
          tipo_regra: null,
          alteracoes_referencia: [0, 0],
          justificativa: "A substituição aponta para uma preferência de ritmo argumentativo.",
          confianca: 0.92,
        },
      ],
    });

    expect(resultado).toHaveLength(1);
    expect(resultado[0].confianca).toBe(0.75);
    expect(resultado[0].alteracoes_referencia).toEqual([0]);
    expect(resultado[0].evidencias_edicao[0]).toMatchObject({
      antes: "resposta rápida",
      depois: "resposta paciente",
    });
  });

  it("descarta dimensão inexistente e referências fora do diff", () => {
    const resultado = validarPropostasAprendizado({
      dimensoes,
      diff,
      propostas: [
        {
          tipo_proposta: "nova_metodologia",
          dimensao_codigo: "dimensao_inventada",
          titulo: "Inválida",
          descricao: "Não deve sobreviver.",
          enunciado_regra: null,
          tipo_regra: null,
          alteracoes_referencia: [99],
          justificativa: "Sem sustentação.",
          confianca: 0.9,
        },
      ],
    });

    expect(resultado).toEqual([]);
  });

  it("não aceita atualização de regra sem enunciado e tipo explícitos", () => {
    const resultado = validarPropostasAprendizado({
      dimensoes,
      diff,
      propostas: [
        {
          tipo_proposta: "atualizacao_regra",
          dimensao_codigo: "metodologia_de_escrita",
          titulo: "Regra incompleta",
          descricao: "Falta contrato mínimo.",
          enunciado_regra: null,
          tipo_regra: null,
          alteracoes_referencia: [1],
          justificativa: "Apenas hipótese.",
          confianca: 0.7,
        },
      ],
    });

    expect(resultado).toEqual([]);
  });

  it("descarta candidatos de baixa confiança antes de persistir", () => {
    const resultado = validarPropostasAprendizado({
      dimensoes,
      diff,
      propostas: [
        {
          tipo_proposta: "nova_caracteristica",
          dimensao_codigo: "metodologia_de_escrita",
          titulo: "Sinal fraco",
          descricao: "Mudança insuficiente.",
          enunciado_regra: null,
          tipo_regra: null,
          alteracoes_referencia: [0],
          justificativa: "Sinal pouco sustentado.",
          confianca: 0.4,
        },
      ],
    });

    expect(resultado).toEqual([]);
  });
});
