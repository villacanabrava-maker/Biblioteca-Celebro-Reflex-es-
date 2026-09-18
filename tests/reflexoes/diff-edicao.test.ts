import { describe, expect, it } from "vitest";
import { calcularDiffEdicaoAutor } from "@/dominios/reflexoes/diff-edicao";

describe("diff estruturado da edição autoral", () => {
  it("não cria alterações quando o conteúdo é semanticamente idêntico", () => {
    const diff = calcularDiffEdicaoAutor({
      versaoBaseId: "base",
      versaoEditadaId: "editada",
      antes: "O perdão exige tempo.",
      depois: "O perdão exige tempo.",
    });

    expect(diff.alteracoes).toEqual([]);
    expect(diff.palavras_adicionadas).toBe(0);
    expect(diff.palavras_removidas).toBe(0);
    expect(diff.percentual_alteracao).toBe(0);
  });

  it("registra substituição de palavras sem sobrescrever a versão-base", () => {
    const diff = calcularDiffEdicaoAutor({
      versaoBaseId: "base",
      versaoEditadaId: "editada",
      antes: "O perdão exige uma resposta rápida.",
      depois: "O perdão exige uma resposta paciente.",
    });

    expect(diff.versao_base_id).toBe("base");
    expect(diff.versao_editada_id).toBe("editada");
    expect(diff.alteracoes).toHaveLength(1);
    expect(diff.alteracoes[0]).toMatchObject({
      tipo: "substituicao",
      antes: "rápida",
      depois: "paciente",
      palavras_removidas: 1,
      palavras_adicionadas: 1,
    });
  });

  it("distingue adição e remoção em pontos diferentes do texto", () => {
    const diff = calcularDiffEdicaoAutor({
      versaoBaseId: "base",
      versaoEditadaId: "editada",
      antes: "A memória organiza o passado e o presente.",
      depois: "A memória organiza o passado com cuidado.",
    });

    expect(diff.palavras_removidas).toBeGreaterThan(0);
    expect(diff.palavras_adicionadas).toBeGreaterThan(0);
    expect(diff.blocos_alterados).toBeGreaterThan(0);
  });

  it("ignora mudanças puramente de espaçamento como sinal metodológico", () => {
    const diff = calcularDiffEdicaoAutor({
      versaoBaseId: "base",
      versaoEditadaId: "editada",
      antes: "Pensar   exige tempo.",
      depois: "Pensar exige tempo.",
    });

    expect(diff.alteracoes).toEqual([]);
  });

  it("usa estratégia por blocos em textos muito extensos", () => {
    const antes = Array.from({ length: 1700 }, (_, i) => `palavra${i}`).join(" ");
    const depois = antes.replace("palavra900", "termo900");

    const diff = calcularDiffEdicaoAutor({
      versaoBaseId: "base",
      versaoEditadaId: "editada",
      antes,
      depois,
    });

    expect(diff.estrategia).toBe("bloco");
    expect(diff.alteracoes).toHaveLength(1);
    expect(diff.alteracoes[0]).toMatchObject({
      tipo: "substituicao",
      antes: "palavra900",
      depois: "termo900",
      palavras_removidas: 1,
      palavras_adicionadas: 1,
    });
  });
});
