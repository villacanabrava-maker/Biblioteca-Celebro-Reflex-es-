import { Metadata } from "next";
import {
  Settings,
  Database,
  Cpu,
  ShieldCheck,
  HardDrive,
  GitBranch,
  User,
  Sliders,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { obterPerfilUsuarioAtual } from "@/infraestrutura/auth/usuario-atual";

export const metadata: Metadata = {
  title: "Configurações do Sistema | Memória Reflexiva",
  description: "Status de infraestrutura, parâmetros de IA e perfil do autor.",
};

export const dynamic = "force-dynamic";

export default async function PaginaConfiguracoes() {
  const perfil = await obterPerfilUsuarioAtual();

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Cabeçalho */}
      <div className="border-b border-neutral-800 pb-5">
        <div className="flex items-center gap-2 text-xs font-mono text-amber-500 uppercase tracking-wider mb-1">
          <Settings className="w-4 h-4" />
          <span>Painel de Controle & Infraestrutura</span>
        </div>
        <h1 className="font-serif text-3xl font-medium text-neutral-100">
          Configurações do Sistema
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Gerenciamento dos serviços integrados, motores de inteligência artificial e identidade do autor.
        </p>
      </div>

      {/* Perfil do Autor */}
      <section className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-medium text-neutral-100">
              Identidade do Autor
            </h2>
            <p className="text-xs text-neutral-400">
              Metadados do titular do Cérebro Autoral e do acervo bibliográfico.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-neutral-500 block">
              Nome do Autor
            </span>
            <p className="text-neutral-200 font-medium text-sm">{perfil.nome}</p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-neutral-500 block">
              E-mail Canônico
            </span>
            <p className="text-neutral-200 font-mono">{perfil.email}</p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-neutral-500 block">
              Papel / Permissão
            </span>
            <span className="inline-block text-[11px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono capitalize">
              {perfil.papel} (Proprietário)
            </span>
          </div>
        </div>
      </section>

      {/* Status dos Serviços Conectados */}
      <section className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-medium text-neutral-100">
              Infraestrutura & Serviços Ativos
            </h2>
            <p className="text-xs text-neutral-400">
              Saúde das integrações de nuvem, banco de dados e APIs externas.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
          {/* Supabase Postgres */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-neutral-200 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                Supabase PostgreSQL 17.6
              </span>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" />
                Operante
              </span>
            </div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              Instância dedicada com 6 schemas canônicos, RLS ativo e índices GIN (FTS) e HNSW (pgvector).
            </p>
          </div>

          {/* Supabase Storage */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-neutral-200 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-blue-400" />
                Supabase Storage (TUS)
              </span>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" />
                Ativo
              </span>
            </div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              Bucket privado <code className="text-amber-300">originais-biblioteca</code> com limite de 500 MB e upload direto via protocolo TUS.
            </p>
          </div>

          {/* OpenAI gpt-4o */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-neutral-200 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                OpenAI gpt-4o
              </span>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" />
                Configurado
              </span>
            </div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              Motor cognitivo para extração das 18 dimensões, planejamento, redação e auditoria independente.
            </p>
          </div>

          {/* Embeddings 1536d */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-neutral-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                text-embedding-3-small
              </span>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" />
                1536 Dimensões
              </span>
            </div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              Vetorização semântica de fragmentos autorais com distância de cosseno indexada por HNSW.
            </p>
          </div>
        </div>
      </section>

      {/* Parâmetros Cognitivos Globais */}
      <section className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-medium text-neutral-100">
              Parâmetros dos Agentes de IA
            </h2>
            <p className="text-xs text-neutral-400">
              Configurações de temperatura, pesos de busca híbrida e rigor crítico.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-neutral-500 block">
              Planejador Cognitivo
            </span>
            <p className="text-neutral-200 font-mono text-sm font-semibold">
              Temperatura: 0.4
            </p>
            <p className="text-neutral-500 text-[11px]">Equilíbrio entre inventividade e rigor estrutural</p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-neutral-500 block">
              Redator Autoral
            </span>
            <p className="text-neutral-200 font-mono text-sm font-semibold">
              Temperatura: 0.5
            </p>
            <p className="text-neutral-500 text-[11px]">Fluidez ensaística, cadência frasal e estilo</p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-neutral-500 block">
              Auditor Crítico Independente
            </span>
            <p className="text-neutral-200 font-mono text-sm font-semibold text-rose-300">
              Temperatura: 0.2
            </p>
            <p className="text-neutral-500 text-[11px]">Rigor analítico máximo, ceticismo e anti-alucinação</p>
          </div>
        </div>
      </section>

      {/* Repositório & Versionamento */}
      <section className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-base font-medium text-neutral-100">
              Repositório GitHub
            </h3>
            <p className="text-xs text-neutral-400 font-mono">
              villacanabrava-maker/cerebroa-autoral-app-anty
            </p>
          </div>
        </div>

        <a
          href="https://github.com/villacanabrava-maker/cerebroa-autoral-app-anty"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-300 hover:text-white transition-colors self-start md:self-auto"
        >
          <span>Acessar no GitHub</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </section>
    </div>
  );
}
