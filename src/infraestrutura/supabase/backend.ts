import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createBackendClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY

  if (!url || !secretKey) {
    throw new Error(
      'Backend Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY no ambiente servidor.'
    )
  }

  return createSupabaseClient(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}
