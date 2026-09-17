import Link from "next/link";
import { BookOpen, Brain, Sparkles, PlusCircle, ArrowRight, Compass, ShieldCheck } from "lucide-react";

export default function PaginaInicial() {
  return (
    <div className="flex flex-col gap-6">
      {/* Boas-vindas */}
      <section className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
          Olá, Robert!
        </h2>
        <p className="text-sm text-slate-500">
          Bem-vindo ao seu espaço de memória, reflexão e criação.
        </p>
      </section>

      {/* Card Inspirador (Editorial) */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-6 text-white shadow-md">
        <div className="relative z-10 max-w-xl">
          <span className="inline-block rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-200 backdrop-blur-sm">
            Princípio Autoral
          </span>
          <blockquote className="mt-3 font-serif text-xl italic leading-snug md:text-2xl text-slate-100">
            &ldquo;Toda grande reflexão começa com uma pergunta.&rdquo;
          </blockquote>
          <p className="mt-2 text-xs text-slate-300">
            Seu acervo. Sua inteligência. Novas reflexões guiadas pela sua metodologia de pensamento.
          </p>
        </div>
      </section>

      {/* Grid de Resumo do Acervo */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Card Biblioteca */}
        <Link
          href="/biblioteca"
          className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
              <BookOpen className="h-6 w-6" />
            </div>
            <ArrowRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-blue-600" />
          </div>
          <div className="mt-4">
            <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
              Minha Biblioteca
            </h3>
            <p className="text-2xl font-bold text-slate-900 mt-1">Acervo Limpo</p>
            <p className="text-xs text-slate-500 mt-0.5">Livros, cartas, textos e referências</p>
          </div>
        </Link>

        {/* Card Meu Cérebro */}
        <Link
          href="/cerebro"
          className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
              <Brain className="h-6 w-6" />
            </div>
            <ArrowRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-indigo-600" />
          </div>
          <div className="mt-4">
            <h3 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
              Meu Cérebro
            </h3>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-bold text-slate-900">18 Dimensões</p>
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                Pronto
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Metodologia de pensamento e expressão</p>
          </div>
        </Link>

        {/* Card Minhas Reflexões */}
        <Link
          href="/reflexoes"
          className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 transition-colors group-hover:bg-purple-600 group-hover:text-white">
              <Sparkles className="h-6 w-6" />
            </div>
            <ArrowRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-purple-600" />
          </div>
          <div className="mt-4">
            <h3 className="font-semibold text-slate-800 group-hover:text-purple-600 transition-colors">
              Minhas Reflexões
            </h3>
            <p className="text-2xl font-bold text-slate-900 mt-1">Motor Pronto</p>
            <p className="text-xs text-slate-500 mt-0.5">Plano, redação e auditoria independente</p>
          </div>
        </Link>
      </section>

      {/* Ações Rápidas */}
      <section className="flex flex-col gap-3 mt-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Ações Rápidas
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link
            href="/biblioteca"
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center transition-all hover:border-blue-300 hover:bg-blue-50/40"
          >
            <PlusCircle className="h-6 w-6 text-blue-600" />
            <span className="text-xs font-medium text-slate-700">Adicionar arquivo</span>
          </Link>

          <Link
            href="/reflexoes"
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center transition-all hover:border-blue-300 hover:bg-blue-50/40"
          >
            <Sparkles className="h-6 w-6 text-purple-600" />
            <span className="text-xs font-medium text-slate-700">Criar nova reflexão</span>
          </Link>

          <Link
            href="/cerebro"
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center transition-all hover:border-blue-300 hover:bg-blue-50/40"
          >
            <Compass className="h-6 w-6 text-indigo-600" />
            <span className="text-xs font-medium text-slate-700">Consultar meu cérebro</span>
          </Link>

          <Link
            href="/reflexoes"
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center transition-all hover:border-blue-300 hover:bg-blue-50/40"
          >
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
            <span className="text-xs font-medium text-slate-700">Auditoria autoral</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
