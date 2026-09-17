"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  Brain,
  Sparkles,
  PlusCircle,
  FileText,
  Settings,
  Compass,
  Layers,
} from "lucide-react";
import { clsx } from "clsx";
import { PenaIcone } from "@/componentes/comum/logotipo";

export const itensNavegacaoMobile = [
  { href: "/", rotulo: "Início", icone: Home },
  { href: "/biblioteca", rotulo: "Biblioteca", icone: BookOpen },
  { href: "/cerebro", rotulo: "Cérebro", icone: Brain },
  { href: "/reflexoes/criar", rotulo: "Refletir", icone: PlusCircle, destaque: true },
  { href: "/reflexoes", rotulo: "Reflexões", icone: FileText },
];

export const itensNavegacaoDesktop = [
  { href: "/", rotulo: "Início", icone: Home },
  { href: "/biblioteca", rotulo: "Biblioteca", icone: BookOpen },
  { href: "/cerebro", rotulo: "Meu Cérebro", icone: Brain },
  { href: "/reflexoes/criar", rotulo: "Criar Reflexão", icone: Sparkles, badge: "Novo" },
  { href: "/reflexoes", rotulo: "Minhas Reflexões", icone: FileText },
  { href: "/taxonomia", rotulo: "Taxonomia & Teses", icone: Compass },
  { href: "/configuracoes", rotulo: "Configurações", icone: Settings },
];

export function BarraInferiorMobile() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 backdrop-blur-md md:hidden px-2 shadow-sm">
      {itensNavegacaoMobile.map((item) => {
        const ativo = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        const Icone = item.icone;

        if (item.destaque) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center -mt-5 transition-transform active:scale-95"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/30">
                <Icone className="h-6 w-6 stroke-[2.2px]" />
              </div>
              <span className="text-[10px] font-semibold text-blue-700 mt-1">{item.rotulo}</span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex flex-col items-center justify-center gap-1 transition-colors px-2 py-1",
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
    <aside className="hidden md:flex w-64 flex-col border-r border-slate-200 bg-white p-4 shrink-0 shadow-sm">
      {/* Logotipo Canônico */}
      <Link href="/" className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
          <PenaIcone className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-slate-900 text-base leading-tight">Memória Reflexiva</h1>
          <p className="text-[11px] text-slate-500 font-normal">Cérebro Autoral v2.0</p>
        </div>
      </Link>

      {/* Navegação Principal */}
      <nav className="mt-6 flex flex-col gap-1.5 flex-1">
        {itensNavegacaoDesktop.map((item) => {
          const ativo = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icone = item.icone;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
                ativo
                  ? "bg-blue-50 text-blue-700 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <div className="flex items-center gap-3">
                <Icone className={clsx("h-5 w-5", ativo ? "text-blue-600 stroke-[2.5px]" : "text-slate-400")} />
                <span>{item.rotulo}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Card Informativo de Princípio */}
      <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 mt-auto">
        <div className="flex items-center gap-2 text-blue-700 font-semibold text-xs">
          <Layers className="w-3.5 h-3.5" />
          <span>Núcleo Autoral Ativo</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
          Seu pensamento único preservado com rastreabilidade epistemológica completa.
        </p>
      </div>
    </aside>
  );
}
