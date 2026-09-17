import Link from "next/link";
import {
  BookOpen,
  Brain,
  Sparkles,
  PlusCircle,
  ArrowRight,
  Compass,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { obterEstatisticasBiblioteca, obterObras } from "@/acoes/biblioteca";
import { obterPerfilUsuarioAtual } from "@/infraestrutura/auth/usuario-atual";

export const dynamic = "force-dynamic";

export default async function PaginaInicial() {
  const [perfil, estatisticas, ultimasObras] = await Promise.all([
    obterPerfilUsuarioAtual(),
    obterEstatisticasBiblioteca(),
    obterObras(),
  ]);

  const obrasRecentes = ultimasObras.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-8">
      {/* Boas-vindas */}
      <section className="flex flex-col gap-1">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif font-medium tracking-tight text-neutral-100">
          Olá, {perfil.nome.split(" ")[0]}!
        </h2>
        <p className="text-sm md:text-base text-neutral-400">
          Bem-vindo ao seu espaço de memória reflexiva, inteligência autoral e criação metodológica.
        </p>
      </section>

      {/* Card Inspirador (Princípio Autoral Canônico) */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-neutral-950 border border-amber-500/20 p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-medium text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Princípio Fundamental do Cérebro Autoral
            </span>
          </div>
          <blockquote className="mt-4 font-serif text-xl md:text-2xl italic leading-snug text-neutral-100">
            &ldquo;O Cérebro Autoral não é um gerador de textos no meu estilo; é o mapeamento rigoroso
            de como penso, interpreto, associo, argumento e reviso.&rdquo;
          </blockquote>
          <p className="mt-3 text-xs md:text-sm text-neutral-400 leading-relaxed">
            Fórmula epistemológica: <strong className="text-amber-300 font-mono">Cérebro Ativo = Núcleo Autoral + Influências Externas Deliberadas</strong>. Fontes externas dialogam sem jamais virar autoria silenciosamente.
          </p>
        </div>
      </section>

      {/* Grid de Resumo dos 3 Motores */}
      <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Card Biblioteca */}
        <Link
          href="/biblioteca"
          className="group relative flex flex-col justify-between rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 shadow-sm transition-all hover:border-amber-500/40 hover:bg-neutral-900/90 hover:shadow-xl hover:shadow-black/40"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 transition-colors group-hover:bg-amber-500 group-hover:text-neutral-950">
              <BookOpen className="h-6 w-6" />
            </div>
            <ArrowRight className="h-5 w-5 text-neutral-500 transition-transform group-hover:translate-x-1 group-hover:text-amber-400" />
          </div>
          <div className="mt-6">
            <h3 className="font-medium text-neutral-300 group-hover:text-amber-300 transition-colors">
              Biblioteca & Acervo
            </h3>
            <p className="text-2xl md:text-3xl font-serif font-medium text-neutral-100 mt-1">
              {estatisticas.total_obras} {estatisticas.total_obras === 1 ? "Obra" : "Obras"}
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              {estatisticas.total_autorais} no Núcleo Autoral • {estatisticas.total_influencias_externas} Influências
            </p>
          </div>
        </Link>

        {/* Card Meu Cérebro */}
        <Link
          href="/cerebro"
          className="group relative flex flex-col justify-between rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 shadow-sm transition-all hover:border-indigo-500/40 hover:bg-neutral-900/90 hover:shadow-xl hover:shadow-black/40"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 transition-colors group-hover:bg-indigo-500 group-hover:text-neutral-950">
              <Brain className="h-6 w-6" />
            </div>
            <ArrowRight className="h-5 w-5 text-neutral-500 transition-transform group-hover:translate-x-1 group-hover:text-indigo-400" />
          </div>
          <div className="mt-6">
            <h3 className="font-medium text-neutral-300 group-hover:text-indigo-300 transition-colors">
              Cérebro Autoral
            </h3>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl md:text-3xl font-serif font-medium text-neutral-100">
                18 Dimensões
              </p>
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-xs font-medium text-emerald-300">
                Ativo
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Metodologia de pensamento, associação e escrita
            </p>
          </div>
        </Link>

        {/* Card Minhas Reflexões */}
        <Link
          href="/reflexoes"
          className="group relative flex flex-col justify-between rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 shadow-sm transition-all hover:border-purple-500/40 hover:bg-neutral-900/90 hover:shadow-xl hover:shadow-black/40"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 transition-colors group-hover:bg-purple-500 group-hover:text-neutral-950">
              <Sparkles className="h-6 w-6" />
            </div>
            <ArrowRight className="h-5 w-5 text-neutral-500 transition-transform group-hover:translate-x-1 group-hover:text-purple-400" />
          </div>
          <div className="mt-6">
            <h3 className="font-medium text-neutral-300 group-hover:text-purple-300 transition-colors">
              Minhas Reflexões
            </h3>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl md:text-3xl font-serif font-medium text-neutral-100">
                Motor Reflexivo
              </p>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Redação em 6 etapas com Auditor Independente
            </p>
          </div>
        </Link>
      </section>

      {/* Obras Recentes no Acervo */}
      {obrasRecentes.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-medium text-neutral-100">
              Obras Recentes no Acervo
            </h3>
            <Link
              href="/biblioteca"
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              <span>Ver todas as obras</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {obrasRecentes.map((obra) => (
              <div
                key={obra.id}
                className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        obra.natureza === "autoral"
                          ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                          : "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                      }`}
                    >
                      {obra.natureza === "autoral" ? "Núcleo Autoral" : "Influência Externa"}
                    </span>
                    <span className="text-[11px] text-neutral-400 font-mono capitalize">
                      {obra.tipo}
                    </span>
                  </div>
                  <h4 className="font-serif font-medium text-neutral-200 line-clamp-1 text-sm">
                    {obra.titulo}
                  </h4>
                  {obra.subtitulo && (
                    <p className="text-xs text-neutral-400 line-clamp-1 italic mt-0.5">
                      {obra.subtitulo}
                    </p>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-neutral-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-neutral-400 font-mono">{obra.autor_nome}</span>
                  <div className="flex items-center gap-1">
                    {obra.estado_processamento === "processado" ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Processado
                      </span>
                    ) : (
                      <span className="text-amber-400/90 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Pendente
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Ações Rápidas */}
      <section className="space-y-3 pt-2">
        <h3 className="text-xs uppercase tracking-wider text-neutral-400 font-medium">
          Ações Rápidas
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link
            href="/biblioteca"
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 text-center transition-all hover:border-amber-500/40 hover:bg-neutral-900/90 group"
          >
            <PlusCircle className="h-6 w-6 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium text-neutral-300 group-hover:text-amber-300 transition-colors">
              Adicionar ao Acervo
            </span>
          </Link>

          <Link
            href="/reflexoes"
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 text-center transition-all hover:border-purple-500/40 hover:bg-neutral-900/90 group"
          >
            <Sparkles className="h-6 w-6 text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium text-neutral-300 group-hover:text-purple-300 transition-colors">
              Criar Nova Reflexão
            </span>
          </Link>

          <Link
            href="/cerebro"
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 text-center transition-all hover:border-indigo-500/40 hover:bg-neutral-900/90 group"
          >
            <Compass className="h-6 w-6 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium text-neutral-300 group-hover:text-indigo-300 transition-colors">
              Consultar Meu Cérebro
            </span>
          </Link>

          <Link
            href="/auditoria"
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 text-center transition-all hover:border-emerald-500/40 hover:bg-neutral-900/90 group"
          >
            <ShieldCheck className="h-6 w-6 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium text-neutral-300 group-hover:text-emerald-300 transition-colors">
              Auditoria Autoral
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
