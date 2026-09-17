import { BarraInferiorMobile, BarraLateralDesktop } from "@/componentes/layout/navegacao";
import { Search, User } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar Desktop */}
      <BarraLateralDesktop />

      {/* Conteúdo Principal */}
      <div className="flex flex-1 flex-col pb-20 md:pb-6">
        {/* Top Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-2 md:hidden">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              MR
            </div>
            <span className="font-semibold text-slate-800 text-sm">Memória Reflexiva</span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
            <span>Espaço Pessoal de Inteligência Autoral</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 transition-colors"
              title="Buscar no acervo"
            >
              <Search className="h-5 w-5" />
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-slate-700">
              <User className="h-5 w-5" />
            </div>
          </div>
        </header>

        {/* Corpo da Página */}
        <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto">{children}</main>
      </div>

      {/* Barra de Navegação Inferior Mobile */}
      <BarraInferiorMobile />
    </div>
  );
}
