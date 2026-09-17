import { createBrowserClient } from "@supabase/ssr";

export function criarClienteBrowser() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "https://cqavdefyelarhyjqmahi.supabase.co";

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    (process.env as any)["PRÓXIMA_CHAVE_ANÔNIMA_SUPABASE_PÚBLICA"] ||
    (process.env as any)["PROXIMA_CHAVE_ANONIMA_SUPABASE_PUBLICA"] ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    "sb_publishable_eLnVnSrdoECL5j2D2QG5sw_7mgYdYbO";

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
