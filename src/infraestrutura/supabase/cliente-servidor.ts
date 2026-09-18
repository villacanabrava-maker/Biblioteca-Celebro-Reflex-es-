import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function criarClienteServidor() {
  const cookieStore = await cookies();

  const supabaseUrl = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ""
  ).trim();

  const supabasePublicKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ""
  ).trim();

  if (!supabaseUrl || !supabasePublicKey) {
    throw new Error(
      "Configuração pública do Supabase ausente no servidor: defina a URL e a publishable key por variáveis de ambiente."
    );
  }

  return createServerClient(supabaseUrl, supabasePublicKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Chamado a partir de Server Component
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Chamado a partir de Server Component
        }
      },
    },
  });
}
