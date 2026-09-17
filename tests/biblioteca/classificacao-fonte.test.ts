import { describe, it, expect } from "vitest";
import { cadastrarObraSchema } from "@/lib/validacoes/biblioteca";

describe("Onda 4 - Classificação Canônica de Fontes (Dois Eixos)", () => {
  it("deve validar fonte autoral pertencente ao Núcleo Autoral", () => {
    const dados = {
      titulo: "Minhas Memórias Filosóficas",
      autor_nome: "Autor Titular",
      tipo: "livro" as const,
      natureza: "autoral" as const,
      papel_fonte: "autoral" as const,
      participacao_cerebro: "nucleo_autoral" as const,
      arquivo_caminho: "usuario1/123/livro.pdf",
      arquivo_nome_original: "livro.pdf",
      arquivo_tamanho_bytes: 1024,
      arquivo_mime_type: "application/pdf",
      hash_sha256: "a".repeat(64),
    };

    const validado = cadastrarObraSchema.safeParse(dados);
    expect(validado.success).toBe(true);
  });

  it("deve validar fonte externa como Somente Referência", () => {
    const dados = {
      titulo: "Fenomenologia do Espírito",
      autor_nome: "Hegel",
      tipo: "livro" as const,
      natureza: "referencia" as const,
      papel_fonte: "externa" as const,
      participacao_cerebro: "referencia" as const,
      arquivo_caminho: "usuario1/123/hegel.pdf",
      arquivo_nome_original: "hegel.pdf",
      arquivo_tamanho_bytes: 2048,
      arquivo_mime_type: "application/pdf",
      hash_sha256: "b".repeat(64),
    };

    const validado = cadastrarObraSchema.safeParse(dados);
    expect(validado.success).toBe(true);
  });

  it("deve permitir Influência Deliberada com escopos e intensidade", () => {
    const dados = {
      titulo: "Genealogia da Moral",
      autor_nome: "Nietzsche",
      tipo: "livro" as const,
      natureza: "externa_aprovada" as const,
      papel_fonte: "externa" as const,
      participacao_cerebro: "influencia_deliberada" as const,
      escopos_influencia: ["pensamento", "retorica"],
      intensidade_influencia: "moderada" as const,
      arquivo_caminho: "usuario1/123/nietzsche.pdf",
      arquivo_nome_original: "nietzsche.pdf",
      arquivo_tamanho_bytes: 4096,
      arquivo_mime_type: "application/pdf",
      hash_sha256: "c".repeat(64),
    };

    const validado = cadastrarObraSchema.safeParse(dados);
    expect(validado.success).toBe(true);
  });
});
