import { describe, expect, it } from "vitest";
import {
  agruparFontesPorLimite,
  mapearComConcorrencia,
} from "@/dominios/processamento/gerador-sinteses";

describe("gerador de sínteses cognitivas", () => {
  it("agrupa fontes sem ultrapassar o limite quando os itens cabem individualmente", () => {
    const lotes = agruparFontesPorLimite(
      [
        { id: "a", conteudo: "A".repeat(40) },
        { id: "b", conteudo: "B".repeat(40) },
        { id: "c", conteudo: "C".repeat(40) },
      ],
      90
    );

    expect(lotes).toHaveLength(2);
    expect(lotes[0].map((item) => item.id)).toEqual(["a", "b"]);
    expect(lotes[1].map((item) => item.id)).toEqual(["c"]);
    expect(
      lotes.every(
        (lote) =>
          lote.reduce((total, item) => total + item.conteudo.length, 0) <= 90
      )
    ).toBe(true);
  });

  it("divide uma fonte anormalmente longa sem perder seu vínculo de origem", () => {
    const texto = Array.from({ length: 80 }, (_, indice) => `palavra${indice}`).join(" ");
    const lotes = agruparFontesPorLimite(
      [{ id: "fragmento-1", conteudo: texto }],
      120
    );
    const partes = lotes.flat();

    expect(partes.length).toBeGreaterThan(1);
    expect(partes[0].id).toBe("fragmento-1");
    expect(partes.slice(1).every((parte) => parte.id.startsWith("fragmento-1#parte-"))).toBe(
      true
    );
    expect(partes.every((parte) => parte.conteudo.length <= 120)).toBe(true);
  });

  it("mantém a ordem de resultados mesmo com tarefas concorrentes", async () => {
    const resultado = await mapearComConcorrencia(
      [30, 5, 15],
      2,
      async (tempo, indice) => {
        await new Promise((resolve) => setTimeout(resolve, tempo));
        return `resultado-${indice}`;
      }
    );

    expect(resultado).toEqual(["resultado-0", "resultado-1", "resultado-2"]);
  });
});
