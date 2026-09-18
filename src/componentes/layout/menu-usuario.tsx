"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, LogOut, Settings, ChevronDown } from "lucide-react";
import { fazerLogout } from "@/acoes/auth";

interface MenuUsuarioProps {
  usuario: {
    id: string;
    nome: string;
    email: string;
    papel: string;
  };
}

export function MenuUsuario({ usuario }: MenuUsuarioProps) {
  const [aberto, setAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  const primeiroNome = usuario.nome ? usuario.nome.split(" ")[0] : "Autor";
  const inicial = usuario.nome ? usuario.nome.charAt(0).toUpperCase() : "A";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setAberto(!aberto)}
        className="flex items-center gap-2.5 p-1.5 pl-2 rounded-full hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
        aria-label="Menu do usuário"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-semibold text-xs shadow-sm">
          {inicial}
        </div>
        <div className="hidden sm:flex flex-col text-left">
          <span className="text-xs font-semibold text-slate-800 leading-tight">
            {primeiroNome}
          </span>
          <span className="text-[10px] text-slate-500 capitalize">
            {usuario.papel || "Autor"}
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
      </button>

      {aberto && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-900/10 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-4 py-2 border-b border-slate-100 mb-1">
            <p className="text-xs font-semibold text-slate-900 truncate">{usuario.nome}</p>
            <p className="text-[11px] text-slate-500 truncate">{usuario.email}</p>
          </div>

          <Link
            href="/configuracoes"
            onClick={() => setAberto(false)}
            className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
          >
            <User className="w-4 h-4 text-slate-400" />
            <span>Meu perfil</span>
          </Link>

          <Link
            href="/configuracoes"
            onClick={() => setAberto(false)}
            className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Configurações</span>
          </Link>

          <div className="border-t border-slate-100 my-1"></div>

          <form action={fazerLogout}>
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors text-left font-medium"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Sair da conta</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
