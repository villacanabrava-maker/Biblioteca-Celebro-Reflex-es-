import { BarraInferiorMobile, BarraLateralDesktop } from "@/componentes/layout/navegacao";
import { PenaIcone } from "@/componentes/comum/logotipo";
import { MenuUsuario } from "@/componentes/layout/menu-usuario";
import { obterPerfilUsuarioAtual } from "@/infraestrutura/auth/usuario-atual";
import { Search } from "lucide-react";
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
      <BarraLateralDesktop />

      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-6">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md md:px-6">
          <Link href="/" className="flex items-center gap-2.5 md:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
              <PenaIcone className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-tight text-slate-900">Rflex01</span>
              <span className="text-xs text-slate-500">Memória e inteligência autoral</span>
            </div>
          </Link>

          <div className="hidden md:block">
            <p className="text-sm font-medium text-slate-700">Seu espaço de memória e criação</p>
            <p className="text-xs text-slate-500">Organize o acervo, acompanhe o processamento e desenvolva novas reflexões.</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/biblioteca"
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600"
              title="Buscar no acervo"
              aria-label="Buscar no acervo"
            >
              <Search className="h-[18px] w-[18px]" />
            </Link>

            <MenuUsuario usuario={usuario} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-6">{children}</main>
      </div>

      <BarraInferiorMobile />
    </div>
  );
}
