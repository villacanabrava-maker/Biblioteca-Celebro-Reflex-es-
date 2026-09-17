import { createBrowserClient } from "@supabase/ssr";

export function criarClienteBrowser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Variáveis de ambiente do Supabase não encontradas no browser.");
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
