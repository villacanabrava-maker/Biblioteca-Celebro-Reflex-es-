import { describe, expect, it } from "vitest";
import { cadastrarObraSchema } from "@/lib/validacoes/biblioteca";
import { LIMITE_ARQUIVO_BIBLIOTECA_BYTES } from "@/lib/limites-upload";

const base = {
  titulo: "Documento de teste",
  autor_nome: "Autor",
  tipo: "livro" as const,
  natureza: "autoral" as const,
  papel_fonte: "autoral" as const,
  participacao_cerebro: "nucleo_autoral" as const,
  participa_cerebro: true,
  peso_autoral: 1,
  arquivo_caminho: "usuario/arquivo.pdf",
  arquivo_nome_original: "arquivo.pdf",
  arquivo_mime_type: "application/pdf",
  hash_sha256: "a".repeat(64),
};

describe("limite de upload da Biblioteca", () => {
  it("aceita arquivo exatamente no limite de 50 MB", () => {
    const resultado = cadastrarObraSchema.safeParse({
      ...base,
      arquivo_tamanho_bytes: LIMITE_ARQUIVO_BIBLIOTECA_BYTES,
    });

    expect(resultado.success).toBe(true);
  });

  it("rejeita arquivo acima de 50 MB", () => {
    const resultado = cadastrarObraSchema.safeParse({
      ...base,
      arquivo_tamanho_bytes: LIMITE_ARQUIVO_BIBLIOTECA_BYTES + 1,
    });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues.some((issue) => issue.message.includes("50 MB"))).toBe(true);
    }
  });
});
