import type { Metadata } from "next";
import { User, Sliders, Shield, Languages, Palette, Cpu, Mic, Share2, Info, HelpCircle, LogOut, ChevronRight, CheckCircle2, Database, Activity } from "lucide-react";
import { obterPerfilUsuarioAtual, obterUsuarioAtualId } from "@/infraestrutura/auth/usuario-atual";
import { criarClienteAdmin } from "@/infraestrutura/supabase/cliente-admin";
import { fazerLogout } from "@/acoes/auth";

export const metadata: Metadata = {
  title: "Configurações | Rflex01",
  description: "Conta, preferências e diagnóstico do Rflex01.",
};

export const dynamic = "force-dynamic";

export default async function PaginaConfiguracoes() {
  const usuarioId = await obterUsuarioAtualId();
  const perfil = await obterPerfilUsuarioAtual();

  // Diagnóstico Real do Sistema (Health Check v2.0)
  let statusBanco = false;
  let totalObras = 0;
  let totalCaracteristicas = 0;
  let totalReflexoes = 0;

  try {
    const admin = criarClienteAdmin();
    const { count: obrasCount, error: errObras } = await admin
      .schema("biblioteca")
      .from("obras")
      .select("id", { count: "exact", head: true })
      .eq("usuario_id", usuarioId);

    if (!errObras) {
      statusBanco = true;
      totalObras = obrasCount || 0;
    }

    const { count: caractCount } = await admin
      .schema("cerebro_autoral")
      .from("caracteristicas")
      .select("id", { count: "exact", head: true })
      .eq("usuario_id", usuarioId);
    totalCaracteristicas = caractCount || 0;

    const { count: reflexCount } = await admin
      .schema("reflexoes")
      .from("entradas")
      .select("id", { count: "exact", head: true })
      .eq("usuario_id", usuarioId);
    totalReflexoes = reflexCount || 0;
  } catch (err) {
    console.error("Erro no health check:", err);
  }

  const openaiConfigurada = !!process.env.OPENAI_API_KEY;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Topo */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
          Configurações
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Gerencie sua conta, preferências e veja o estado dos serviços essenciais.
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
                <span className="text-[11px] text-slate-500">Preferências gerais do Rflex01</span>
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
                <span className="font-semibold text-slate-800 block text-xs">Segurança da conta</span>
                <span className="text-[11px] text-slate-500">
                  Controles de acesso e isolamento de dados do usuário
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
                <span className="text-[11px] text-slate-500">Português do Brasil</span>
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
                <span className="text-[11px] text-slate-500">Tema claro editorial</span>
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
          {/* Inteligência artificial */}
          <div className="py-3 flex items-center justify-between hover:bg-slate-50/60 px-2 rounded-xl transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-slate-800 block text-xs">Modelo de IA</span>
                <span className="text-[11px] text-slate-500">
                  Recursos de geração e análise do acervo
                </span>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Configurada
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
                <span className="text-[11px] text-slate-500">Integrações externas opcionais</span>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              Em breve
            </span>
          </div>
        </div>
      </div>

      {/* 3. SEÇÃO: DIAGNÓSTICO EM TEMPO REAL & MÉTRICAS DO CÉREBRO */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
          <span>Diagnóstico do sistema</span>
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-semibold normal-case">
            <Activity className="w-3 h-3 animate-pulse" /> Dados atuais
          </span>
        </h2>

        {/* Métricas Reais do Acervo */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-2xl">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Obras no Acervo</span>
            <span className="text-lg font-bold text-slate-900">{totalObras}</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-2xl">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Padrões do Cérebro</span>
            <span className="text-lg font-bold text-blue-600">{totalCaracteristicas}</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-2xl">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Reflexões Ativas</span>
            <span className="text-lg font-bold text-indigo-600">{totalReflexoes}</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {/* Supabase DB */}
          <div className="py-3 flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-slate-800 block text-xs">Banco de dados</span>
                <span className="text-[11px] text-slate-500">
                  Armazenamento e dados essenciais do Rflex01
                </span>
              </div>
            </div>
            <span
              className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                statusBanco
                  ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                  : "text-rose-700 bg-rose-50 border-rose-200"
              }`}
            >
              {statusBanco ? "Operacional" : "Inacessível"}
            </span>
          </div>

          {/* OpenAI */}
          <div className="py-3 flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-slate-800 block text-xs">Serviço de inteligência artificial</span>
                <span className="text-[11px] text-slate-500">
                  Geração, análise e vetorização do acervo
                </span>
              </div>
            </div>
            <span
              className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                openaiConfigurada
                  ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                  : "text-amber-700 bg-amber-50 border-amber-200"
              }`}
            >
              {openaiConfigurada ? "Configurado" : "Configuração pendente"}
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
                <span className="font-semibold text-slate-800 block text-xs">Rflex01</span>
                <span className="text-[11px] text-slate-500">
                  Memória e inteligência autoral
                </span>
              </div>
            </div>
            <span className="text-slate-400 text-[11px]">Rflex01</span>
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
