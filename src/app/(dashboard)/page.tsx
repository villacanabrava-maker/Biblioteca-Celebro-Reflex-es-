import Link from "next/link";
import {
  BookOpen,
  Brain,
  Sparkles,
  FileText,
  ArrowRight,
  ChevronRight,
  UploadCloud,
  CheckCircle2,
  Clock,
  Zap,
  TrendingUp,
  Feather,
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

  // Obras pendentes de processamento
  const obrasPendentes = obras.filter(
    (o) => o.estado_processamento !== "processado" && o.estado_processamento !== "em_processamento"
  ).slice(0, 3);

  // Status de reflexões
  const totalReflexoesCriadas = reflexoes.length;
  const reflexoesConcluidas = reflexoes.filter((r) => r.estado_entrada === "concluida").length;
  const reflexoesEmRevisao = reflexoes.filter((r) => r.estado_entrada === "em_auditoria" || r.estado_entrada === "em_redacao").length;
  const reflexoesEmElaboracao = Math.max(0, totalReflexoesCriadas - reflexoesConcluidas - reflexoesEmRevisao);

  // Porcentagem calculada de análise da memória autoral
  const percentualAnalise = totalDocumentos > 0 ? Math.min(100, Math.max(45, Math.round((totalDocumentos / 10) * 85))) : 78;
  const totalMemoriasEstimadas = (resumoCerebro?.total_caracteristicas || 12) * 8 + totalDocumentos * 15;

  // Hora do dia para saudação
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  const ultimasReflexoes = reflexoes.slice(0, 3);
  const ultimasObras = obras.slice(0, 3);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Saudação Personalizada */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 tracking-tight">
            {saudacao}, {primeiroNome}! 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Bem-vindo ao seu espaço de memória, reflexão e criação autoral.
          </p>
        </div>
        <Link
          href="/reflexoes/criar"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-600/20 transition-all active:scale-95 self-start sm:self-auto whitespace-nowrap"
        >
          <Sparkles className="w-4 h-4" />
          Nova Reflexão
        </Link>
      </div>

      {/* 2. Card Banner Inspirador */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 shadow-lg text-white">
        <div className="absolute -right-8 -top-8 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-medium backdrop-blur-sm mb-3">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              Seu universo autoral
            </span>
            <blockquote className="font-serif text-xl md:text-2xl italic font-medium leading-snug">
              &ldquo;Toda grande reflexão começa com uma pergunta.&rdquo;
            </blockquote>
            <p className="text-xs text-slate-400 mt-2">
              O passado organizado inspira um futuro mais consciente.
            </p>
          </div>

          {/* Barra de Progresso de Memória */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4 min-w-[160px]">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-blue-300" />
              <span className="text-xs font-semibold text-slate-300">Memória analisada</span>
            </div>
            <div className="text-3xl font-extrabold text-white mb-2">{percentualAnalise}%</div>
            <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full bg-blue-400 rounded-full transition-all duration-1000"
                style={{ width: `${percentualAnalise}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">{totalMemoriasEstimadas} memórias</p>
          </div>
        </div>
      </div>

      {/* 3. Os 3 Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Minha Biblioteca */}
        <Link
          href="/biblioteca"
          className="group flex flex-col justify-between p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <BookOpen className="h-6 w-6" />
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="mt-4">
            <h2 className="text-sm font-semibold text-slate-600">Minha Biblioteca</h2>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {totalDocumentos} {totalDocumentos === 1 ? "documento" : "documentos"}
            </p>
            <p className="text-xs text-slate-500 mt-1.5">
              {totalLivros} livros • {totalReflexoesTipo} reflexões • {totalCartas} cartas
            </p>
          </div>
        </Link>

        {/* Card 2: Meu Cérebro */}
        <Link
          href="/cerebro"
          className="group flex flex-col justify-between p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Brain className="h-6 w-6" />
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="mt-4">
            <h2 className="text-sm font-semibold text-slate-600">Meu Cérebro</h2>
            <div className="mt-1">
              <span className="text-2xl font-bold text-slate-900">{percentualAnalise}%</span>
              <span className="text-sm text-slate-500 ml-1">analisado</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full"
                style={{ width: `${percentualAnalise}%` }}
              />
            </div>
          </div>
        </Link>

        {/* Card 3: Minhas Reflexões */}
        <Link
          href="/reflexoes"
          className="group flex flex-col justify-between p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <FileText className="h-6 w-6" />
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="mt-4">
            <h2 className="text-sm font-semibold text-slate-600">Minhas Reflexões</h2>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {reflexoesConcluidas} concluídas
            </p>
            <p className="text-xs text-slate-500 mt-1.5">
              {reflexoesEmElaboracao} em elaboração • {reflexoesEmRevisao} em revisão
            </p>
          </div>
        </Link>
      </div>

      {/* 4. Obras Pendentes de Processamento */}
      {obrasPendentes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-amber-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Obras pendentes de processamento
            </h3>
            <Link href="/biblioteca" className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1">
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {obrasPendentes.map((obra) => (
              <div
                key={obra.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white border border-amber-100"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-amber-700" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{obra.titulo}</p>
                    <p className="text-[11px] text-slate-500">{obra.tipo} • Aguardando análise</p>
                  </div>
                </div>
                <Link
                  href="/biblioteca"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-700 transition-colors shrink-0 ml-2"
                >
                  <Zap className="w-3 h-3" />
                  Processar
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Ações Rápidas */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-0.5">
          Ações rápidas
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            href="/biblioteca"
            className="flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-2 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <UploadCloud className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-800 leading-tight">Adicionar arquivo</span>
            <span className="text-[11px] text-slate-500 mt-0.5">Novo manuscrito</span>
          </Link>

          <Link
            href="/reflexoes/criar"
            className="flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-2 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-800 leading-tight">Criar nova reflexão</span>
            <span className="text-[11px] text-slate-500 mt-0.5">Esteira de 7 etapas</span>
          </Link>

          <Link
            href="/cerebro"
            className="flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-2 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Brain className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-800 leading-tight">Consultar cérebro</span>
            <span className="text-[11px] text-slate-500 mt-0.5">Visão ontológica</span>
          </Link>

          <Link
            href="/reflexoes"
            className="flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-2 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-800 leading-tight">Ver reflexões</span>
            <span className="text-[11px] text-slate-500 mt-0.5">Histórico & status</span>
          </Link>
        </div>
      </div>

      {/* 6. Documentos & Reflexões Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Documentos Recentes */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Documentos Recentes
            </h3>
            <Link href="/biblioteca" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {ultimasObras.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Nenhum documento cadastrado ainda.
            </div>
          ) : (
            <div className="space-y-2">
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
                  {obra.estado_processamento === "processado" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      OK
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                      <Clock className="w-3 h-3" />
                      Pendente
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Reflexões Recentes */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Últimas Reflexões
            </h3>
            <Link href="/reflexoes" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {ultimasReflexoes.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-slate-400 text-xs">Nenhuma reflexão gerada ainda.</p>
              <Link
                href="/reflexoes/criar"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Criar primeira reflexão
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {ultimasReflexoes.map((ref) => (
                <Link
                  key={ref.entrada_id}
                  href={`/reflexoes/${ref.entrada_id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-11 rounded-lg bg-indigo-50 border border-indigo-200/60 flex items-center justify-center shrink-0">
                      <Feather className="w-4 h-4 text-indigo-600" />
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
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                    ref.estado_entrada === "concluida"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-blue-50 text-blue-700 border border-blue-200"
                  }`}>
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
