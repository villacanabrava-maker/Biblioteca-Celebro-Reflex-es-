import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const RAIZ = process.cwd();

function listarArquivos(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
    const absoluto = path.join(dir, entrada.name);

    if (entrada.isDirectory()) {
      if (["node_modules", ".next", ".git"].includes(entrada.name)) return [];
      return listarArquivos(absoluto);
    }

    return [absoluto];
  });
}

function lerArquivosCodigo(): { arquivo: string; conteudo: string }[] {
  const raizes = [
    path.join(RAIZ, "src"),
    path.join(RAIZ, ".github"),
  ];

  const arquivosExtras = [
    path.join(RAIZ, "next.config.mjs"),
    path.join(RAIZ, "package.json"),
  ].filter(fs.existsSync);

  return [...raizes.flatMap(listarArquivos), ...arquivosExtras]
    .filter((arquivo) => /\.(?:ts|tsx|js|mjs|json|ya?ml)$/u.test(arquivo))
    .map((arquivo) => ({
      arquivo: path.relative(RAIZ, arquivo),
      conteudo: fs.readFileSync(arquivo, "utf8"),
    }));
}

describe("guardrails de configuração e segredos", () => {
  const arquivos = lerArquivosCodigo();

  it("não contém chaves privilegiadas ou publishable keys materializadas no código", () => {
    const padroes = [
      /\bsb_secret_[A-Za-z0-9_-]{10,}\b/u,
      /\bsb_publishable_[A-Za-z0-9_-]{10,}\b/u,
      /\bsk-proj-[A-Za-z0-9_-]{10,}\b/u,
      /\bsk-[A-Za-z0-9_-]{32,}\b/u,
    ];

    const achados = arquivos.flatMap(({ arquivo, conteudo }) =>
      padroes
        .filter((padrao) => padrao.test(conteudo))
        .map((padrao) => ({ arquivo, padrao: padrao.source }))
    );

    expect(achados).toEqual([]);
  });

  it("não volta a embutir a URL do projeto Supabase canônico em arquivos de runtime", () => {
    const referenciaProjeto = "cqavdefyelarhyjqmahi.supabase.co";

    const achados = arquivos
      .filter(({ arquivo }) => arquivo.startsWith("src/"))
      .filter(({ conteudo }) => conteudo.includes(referenciaProjeto))
      .map(({ arquivo }) => arquivo);

    expect(achados).toEqual([]);
  });

  it("não permite cliente administrativo dentro de componentes marcados como use client", () => {
    const achados = arquivos
      .filter(({ arquivo }) => arquivo.endsWith(".tsx") || arquivo.endsWith(".ts"))
      .filter(({ conteudo }) => /^\s*["']use client["'];?/u.test(conteudo))
      .filter(({ conteudo }) =>
        /(?:cliente-admin|criarClienteAdmin)/u.test(conteudo)
      )
      .map(({ arquivo }) => arquivo);

    expect(achados).toEqual([]);
  });
});
