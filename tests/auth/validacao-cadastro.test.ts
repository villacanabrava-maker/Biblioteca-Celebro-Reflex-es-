import { describe, expect, it } from "vitest";
import {
  SENHA_MINIMA_CARACTERES,
  validarDadosCadastroConta,
} from "@/dominios/auth/validacao-cadastro";

describe("política de cadastro", () => {
  it("rejeita senha abaixo do mínimo canônico", () => {
    const resultado = validarDadosCadastroConta({
      nome: "Autor Teste",
      email: "autor@example.com",
      senha: "1234567",
    });

    expect(resultado.sucesso).toBe(false);
    if (!resultado.sucesso) {
      expect(resultado.erro).toContain(String(SENHA_MINIMA_CARACTERES));
    }
  });

  it("rejeita e-mail inválido no servidor", () => {
    const resultado = validarDadosCadastroConta({
      nome: "Autor Teste",
      email: "email-invalido",
      senha: "12345678",
    });

    expect(resultado.sucesso).toBe(false);
  });

  it("rejeita nome vazio mesmo quando há espaços", () => {
    const resultado = validarDadosCadastroConta({
      nome: "   ",
      email: "autor@example.com",
      senha: "12345678",
    });

    expect(resultado.sucesso).toBe(false);
  });

  it("normaliza nome e e-mail de cadastro válido", () => {
    const resultado = validarDadosCadastroConta({
      nome: "  Autor Teste  ",
      email: "  AUTOR@EXAMPLE.COM  ",
      senha: "12345678",
    });

    expect(resultado.sucesso).toBe(true);
    if (resultado.sucesso) {
      expect(resultado.dados.nome).toBe("Autor Teste");
      expect(resultado.dados.email).toBe("autor@example.com");
      expect(resultado.dados.senha).toBe("12345678");
    }
  });
});
