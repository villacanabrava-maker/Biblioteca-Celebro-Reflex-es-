import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const { data: users, error: listErr } = await supabase.auth.admin.listUsers();
  console.log("Admin listUsers:", users?.users.length, "users", listErr || "");

  if (users && users.users.length === 0) {
    console.log("Criando usuário autor padrão...");
    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      email: "autor@memoriareflexiva.com",
      password: "AutorReflexivo2026!",
      email_confirm: true,
      user_metadata: {
        nome_completo: "Autor da Memória Reflexiva",
        perfil: "autor",
      },
    });

    if (createErr) {
      console.error("Erro ao criar usuário:", createErr);
    } else {
      console.log("Usuário autor criado com sucesso! ID:", newUser.user.id);
    }
  }
}

main().catch(console.error);
