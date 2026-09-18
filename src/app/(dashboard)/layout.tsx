import { BarraInferiorMobile, BarraLateralDesktop } from "@/componentes/layout/navegacao";
import { PenaIcone } from "@/componentes/comum/logotipo";
import { MenuUsuario } from "@/componentes/layout/menu-usuario";
import { obterPerfilUsuarioAtual } from "@/infraestrutura/auth/usuario-atual";
import { Search, Sparkles, Bell } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await obterPerfilUsuarioAtual();

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      {/* Sidebar Desktop */}
      <BarraLateralDesktop />

      {/* Conteúdo Principal */}
      <div className="flex flex-1 flex-col pb-20 md:pb-6 min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/98 px-4 backdrop-blur-md md:px-6 shadow-sm">
          {/* Logo Mobile */}
          <Link href="/" className="flex items-center gap-2.5 md:hidden">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <PenaIcone className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 text-sm leading-tight">Cérebro Autoral</span>
              <span className="text-[10px] text-slate-500">Seu acervo e inteligência</span>
            </div>
          </Link>

          {/* Slogan Desktop */}
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Sistema ativo &middot; Analisando memória autoral</span>
          </div>

          {/* Ações do Cabeçalho */}
          <div className="flex items-center gap-2">
            {/* Botão Busca */}
            <Link
              href="/biblioteca"
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors"
              title="Buscar no acervo"
            >
              <Search className="h-4.5 w-4.5" style={{ width: "1.125rem", height: "1.125rem" }} />
            </Link>

            {/* Botão Nova Reflexão — desktop (Identico ao print do usuário) */}
            <Link
              href="/reflexoes/criar"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              + Nova reflexão
            </Link>

            {/* Botão Sair direto (Identico ao print do usuário) */}
            <form action={async () => { "use server"; const { fazerLogout } = await import("@/acoes/auth"); await fazerLogout(); }}>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Sair
              </button>
            </form>

            {/* Menu do Usuário Autenticado */}
            <MenuUsuario usuario={usuario} />
          </div>
        </header>

        {/* Corpo da Página */}
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      {/* Barra de Navegação Inferior Mobile */}
      <BarraInferiorMobile />
    </div>
  );
}
