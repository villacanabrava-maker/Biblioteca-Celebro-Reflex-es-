import { describe, it, expect } from "vitest";

describe("Onda 7 - Cérebro Autoral: Confiança Explicável", () => {
  function calcularConfiancaExplicavel(componentes: {
    evidencias: number;
    contraevidencias: number;
    obras_distintas: number;
    consistencia: number;
    confirmacao_humana: boolean;
  }): number {
    let base = 0.5;
    base += Math.min(componentes.evidencias * 0.05, 0.25);
    base -= Math.min(componentes.contraevidencias * 0.1, 0.2);
    base += Math.min(componentes.obras_distintas * 0.05, 0.15);
    base *= componentes.consistencia;
    if (componentes.confirmacao_humana) {
      base = Math.min(base + 0.1, 1.0);
    }
    return Number(Math.max(0, Math.min(base, 1.0)).toFixed(2));
  }

  it("deve calcular confianca explicável proporcional a evidências reais e obras distintas", () => {
    const score = calcularConfiancaExplicavel({
      evidencias: 6,
      contraevidencias: 0,
      obras_distintas: 3,
      consistencia: 0.95,
      confirmacao_humana: true,
    });

    expect(score).toBeGreaterThanOrEqual(0.85);
    expect(score).toBeLessThanOrEqual(1.0);
  });

  it("deve penalizar score quando existirem contraevidências significativas", () => {
    const scoreComContra = calcularConfiancaExplicavel({
      evidencias: 2,
      contraevidencias: 4,
      obras_distintas: 1,
      consistencia: 0.7,
      confirmacao_humana: false,
    });

    expect(scoreComContra).toBeLessThan(0.4);
  });
});
