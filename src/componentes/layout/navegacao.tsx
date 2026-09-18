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
  FileCheck2,
  Settings,
  Compass,
} from "lucide-react";
import { clsx } from "clsx";
import { PenaIcone } from "@/componentes/comum/logotipo";

export const itensNavegacaoMobile = [
  { href: "/", rotulo: "Início", icone: Home },
  { href: "/biblioteca", rotulo: "Biblioteca", icone: BookOpen },
  { href: "/reflexoes/criar", rotulo: "Criar", icone: PlusCircle, destaque: true },
  { href: "/reflexoes", rotulo: "Reflexões", icone: FileText },
  { href: "/cerebro", rotulo: "Cérebro", icone: Brain },
];

const gruposNavegacaoDesktop = [
  {
    rotulo: "Principal",
    itens: [
      { href: "/", rotulo: "Início", icone: Home },
      { href: "/biblioteca", rotulo: "Biblioteca", icone: BookOpen },
      { href: "/reflexoes", rotulo: "Reflexões", icone: FileText },
    ],
  },
  {
    rotulo: "Inteligência",
    itens: [
      { href: "/cerebro", rotulo: "Cérebro Autoral", icone: Brain },
      { href: "/taxonomia", rotulo: "Taxonomia", icone: Compass },
      { href: "/documentos-processados", rotulo: "Documentos Processados", icone: FileCheck2 },
    ],
  },
];

function itemAtivo(pathname: string, href: string) {
  if (href === "/reflexoes" && pathname.startsWith("/reflexoes/criar")) {
    return false;
  }

  return pathname === href || (href !== "/" && pathname.startsWith(href));
}

export function BarraInferiorMobile() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-slate-800 bg-slate-950/95 px-2 shadow-lg backdrop-blur-md md:hidden">
      {itensNavegacaoMobile.map((item) => {
        const ativo = itemAtivo(pathname, item.href);
        const Icone = item.icone;

        if (item.destaque) {
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={ativo ? "page" : undefined}
              className="flex -mt-5 flex-col items-center justify-center rounded-xl transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-4 ring-slate-950">
                <Icone className="h-6 w-6 stroke-[2.2px]" />
              </div>
              <span className="mt-1 text-[11px] font-semibold text-blue-400">{item.rotulo}</span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={ativo ? "page" : undefined}
            className={clsx(
              "flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
              ativo ? "font-semibold text-blue-400" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Icone className={clsx("h-5 w-5", ativo && "stroke-[2.5px]")} />
            <span className="text-[11px] tracking-tight">{item.rotulo}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function BarraLateralDesktop() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-slate-950 shadow-xl md:flex">
      <Link
        href="/"
        className="flex items-center gap-3 border-b border-slate-800 px-5 py-5 transition-colors hover:bg-slate-900"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
          <PenaIcone className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold leading-tight text-white">Rflex01</h1>
          <p className="text-xs font-normal text-slate-400">Cérebro Autoral</p>
        </div>
      </Link>

      <div className="px-4 pb-3 pt-5">
        <Link
          href="/reflexoes/criar"
          aria-current={pathname.startsWith("/reflexoes/criar") ? "page" : undefined}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-500 active:scale-95"
        >
          <Sparkles className="h-4 w-4" />
          <span>Nova Reflexão</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-2">
        {gruposNavegacaoDesktop.map((grupo) => (
          <div key={grupo.rotulo}>
            <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
              {grupo.rotulo}
            </p>
            <div className="space-y-1">
              {grupo.itens.map((item) => {
                const ativo = itemAtivo(pathname, item.href);
                const Icone = item.icone;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={ativo ? "page" : undefined}
                    className={clsx(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
                      ativo
                        ? "bg-blue-600/15 font-semibold text-blue-400"
                        : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                    )}
                  >
                    <Icone
                      className={clsx(
                        "h-[18px] w-[18px] shrink-0",
                        ativo ? "stroke-[2.5px] text-blue-400" : "text-slate-500 group-hover:text-slate-300"
                      )}
                    />
                    <span className="truncate">{item.rotulo}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-3">
        <Link
          href="/configuracoes"
          aria-current={itemAtivo(pathname, "/configuracoes") ? "page" : undefined}
          className={clsx(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
            itemAtivo(pathname, "/configuracoes")
              ? "bg-blue-600/15 text-blue-400"
              : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
          )}
        >
          <Settings className="h-[18px] w-[18px]" />
          <span>Configurações</span>
        </Link>
      </div>
    </aside>
  );
}
