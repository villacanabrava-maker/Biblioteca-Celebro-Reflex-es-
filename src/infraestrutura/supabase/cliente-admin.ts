import { createClient } from "@supabase/supabase-js";

/**
 * Cliente com privilégios elevados (service_role).
 * ATENÇÃO: NUNCA importe este arquivo em componentes clientes do React.
 * Uso exclusivo em Server Actions, Route Handlers e Workflows.
 */
export function criarClienteAdmin() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "https://cqavdefyelarhyjqmahi.supabase.co";

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    (process.env as any)["CHAVE_DE_FUNÇÃO_DO_SERVIÇO_SUPABASE"] ||
    (process.env as any)["CHAVE_DE_FUNCAO_DO_SERVICO_SUPABASE"] ||
    (process.env as any)["SUPABASE_SERVICE_ROLE"] ||
    process.env.SUPABASE_SECRET_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não configurada nas variáveis de ambiente."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
