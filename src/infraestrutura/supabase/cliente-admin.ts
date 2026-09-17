import { createClient } from "@supabase/supabase-js";

/**
 * Cliente com privilégios elevados (service_role).
 * ATENÇÃO: NUNCA importe este arquivo em componentes clientes do React.
 * Uso exclusivo em Server Actions, Route Handlers e Workflows.
 */
export function criarClienteAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL ausente no servidor.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
