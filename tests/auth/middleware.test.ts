import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ehRotaPublica, middleware } from "@/middleware";

const estadoAuth = vi.hoisted(() => ({
  user: null as null | { id: string },
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: estadoAuth.user },
      })),
    },
  })),
}));

function request(pathname: string) {
  return new NextRequest(`https://app.test${pathname}`);
}

describe("middleware de autenticação", () => {
  beforeEach(() => {
    estadoAuth.user = null;
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-public-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("mantém somente rotas públicas explícitas", () => {
    expect(ehRotaPublica("/login")).toBe(true);
    expect(ehRotaPublica("/auth")).toBe(true);
    expect(ehRotaPublica("/auth/callback")).toBe(true);
    expect(ehRotaPublica("/_next/static/chunk.js")).toBe(true);
    expect(ehRotaPublica("/robots.txt")).toBe(true);

    expect(ehRotaPublica("/authorization")).toBe(false);
    expect(ehRotaPublica("/biblioteca/arquivo.txt")).toBe(false);
    expect(ehRotaPublica("/reflexoes.privadas")).toBe(false);
  });

  it("redireciona visitante sem sessão ao tentar rota protegida", async () => {
    const response = await middleware(request("/biblioteca"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://app.test/login");
  });

  it("não libera rota protegida apenas por conter ponto no caminho", async () => {
    const response = await middleware(request("/biblioteca/arquivo.txt"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://app.test/login");
  });

  it("mantém a tela de login pública para visitante sem sessão", async () => {
    const response = await middleware(request("/login"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("redireciona usuário autenticado para a home ao abrir login", async () => {
    estadoAuth.user = { id: "usuario-teste" };

    const response = await middleware(request("/login"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://app.test/");
  });

  it("permite rota protegida quando há sessão autenticada", async () => {
    estadoAuth.user = { id: "usuario-teste" };

    const response = await middleware(request("/cerebro"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});
