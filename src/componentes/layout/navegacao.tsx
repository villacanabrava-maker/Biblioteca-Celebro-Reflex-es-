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
  Feather,
  Bell,
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
  { href: "/reflexoes", rotulo: "Minhas Reflexões", icone: FileText },
  { href: "/taxonomia", rotulo: "Taxonomia & Teses", icone: Compass },
  { href: "/configuracoes", rotulo: "Configurações", icone: Settings },
];

export function BarraInferiorMobile() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-slate-700/50 bg-slate-900/95 backdrop-blur-md md:hidden px-2 shadow-lg">
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
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/40 ring-4 ring-slate-900">
                <Icone className="h-6 w-6 stroke-[2.2px]" />
              </div>
              <span className="text-[10px] font-semibold text-blue-400 mt-1">{item.rotulo}</span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex flex-col items-center justify-center gap-1 transition-colors px-2 py-1",
              ativo ? "text-blue-400 font-semibold" : "text-slate-400 hover:text-slate-200"
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
    <aside className="hidden md:flex w-64 flex-col bg-slate-900 shrink-0 shadow-xl">
      {/* Logotipo Canônico Oficial (Identico ao Print do Usuário) */}
      <Link href="/" className="flex items-center gap-3.5 px-5 py-5 border-b border-slate-700/60 hover:bg-slate-800/50 transition-colors">
        <div className="w-10 h-10 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-xl font-serif text-white shrink-0">
          ◜
        </div>
        <div className="min-w-0">
          <h1 className="font-serif font-bold text-white text-sm leading-tight truncate">Cérebro Autoral</h1>
          <p className="text-[10px] text-slate-400 font-sans leading-tight mt-0.5">Seu acervo. Seu pensamento. Novas reflexões.</p>
        </div>
      </Link>

      {/* Botão CTA — Criar Reflexão */}
      <div className="px-4 pt-5 pb-3">
        <Link
          href="/reflexoes/criar"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-md shadow-blue-500/30 transition-all active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          <span>+ Nova Reflexão</span>
        </Link>
      </div>

      {/* Navegação Principal */}
      <nav className="flex flex-col gap-0.5 px-3 flex-1 overflow-y-auto py-2">
        {itensNavegacaoDesktop.map((item) => {
          const ativo = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icone = item.icone;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
                ativo
                  ? "bg-blue-600/20 text-blue-300 border border-blue-500/30"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              )}
            >
              <Icone
                className={clsx(
                  "h-4.5 w-4.5",
                  ativo ? "text-blue-400 stroke-[2.5px]" : "text-slate-500"
                )}
                style={{ width: "1.125rem", height: "1.125rem" }}
              />
              <span>{item.rotulo}</span>
            </Link>
          );
        })}
      </nav>

      {/* Card Inspirador / Rodapé (Identico ao Print do Usuário) */}
      <div className="mx-3 mb-4 rounded-2xl bg-blue-950/40 border border-blue-500/15 p-4 space-y-1">
        <span className="text-xl font-serif text-blue-400/80 leading-none block font-bold">“</span>
        <p className="text-xs text-slate-300/90 leading-relaxed font-serif">
          Seu pensamento merece contexto, memória e proveniência.
        </p>
      </div>
    </aside>
  );
}
