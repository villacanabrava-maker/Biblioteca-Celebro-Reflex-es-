import Link from "next/link";
import {
  BookOpen,
  Brain,
  Sparkles,
  Plus,
  ArrowRight,
  Compass,
  ShieldCheck,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Ban,
  Layers,
} from "lucide-react";
import { obterEstatisticasBiblioteca, obterObras } from "@/acoes/biblioteca";
import { obterPerfilUsuarioAtual } from "@/infraestrutura/auth/usuario-atual";
import { obterResumoCerebro } from "@/acoes/cerebro";
import { obterConceitos } from "@/acoes/taxonomia";
import { obterResumoReflexoes } from "@/acoes/reflexoes";

export const dynamic = "force-dynamic";

export default async function PaginaInicial() {
  const [
    perfil,
    estatisticas,
    ultimasObras,
    resumoCerebro,
    conceitos,
    reflexoes,
  ] = await Promise.all([
    obterPerfilUsuarioAtual(),
    obterEstatisticasBiblioteca(),
    obterObras(),
    obterResumoCerebro(),
    obterConceitos(),
    obterResumoReflexoes(),
  ]);

  const obrasRecentes = ultimasObras.slice(0, 3);
  const reflexoesRecentes = reflexoes.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-8">
      {/* Boas-vindas */}
      <section className="flex flex-col gap-1">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif font-medium tracking-tight text-neutral-100">
          Olá, {perfil.nome.split(" ")[0]}!
        </h2>
        <p className="text-sm md:text-base text-neutral-400">
          Bem-vindo ao seu ateliê de memória reflexiva, inteligência autoral e criação metodológica.
        </p>
      </section>

      {/* Card Inspirador (Princípio Autoral Canônico) */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-neutral-950 border border-amber-500/20 p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-medium text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Princípio Inegociável do Cérebro Autoral
            </span>
          </div>
          <blockquote className="mt-4 font-serif text-xl md:text-2xl italic leading-snug text-neutral-100">
            &ldquo;O Cérebro Autoral não é um gerador de textos no meu estilo; é o mapeamento rigoroso
            de como penso, interpreto, associo, argumento e reviso.&rdquo;
          </blockquote>
          <p className="mt-3 text-xs md:text-sm text-neutral-400 leading-relaxed">
            Fórmula epistemológica:{" "}
            <strong className="text-amber-300 font-mono">
              Cérebro Ativo = Núcleo Autoral + Influências Externas Deliberadas
            </strong>
            . Fontes externas dialogam sem jamais virar autoria silenciosamente.
          </p>
        </div>
      </section>

      {/* Grid de Resumo dos 4 Motores Centrais */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card Biblioteca */}
        <Link
          href="/biblioteca"
          className="group relative flex flex-col justify-between rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 shadow-sm transition-all hover:border-amber-500/40 hover:bg-neutral-900/90 hover:shadow-xl hover:shadow-black/40"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 transition-colors group-hover:bg-amber-500 group-hover:text-neutral-950">
              <BookOpen className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-neutral-500 transition-transform group-hover:translate-x-1 group-hover:text-amber-400" />
          </div>
          <div className="mt-5">
            <h3 className="font-medium text-xs font-mono uppercase tracking-wider text-neutral-400 group-hover:text-amber-300 transition-colors">
              Biblioteca & Acervo
            </h3>
            <p className="text-2xl font-serif font-medium text-neutral-100 mt-1">
              {estatisticas.total_obras} {estatisticas.total_obras === 1 ? "Obra" : "Obras"}
            </p>
            <p className="text-[11px] text-neutral-500 mt-1">
              {estatisticas.total_autorais} no Núcleo Autoral • {estatisticas.total_influencias_externas} influências
            </p>
          </div>
        </Link>

        {/* Card Cérebro Autoral */}
        <Link
          href="/cerebro"
          className="group relative flex flex-col justify-between rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 shadow-sm transition-all hover:border-amber-500/40 hover:bg-neutral-900/90 hover:shadow-xl hover:shadow-black/40"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 transition-colors group-hover:bg-purple-500 group-hover:text-neutral-950">
              <Brain className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-neutral-500 transition-transform group-hover:translate-x-1 group-hover:text-purple-400" />
          </div>
          <div className="mt-5">
            <h3 className="font-medium text-xs font-mono uppercase tracking-wider text-neutral-400 group-hover:text-purple-300 transition-colors">
              Cérebro Autoral
            </h3>
            <p className="text-2xl font-serif font-medium text-neutral-100 mt-1">
              18 Dimensões
            </p>
            <p className="text-[11px] text-neutral-500 mt-1">
              {resumoCerebro.total_caracteristicas} carac. • {resumoCerebro.total_regras} regras ativas
            </p>
          </div>
        </Link>

        {/* Card Taxonomia */}
        <Link
          href="/taxonomia"
          className="group relative flex flex-col justify-between rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 shadow-sm transition-all hover:border-blue-500/40 hover:bg-neutral-900/90 hover:shadow-xl hover:shadow-black/40"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 transition-colors group-hover:bg-blue-500 group-hover:text-neutral-950">
              <Compass className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-neutral-500 transition-transform group-hover:translate-x-1 group-hover:text-blue-400" />
          </div>
          <div className="mt-5">
            <h3 className="font-medium text-xs font-mono uppercase tracking-wider text-neutral-400 group-hover:text-blue-300 transition-colors">
              Taxonomia Semântica
            </h3>
            <p className="text-2xl font-serif font-medium text-neutral-100 mt-1">
              {conceitos.length} {conceitos.length === 1 ? "Conceito" : "Conceitos"}
            </p>
            <p className="text-[11px] text-neutral-500 mt-1">
              Ontologia canônica e rede semântica
            </p>
          </div>
        </Link>

        {/* Card Estúdio de Reflexões */}
        <Link
          href="/reflexoes"
          className="group relative flex flex-col justify-between rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 shadow-sm transition-all hover:border-emerald-500/40 hover:bg-neutral-900/90 hover:shadow-xl hover:shadow-black/40"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 transition-colors group-hover:bg-emerald-500 group-hover:text-neutral-950">
              <Sparkles className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-neutral-500 transition-transform group-hover:translate-x-1 group-hover:text-emerald-400" />
          </div>
          <div className="mt-5">
            <h3 className="font-medium text-xs font-mono uppercase tracking-wider text-neutral-400 group-hover:text-emerald-300 transition-colors">
              Estúdio de Reflexões
            </h3>
            <p className="text-2xl font-serif font-medium text-neutral-100 mt-1">
              {reflexoes.length} {reflexoes.length === 1 ? "Ensaio" : "Ensaios"}
            </p>
            <p className="text-[11px] text-neutral-500 mt-1">
              Com Auditor Crítico Independente
            </p>
          </div>
        </Link>
      </section>

      {/* Reflexões Recentes */}
      {reflexoesRecentes.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-medium text-neutral-100">
              Reflexões Recentes no Estúdio
            </h3>
            <Link
              href="/reflexoes"
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              <span>Ver todas as reflexões</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reflexoesRecentes.map((ref) => (
              <Link
                key={ref.entrada_id}
                href={`/reflexoes/${ref.entrada_id}`}
                className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800 hover:border-neutral-700 transition-all hover:bg-neutral-900 flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase bg-neutral-950 border border-neutral-800 text-amber-400">
                      {ref.formato_desejado}
                    </span>
                    <span className="text-[10px] text-neutral-500 capitalize">
                      {ref.estado_entrada.replace("_", " ")}
                    </span>
                  </div>

                  <h4 className="font-serif text-base font-medium text-neutral-200 group-hover:text-amber-300 transition-colors line-clamp-1">
                    {ref.ultimo_titulo_gerado || ref.titulo}
                  </h4>
                  <p className="text-xs text-neutral-400 line-clamp-2 mt-1">
                    {ref.tema_central}
                  </p>
                </div>

                <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                  <span>
                    {ref.total_versoes > 0 ? `${ref.total_versoes} versão(ões)` : "Sem versões"}
                  </span>
                  {ref.ultima_pontuacao_auditoria !== null && ref.ultima_pontuacao_auditoria !== undefined && (
                    <span className="text-emerald-400 font-semibold">
                      Auditor: {Math.round(ref.ultima_pontuacao_auditoria * 100)}%
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

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
                className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase ${
                        obra.natureza === "autoral"
                          ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                          : "bg-blue-500/10 text-blue-300 border border-blue-500/30"
                      }`}
                    >
                      {obra.natureza === "autoral" ? "Núcleo Autoral" : "Influência"}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono capitalize">
                      {obra.tipo}
                    </span>
                  </div>

                  <h4 className="font-serif text-base font-medium text-neutral-200 line-clamp-1">
                    {obra.titulo}
                  </h4>
                  {obra.subtitulo && (
                    <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">
                      {obra.subtitulo}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                  <span>{obra.ano_publicacao || "Sem ano"}</span>
                  <span className="text-neutral-400">
                    {obra.total_versoes} arquivo(s)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
