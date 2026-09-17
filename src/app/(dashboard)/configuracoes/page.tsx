import { Metadata } from "next";
import {
  Settings,
  User,
  Sliders,
  Shield,
  Languages,
  Palette,
  Cpu,
  Mic,
  Share2,
  Info,
  HelpCircle,
  LogOut,
  ChevronRight,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { obterPerfilUsuarioAtual } from "@/infraestrutura/auth/usuario-atual";
import { fazerLogout } from "@/acoes/auth";

export const metadata: Metadata = {
  title: "Configurações | Memória Reflexiva",
  description: "Personalize sua experiência, preferências de IA, perfil e segurança da conta.",
};

export const dynamic = "force-dynamic";

export default async function PaginaConfiguracoes() {
  const perfil = await obterPerfilUsuarioAtual();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Topo */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
          Configurações
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Personalize sua experiência, parâmetros de inteligência e segurança da sua conta.
        </p>
      </div>

      {/* 1. SEÇÃO: MINHA CONTA */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Minha conta
        </h2>

        <div className="divide-y divide-slate-100 text-xs">
          {/* Meu Perfil */}
          <div className="py-3 flex items-center justify-between hover:bg-slate-50/60 px-2 rounded-xl transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-slate-800 block text-xs">Meu perfil</span>
                <span className="text-[11px] text-slate-500">{perfil.nome} • {perfil.email}</span>
              </div>
            </div>
            <span className="text-[11px] text-blue-600 font-semibold px-2.5 py-1 rounded-full bg-blue-50">
              {perfil.papel === "autor" ? "Autor Titular" : "Administrador"}
            </span>
          </div>

          {/* Preferências */}
          <div className="py-3 flex items-center justify-between hover:bg-slate-50/60 px-2 rounded-xl transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-slate-800 block text-xs">Preferências</span>
                <span className="text-[11px] text-slate-500">Modo epistemológico autoral ativo</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          {/* Segurança */}
          <div className="py-3 flex items-center justify-between hover:bg-slate-50/60 px-2 rounded-xl transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-slate-800 block text-xs">Segurança & RLS</span>
                <span className="text-[11px] text-slate-500">
                  Isolamento total de conta via Row-Level Security e Supabase Auth
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" /> Protegido
            </span>
          </div>

          {/* Idioma */}
          <div className="py-3 flex items-center justify-between hover:bg-slate-50/60 px-2 rounded-xl transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Languages className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-slate-800 block text-xs">Idioma</span>
                <span className="text-[11px] text-slate-500">Português do Brasil (Canônico)</span>
              </div>
            </div>
            <span className="text-xs text-slate-600 font-semibold">pt-BR</span>
          </div>

          {/* Aparência */}
          <div className="py-3 flex items-center justify-between hover:bg-slate-50/60 px-2 rounded-xl transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-slate-800 block text-xs">Aparência</span>
                <span className="text-[11px] text-slate-500">Light Editorial Elegante</span>
              </div>
            </div>
            <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2.5 py-0.5 rounded-full">
              Padrão Ativo
            </span>
          </div>
        </div>
      </div>

      {/* 2. SEÇÃO: FUNCIONALIDADES */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Funcionalidades
        </h2>

        <div className="divide-y divide-slate-100 text-xs">
          {/* Modelo de IA */}
          <div className="py-3 flex items-center justify-between hover:bg-slate-50/60 px-2 rounded-xl transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-slate-800 block text-xs">Modelo de IA</span>
                <span className="text-[11px] text-slate-500">
                  OpenAI GPT-4o (Geração) • text-embedding-3-small (Embeddings)
                </span>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Conectado
            </span>
          </div>

          {/* Voz e Áudio */}
          <div className="py-3 flex items-center justify-between hover:bg-slate-50/60 px-2 rounded-xl transition-colors opacity-75">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-slate-800 block text-xs">Voz e áudio</span>
                <span className="text-[11px] text-slate-500">Transcrição de relatos e reflexões faladas</span>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              Em breve
            </span>
          </div>

          {/* Integrações */}
          <div className="py-3 flex items-center justify-between hover:bg-slate-50/60 px-2 rounded-xl transition-colors opacity-75">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-slate-800 block text-xs">Integrações</span>
                <span className="text-[11px] text-slate-500">Conexão com Kindle, Notion e Google Drive</span>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              Em breve
            </span>
          </div>
        </div>
      </div>

      {/* 3. SEÇÃO: SOBRE & SAIR */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Sobre o aplicativo
        </h2>

        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-3 flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-slate-800 block text-xs">Memória Reflexiva</span>
                <span className="text-[11px] text-slate-500">
                  Versão 2.0 • Seu acervo. Sua inteligência. Novas reflexões.
                </span>
              </div>
            </div>
            <span className="font-mono text-slate-400 text-[11px]">v2.0.0</span>
          </div>

          <div className="py-3 flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-slate-800 block text-xs">Ajuda e Suporte</span>
                <span className="text-[11px] text-slate-500">Dúvidas sobre o funcionamento da inteligência autoral</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          {/* Botão Sair */}
          <div className="pt-4 px-2">
            <form action={fazerLogout}>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-colors border border-rose-200/60"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair da minha conta</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
