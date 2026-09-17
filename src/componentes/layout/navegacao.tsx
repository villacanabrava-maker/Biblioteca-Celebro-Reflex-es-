"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Brain, Sparkles, Settings } from "lucide-react";
import { clsx } from "clsx";

export const itensNavegacao = [
  { href: "/", rotulo: "Início", icone: Home },
  { href: "/biblioteca", rotulo: "Biblioteca", icone: BookOpen },
  { href: "/cerebro", rotulo: "Meu Cérebro", icone: Brain },
  { href: "/reflexoes", rotulo: "Reflexões", icone: Sparkles },
  { href: "/configuracoes", rotulo: "Mais", icone: Settings },
];

export function BarraInferiorMobile() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 backdrop-blur-md md:hidden">
      {itensNavegacao.map((item) => {
        const ativo = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        const Icone = item.icone;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex flex-col items-center justify-center gap-1 transition-colors",
              ativo ? "text-blue-600 font-semibold" : "text-slate-500 hover:text-slate-800"
            )}
          >
            <Icone className={clsx("h-5 w-5", ativo && "stroke-[2.5px]")} />
            <span className="text-[10px] tracking-tight">{item.rotulo}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function BarraLateralDesktop() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3 px-3 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
          <Brain className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-semibold text-slate-900 leading-tight">Memória Reflexiva</h1>
          <p className="text-xs text-slate-500">Cérebro Autoral</p>
        </div>
      </div>

      <nav className="mt-6 flex flex-col gap-1.5 flex-1">
        {itensNavegacao.map((item) => {
          const ativo = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icone = item.icone;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors",
                ativo
                  ? "bg-blue-50 text-blue-700 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icone className={clsx("h-5 w-5", ativo ? "text-blue-600 stroke-[2.5px]" : "text-slate-400")} />
              <span>{item.rotulo === "Mais" ? "Configurações" : item.rotulo}</span>
            </Link>
          );
        })}
      </nav>

      <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80">
        <p className="text-xs font-semibold text-slate-700">Modo Autoral Ativo</p>
        <p className="text-[11px] text-slate-500 mt-0.5">Seu pensamento preservado e auditável.</p>
      </div>
    </aside>
  );
}
