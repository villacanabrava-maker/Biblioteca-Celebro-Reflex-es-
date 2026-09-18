import { describe, it, expect } from "vitest";
import { NaoAutenticadoError } from "@/infraestrutura/auth/usuario-atual";

describe("P0 - Segurança e Autenticação Fail-Closed", () => {
  it("deve instanciar NaoAutenticadoError com nome e mensagem canônica", () => {
    const erro = new NaoAutenticadoError();
    expect(erro).toBeInstanceOf(Error);
    expect(erro.name).toBe("NaoAutenticadoError");
    expect(erro.message).toContain("não autenticado");
  });

  it("deve permitir mensagem customizada de não autenticação", () => {
    const erro = new NaoAutenticadoError("Sessão expirada. Faça login novamente.");
    expect(erro.message).toBe("Sessão expirada. Faça login novamente.");
  });
});
