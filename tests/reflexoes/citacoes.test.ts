import { describe, it, expect } from "vitest";

describe("Onda 9 - Reflexões: Verificador Determinístico de Citações", () => {
  function verificarCitacaoTexto(trechoCitado: string, fragmentos: Array<{ conteudo: string }>) {
    const fragmento = fragmentos.find((f) =>
      f.conteudo.toLowerCase().includes(trechoCitado.toLowerCase().trim())
    );
    return {
      alinhamento_valido: !!fragmento,
      fragmento_encontrado: fragmento || null,
    };
  }

  it("deve validar citação que existe textualmente nos fragmentos autorais", () => {
    const fragmentos = [
      {
        conteudo:
          "A clareza de um pensamento decorre da paciência com que suportamos a contradição inicial.",
      },
    ];

    const resultado = verificarCitacaoTexto(
      "A clareza de um pensamento decorre da paciência",
      fragmentos
    );

    expect(resultado.alinhamento_valido).toBe(true);
    expect(resultado.fragmento_encontrado).toBeDefined();
  });

  it("deve rejeitar e sinalizar alucinação quando o trecho citado não pertencer aos fragmentos", () => {
    const fragmentos = [
      {
        conteudo:
          "O método reflexivo parte da experiência vivida para atingir a síntese.",
      },
    ];

    const resultado = verificarCitacaoTexto(
      "Todo conhecimento prévio é uma ilusão matemática absoluta",
      fragmentos
    );

    expect(resultado.alinhamento_valido).toBe(false);
    expect(resultado.fragmento_encontrado).toBeNull();
  });
});
