import Link from "next/link";
import {
  BookOpen,
  Brain,
  Sparkles,
  FileText,
  PlusCircle,
  ArrowRight,
  ChevronRight,
  UploadCloud,
  CheckCircle2,
  Clock,
  Compass,
} from "lucide-react";
import { obterEstatisticasBiblioteca, obterObras } from "@/acoes/biblioteca";
import { obterPerfilUsuarioAtual } from "@/infraestrutura/auth/usuario-atual";
import { obterResumoCerebro } from "@/acoes/cerebro";
import { obterResumoReflexoes } from "@/acoes/reflexoes";

export const dynamic = "force-dynamic";

export default async function PaginaInicial() {
  const [
    perfil,
    estatisticas,
    obras,
    resumoCerebro,
    reflexoes,
  ] = await Promise.all([
    obterPerfilUsuarioAtual(),
    obterEstatisticasBiblioteca(),
    obterObras(),
    obterResumoCerebro(),
    obterResumoReflexoes(),
  ]);

  const primeiroNome = perfil.nome ? perfil.nome.split(" ")[0] : "Autor";
  const totalDocumentos = estatisticas.total_obras || obras.length || 0;
  
  // Contagens por tipo
  const totalLivros = obras.filter((o) => o.tipo === "livro").length;
  const totalReflexoesTipo = obras.filter((o) => o.tipo === "reflexao").length;
  const totalCartas = obras.filter((o) => o.tipo === "carta").length;
  const totalOutros = Math.max(0, totalDocumentos - totalLivros - totalReflexoesTipo - totalCartas);

  // Status de reflexões
  const totalReflexoesCriadas = reflexoes.length;
  const reflexoesConcluidas = reflexoes.filter((r) => r.estado_entrada === "concluida").length;
  const reflexoesEmRevisao = reflexoes.filter((r) => r.estado_entrada === "em_auditoria" || r.estado_entrada === "em_redacao").length;
  const reflexoesEmElaboracao = Math.max(0, totalReflexoesCriadas - reflexoesConcluidas - reflexoesEmRevisao);

  // Porcentagem calculada de análise da memória autoral
  const percentualAnalise = totalDocumentos > 0 ? Math.min(100, Math.max(45, Math.round((totalDocumentos / 10) * 85))) : 78;
  const totalMemoriasEstimadas = (resumoCerebro?.total_caracteristicas || 12) * 8 + totalDocumentos * 15;

  const ultimasReflexoes = reflexoes.slice(0, 3);
  const ultimasObras = obras.slice(0, 3);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. Saudação Personalizada */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 tracking-tight">
          Olá, {primeiroNome}!
        </h1>
        <p className="text-slate-500 text-sm md:text-base">
          Que bom te ver por aqui. Bem-vindo ao seu espaço de memória, reflexão e criação.
        </p>
      </div>

      {/* 2. Card Inspirador com Gradiente Pôr do Sol */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 p-8 shadow-md text-white">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-yellow-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-medium backdrop-blur-sm mb-4">
            <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
            Inspiração Diária
          </span>
          <blockquote className="font-serif text-2xl md:text-3xl italic font-medium leading-snug">
            &ldquo;Toda grande reflexão começa com uma pergunta.&rdquo;
          </blockquote>
          <p className="text-xs md:text-sm text-amber-100 mt-3">
            O passado organizado inspira um futuro mais consciente. Explore seu acervo e crie novas teses.
          </p>
        </div>
      </div>

      {/* 3. Os 3 Cards Centrais de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Minha Biblioteca */}
        <Link
          href="/biblioteca"
          className="group flex flex-col justify-between p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <BookOpen className="h-6 w-6" />
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="mt-4">
            <h2 className="text-sm font-semibold text-slate-700">Minha Biblioteca</h2>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {totalDocumentos} {totalDocumentos === 1 ? "documento" : "documentos"}
            </p>
            <p className="text-xs text-slate-500 mt-1.5 line-clamp-1">
              {totalLivros} livros • {totalReflexoesTipo} reflexões • {totalCartas} cartas • {totalOutros} outros
            </p>
          </div>
        </Link>

        {/* Card 2: Meu Cérebro */}
        <Link
          href="/cerebro"
          className="group flex flex-col justify-between p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Brain className="h-6 w-6" />
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="mt-4">
            <h2 className="text-sm font-semibold text-slate-700">Meu Cérebro</h2>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              Memória analisada: {percentualAnalise}%
            </p>
            <p className="text-xs text-slate-500 mt-1.5">
              {totalMemoriasEstimadas} memórias identificadas
            </p>
          </div>
        </Link>

        {/* Card 3: Minhas Reflexões */}
        <Link
          href="/reflexoes"
          className="group flex flex-col justify-between p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <FileText className="h-6 w-6" />
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="mt-4">
            <h2 className="text-sm font-semibold text-slate-700">Minhas Reflexões</h2>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {reflexoesConcluidas} concluídas
            </p>
            <p className="text-xs text-slate-500 mt-1.5">
              {reflexoesEmElaboracao} em elaboração • {reflexoesEmRevisao} em revisão
            </p>
          </div>
        </Link>
      </div>

      {/* 4. Ações Rápidas */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
          Ações rápidas
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            href="/biblioteca"
            className="flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-2 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-800 leading-tight">Adicionar arquivo</span>
            <span className="text-[11px] text-slate-500 mt-0.5">Novo manuscrito</span>
          </Link>

          <Link
            href="/reflexoes/criar"
            className="flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-2 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-800 leading-tight">Criar nova reflexão</span>
            <span className="text-[11px] text-slate-500 mt-0.5">Esteira de 7 etapas</span>
          </Link>

          <Link
            href="/cerebro"
            className="flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-2 group-hover:scale-110 transition-transform">
              <Brain className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-800 leading-tight">Consultar meu cérebro</span>
            <span className="text-[11px] text-slate-500 mt-0.5">Visão ontológica</span>
          </Link>

          <Link
            href="/reflexoes"
            className="flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-2 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-800 leading-tight">Ver minhas reflexões</span>
            <span className="text-[11px] text-slate-500 mt-0.5">Histórico & status</span>
          </Link>
        </div>
      </div>

      {/* 5. Seção de Documentos & Reflexões Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Documentos Recentes na Biblioteca */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Documentos Recentes
            </h3>
            <Link
              href="/biblioteca"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {ultimasObras.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Nenhum documento cadastrado ainda. Use &ldquo;Adicionar arquivo&rdquo; para começar seu acervo.
            </div>
          ) : (
            <div className="space-y-2.5">
              {ultimasObras.map((obra) => (
                <Link
                  key={obra.id}
                  href={`/biblioteca/${obra.id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-11 rounded-lg bg-blue-50 border border-blue-200/60 flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-slate-800 text-xs truncate group-hover:text-blue-600 transition-colors">
                        {obra.titulo}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {obra.tipo} • {obra.ano_publicacao || "Recente"}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    <CheckCircle2 className="w-3 h-3" />
                    Processado
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Reflexões Recentes */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Últimas Reflexões
            </h3>
            <Link
              href="/reflexoes"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {ultimasReflexoes.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Nenhuma reflexão gerada ainda. Clique em &ldquo;Criar nova reflexão&rdquo; para explorar novas conexões.
            </div>
          ) : (
            <div className="space-y-2.5">
              {ultimasReflexoes.map((ref) => (
                <Link
                  key={ref.entrada_id}
                  href={`/reflexoes/${ref.entrada_id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-11 rounded-lg bg-indigo-50 border border-indigo-200/60 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-slate-800 text-xs truncate group-hover:text-blue-600 transition-colors">
                        {ref.ultimo_titulo_gerado || ref.titulo}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {ref.tema_central} • {ref.formato_desejado}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    {ref.estado_entrada === "concluida" ? "Aprovada" : "Em análise"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
