import { createClient } from "@supabase/supabase-js";

/**
 * Cliente com privilégios elevados (service_role).
 * ATENÇÃO: NUNCA importe este arquivo em componentes clientes do React.
 * Uso exclusivo em Server Actions, Route Handlers e Workflows.
 */
export function criarClienteAdmin() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "").trim();

  if (!url || !key) {
    throw new Error(
      "Configuração administrativa ausente: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_SECRET_KEY)."
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
