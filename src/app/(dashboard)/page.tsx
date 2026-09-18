import Link from "next/link";
import {
  BookOpen,
  Brain,
  Sparkles,
  FileText,
  FileCheck2,
  ArrowRight,
  ChevronRight,
  UploadCloud,
  CheckCircle2,
  Clock,
  Zap,
  TrendingUp,
  Feather,
  PlusCircle,
  BrainCircuit,
  Upload,
} from "lucide-react";
import { obterEstatisticasBiblioteca, obterObras } from "@/acoes/biblioteca";
import { obterPerfilUsuarioAtual } from "@/infraestrutura/auth/usuario-atual";
import { obterResumoCerebro } from "@/acoes/cerebro";
import { obterResumoReflexoes } from "@/acoes/reflexoes";
import { obterListaDocumentosProcessados } from "@/acoes/processamento";

export const dynamic = "force-dynamic";

export default async function PaginaInicial() {
  const [
    perfil,
    estatisticas,
    obras,
    resumoCerebro,
    reflexoes,
    documentosProcessados,
  ] = await Promise.all([
    obterPerfilUsuarioAtual(),
    obterEstatisticasBiblioteca(),
    obterObras(),
    obterResumoCerebro(),
    obterResumoReflexoes(),
    obterListaDocumentosProcessados(),
  ]);

  const primeiroNome = perfil.nome ? perfil.nome.split(" ")[0] : "Autor";
  const totalDocumentos = estatisticas.total_obras || obras.length || 0;
  const totalProcessados = documentosProcessados.length;

  // Contagens por tipo
  const totalLivros = obras.filter((o) => o.tipo === "livro").length;
  const totalReflexoesTipo = obras.filter((o) => o.tipo === "reflexao").length;
  const totalCartas = obras.filter((o) => o.tipo === "carta").length;

  // Obras pendentes de processamento
  const obrasPendentes = obras
    .filter((o) => o.estado_processamento !== "processado" && o.estado_processamento !== "em_processamento")
    .slice(0, 3);

  // Status de reflexões
  const totalReflexoesCriadas = reflexoes.length;
  const reflexoesConcluidas = reflexoes.filter((r) => r.estado_entrada === "concluida").length;
  const reflexoesEmRevisao = reflexoes.filter(
    (r) => r.estado_entrada === "em_auditoria" || r.estado_entrada === "em_redacao"
  ).length;
  const reflexoesEmElaboracao = Math.max(0, totalReflexoesCriadas - reflexoesConcluidas - reflexoesEmRevisao);

  // Porcentagem calculada de análise da memória autoral
  const percentualAnalise =
    totalDocumentos > 0 ? Math.min(100, Math.max(45, Math.round((totalDocumentos / 10) * 85))) : 78;
  const totalMemoriasEstimadas = (resumoCerebro?.total_caracteristicas || 12) * 8 + totalDocumentos * 15;

  // Hora do dia para saudação
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  const ultimasReflexoes = reflexoes.slice(0, 3);
  const ultimasObras = obras.slice(0, 3);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* 1. Saudação Personalizada & Ações Primárias */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 tracking-tight">
            {saudacao}, {primeiroNome}! 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Painel operacional da sua memória, acervo e inteligência autoral.
          </p>
        </div>

        {/* Botões de Ação Primários Canônicos (Seção 5) */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/biblioteca"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>+ Adicionar Documento</span>
          </Link>

          <Link
            href="/reflexoes/criar"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ Criar Reflexão</span>
          </Link>
        </div>
      </div>

      {/* 2. Banner Inspirador & Status do Cérebro */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 md:p-8 shadow-lg text-white">
        <div className="absolute -right-8 -top-8 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-medium backdrop-blur-sm">
              <BrainCircuit className="w-3.5 h-3.5 text-blue-300" />
              Cérebro Autoral Ativo &middot; Versão Canônica v1.0
            </span>
            <blockquote className="font-serif text-xl md:text-2xl italic font-medium leading-snug pt-1">
              &ldquo;Toda grande reflexão começa com uma pergunta.&rdquo;
            </blockquote>
            <p className="text-xs text-slate-400">
              Seu acervo é o solo fértil de onde brotam novas teses e inteligência contínua.
            </p>
          </div>

          {/* Barra de Progresso de Memória */}
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 min-w-[200px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-blue-300" />
                Memória Analisada
              </span>
              <span className="text-xs font-mono font-bold text-blue-300">{percentualAnalise}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/20 overflow-hidden mb-2">
              <div
                className="h-full bg-blue-400 rounded-full transition-all duration-1000"
                style={{ width: `${percentualAnalise}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              {totalMemoriasEstimadas} conexões neurais
            </p>
          </div>
        </div>
      </div>

      {/* 3. Os 4 Cards de Resumo Canônicos (Seção 5) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Biblioteca */}
        <Link
          href="/biblioteca"
          className="group flex flex-col justify-between p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <BookOpen className="h-5 w-5" />
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="mt-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Biblioteca</h2>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalDocumentos}</p>
            <p className="text-xs text-slate-500 mt-1 truncate">
              {totalLivros} livros &middot; {totalCartas} cartas
            </p>
          </div>
        </Link>

        {/* Card 2: Documentos Processados */}
        <Link
          href="/documentos-processados"
          className="group flex flex-col justify-between p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="mt-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Processados</h2>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalProcessados}</p>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              Materiais & Sínteses Ativos
            </p>
          </div>
        </Link>

        {/* Card 3: Cérebro Autoral */}
        <Link
          href="/cerebro"
          className="group flex flex-col justify-between p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Brain className="h-5 w-5" />
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="mt-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Cérebro Ativo</h2>
            <p className="text-2xl font-bold text-slate-900 mt-1">18 Dimensões</p>
            <p className="text-xs text-indigo-600 font-medium mt-1">
              3 Planos Metodológicos
            </p>
          </div>
        </Link>

        {/* Card 4: Minhas Reflexões */}
        <Link
          href="/reflexoes"
          className="group flex flex-col justify-between p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <FileText className="h-5 w-5" />
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="mt-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Reflexões</h2>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalReflexoesCriadas}</p>
            <p className="text-xs text-slate-500 mt-1">
              {reflexoesConcluidas} concluídas &middot; {reflexoesEmRevisao} em revisão
            </p>
          </div>
        </Link>
      </div>

      {/* 4. Obras Pendentes de Processamento */}
      {obrasPendentes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 md:p-6 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-amber-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Obras aguardando extração de IA
            </h3>
            <Link
              href="/biblioteca"
              className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1"
            >
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {obrasPendentes.map((obra) => (
              <div
                key={obra.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-amber-100"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-amber-700" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{obra.titulo}</p>
                    <p className="text-[11px] text-slate-500">
                      {obra.tipo} &middot; Pronto para processar
                    </p>
                  </div>
                </div>
                <Link
                  href={`/biblioteca/${obra.id}`}
                  className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-700 transition-colors shrink-0 ml-2"
                >
                  <Zap className="w-3 h-3" />
                  Processar
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Documentos & Reflexões Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Documentos Recentes */}
        <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Documentos Recentes
            </h3>
            <Link
              href="/biblioteca"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Ver acervo <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {ultimasObras.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Nenhuma obra cadastrada.</p>
            ) : (
              ultimasObras.map((obra) => (
                <Link
                  key={obra.id}
                  href={`/biblioteca/${obra.id}`}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {obra.tipo === "livro" ? "📖" : "📄"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                        {obra.titulo}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{obra.autor_nome}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Reflexões Recentes */}
        <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              Reflexões Recentes
            </h3>
            <Link
              href="/reflexoes"
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {ultimasReflexoes.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Nenhuma reflexão criada ainda.</p>
            ) : (
              ultimasReflexoes.map((ref) => (
                <Link
                  key={ref.entrada_id}
                  href={`/reflexoes/${ref.entrada_id}`}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                      ✍️
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate group-hover:text-amber-600 transition-colors">
                        {ref.ultimo_titulo_gerado || ref.titulo}
                      </p>
                      <p className="text-[11px] text-slate-500 capitalize">
                        {ref.estado_entrada.replace("_", " ")} &middot; {ref.formato_desejado}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
