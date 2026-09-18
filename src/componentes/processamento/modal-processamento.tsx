"use client";

import { useState } from "react";
import { X, Cpu, CheckCircle2, AlertCircle, Loader2, Layers, Zap, BookOpen, Brain, FileText, ArrowRight } from "lucide-react";
import { iniciarProcessamentoObra } from "@/acoes/processamento";
import type { ObraDetalhada } from "@/tipos/biblioteca";

interface Props {
  obra: ObraDetalhada | null;
  aberto: boolean;
  aoFechar: () => void;
  aoConcluir: (obraId: string) => void;
}

type EtapaStatus = "esperando" | "em_andamento" | "concluido" | "erro";

interface EtapaVisual {
  id: number;
  titulo: string;
  subtitulo: string;
  icone: any;
  status: EtapaStatus;
}

export function ModalProcessamento({ obra, aberto, aoFechar, aoConcluir }: Props) {
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [etapaAtiva, setEtapaAtiva] = useState(1);
  const [progressoPercentual, setProgressoPercentual] = useState(0);

  const [resultado, setResultado] = useState<{
    totalSecoes: number;
    totalFragmentos: number;
    totalTokens: number;
    custoEstimadoUsd: number;
  } | null>(null);

  const [etapas, setEtapas] = useState<EtapaVisual[]>([
    {
      id: 1,
      titulo: "1. Leitura & Extração Estrutural",
      subtitulo: "Decodificação de parágrafos, cabeçalhos e metadados do arquivo original",
      icone: FileText,
      status: "esperando",
    },
    {
      id: 2,
      titulo: "2. Mapeamento da Arquitetura Capitular",
      subtitulo: "Identificação hierárquica de capítulos, prólogos e seções de pensamento",
      icone: BookOpen,
      status: "esperando",
    },
    {
      id: 3,
      titulo: "3. Chunking Semântico com Preservação Autoral",
      subtitulo: "Fatiamento reflexivo sem interrupção de raciocínios ou sentenças",
      icone: Layers,
      status: "esperando",
    },
    {
      id: 4,
      titulo: "4. Vetorização HNSW (Embeddings 1536d)",
      subtitulo: "Geração de representações matemáticas de alta fidelidade via OpenAI",
      icone: Zap,
      status: "esperando",
    },
    {
      id: 5,
      titulo: "5. Integração com o Cérebro Autoral",
      subtitulo: "Indexação para busca híbrida, teses recorrentes e reflexões assistidas",
      icone: Brain,
      status: "esperando",
    },
  ]);

  if (!aberto || !obra) return null;

  async function lidarProcessar() {
    const versaoId = obra?.versao_id || obra?.id;
    if (!versaoId) {
      setErro("Nenhuma versão de arquivo encontrada para esta obra.");
      return;
    }

    try {
      setProcessando(true);
      setErro(null);
      setResultado(null);
      setProgressoPercentual(10);

      // Simulação progressiva de feedback visual das etapas
      atualizarEtapa(1, "em_andamento");
      setEtapaAtiva(1);

      const timer1 = setTimeout(() => {
        atualizarEtapa(1, "concluido");
        atualizarEtapa(2, "em_andamento");
        setEtapaAtiva(2);
        setProgressoPercentual(35);
      }, 1200);

      const timer2 = setTimeout(() => {
        atualizarEtapa(2, "concluido");
        atualizarEtapa(3, "em_andamento");
        setEtapaAtiva(3);
        setProgressoPercentual(60);
      }, 2600);

      const timer3 = setTimeout(() => {
        atualizarEtapa(3, "concluido");
        atualizarEtapa(4, "em_andamento");
        setEtapaAtiva(4);
        setProgressoPercentual(85);
      }, 4200);

      // Chamada real da Server Action do Pipeline
      const res = await iniciarProcessamentoObra(versaoId);

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      if (!res.sucesso) {
        throw new Error(res.erro || "Falha desconhecida no pipeline.");
      }

      // Marcar todas como concluídas
      setEtapas((prev) =>
        prev.map((e) => ({ ...e, status: "concluido" }))
      );
      setEtapaAtiva(5);
      setProgressoPercentual(100);

      if (res.resultado) {
        setResultado(res.resultado);
      }
      aoConcluir(obra.id);
    } catch (err: any) {
      console.error("Erro ao processar obra:", err);
      setErro(err.message || "Erro inesperado durante o processamento.");
      setEtapas((prev) =>
        prev.map((e) =>
          e.id === etapaAtiva ? { ...e, status: "erro" } : e
        )
      );
    } finally {
      setProcessando(false);
    }
  }

  function atualizarEtapa(id: number, status: EtapaStatus) {
    setEtapas((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status } : e))
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
        
        {/* Cabeçalho */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                Processamento Cognitivo do Livro
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Metodologia de Extração Profunda &bull; Vetorização HNSW &bull; Ativação Ontológica
              </p>
            </div>
          </div>

          <button
            onClick={aoFechar}
            disabled={processando}
            aria-label="Fechar modal"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card do Livro Alvo */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-13 rounded-lg bg-blue-600 p-1 flex flex-col justify-between text-white shadow-xs shrink-0">
              <span className="text-[7px] font-bold uppercase opacity-80 truncate">{obra.tipo}</span>
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-slate-900 text-sm truncate">{obra.titulo}</h4>
              <p className="text-xs text-slate-500 truncate">
                {obra.autor_nome} &bull; {obra.arquivo_nome_original || "Manuscrito original"}
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${
              obra.natureza === "autoral"
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-blue-50 text-blue-700 border border-blue-200"
            }`}
          >
            {obra.natureza === "autoral" ? "Núcleo Autoral" : "Influência Externa"}
          </span>
        </div>

        {/* Barra de Progresso Geral */}
        {processando && (
          <div className="space-y-1.5 animate-in fade-in">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="font-semibold flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                Processando conteúdo do livro...
              </span>
              <span className="font-bold text-blue-600 font-mono">{progressoPercentual}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressoPercentual}%` }}
              />
            </div>
          </div>
        )}

        {/* As 5 Etapas Visuais da Metodologia */}
        <div className="space-y-2.5">
          <h4 className="text-xs uppercase tracking-wider text-slate-500 font-bold px-0.5">
            Metodologia de Processamento em 5 Fases
          </h4>
          <div className="space-y-2">
            {etapas.map((et) => {
              const Icone = et.icone;
              const isAndamento = et.status === "em_andamento";
              const isConcluido = et.status === "concluido";
              const isErro = et.status === "erro";

              return (
                <div
                  key={et.id}
                  className={`flex items-start gap-3 p-3 rounded-2xl border transition-all ${
                    isAndamento
                      ? "bg-blue-50/70 border-blue-300 shadow-xs"
                      : isConcluido
                      ? "bg-emerald-50/50 border-emerald-200"
                      : isErro
                      ? "bg-rose-50 border-rose-200"
                      : "bg-white border-slate-200/70 opacity-70"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isAndamento
                        ? "bg-blue-600 text-white"
                        : isConcluido
                        ? "bg-emerald-500 text-white"
                        : isErro
                        ? "bg-rose-500 text-white"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {isAndamento ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isConcluido ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Icone className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs font-bold leading-tight ${
                        isAndamento
                          ? "text-blue-900"
                          : isConcluido
                          ? "text-emerald-900"
                          : "text-slate-800"
                      }`}
                    >
                      {et.titulo}
                    </p>
                    <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                      {et.subtitulo}
                    </p>
                  </div>

                  {isConcluido && (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full shrink-0">
                      Concluído
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mensagem de Erro */}
        {erro && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Ocorreu uma falha no processamento</p>
              <p className="mt-0.5 text-rose-700">{erro}</p>
            </div>
          </div>
        )}

        {/* Resultado Final Estruturado */}
        {resultado && (
          <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3 text-xs animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Livro totalmente processado e integrado ao Cérebro!
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="p-2.5 bg-white border border-emerald-100 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Capítulos/Seções</span>
                <span className="text-base font-extrabold text-slate-800">{resultado.totalSecoes}</span>
              </div>

              <div className="p-2.5 bg-white border border-emerald-100 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Fragmentos / Chunks</span>
                <span className="text-base font-extrabold text-slate-800">{resultado.totalFragmentos}</span>
              </div>

              <div className="p-2.5 bg-white border border-emerald-100 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tokens Vetorizados</span>
                <span className="text-base font-extrabold text-slate-800">{resultado.totalTokens}</span>
              </div>

              <div className="p-2.5 bg-white border border-emerald-100 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Custo Estimado</span>
                <span className="text-base font-extrabold text-slate-800 font-mono">${resultado.custoEstimadoUsd.toFixed(5)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Ações / Botões Táteis */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={aoFechar}
            disabled={processando}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40"
          >
            {resultado ? "Concluir" : "Cancelar"}
          </button>

          {!resultado ? (
            <button
              type="button"
              onClick={lidarProcessar}
              disabled={processando}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/25 transition-all active:scale-95 disabled:opacity-50"
            >
              {processando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processando com IA...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Iniciar Metodologia Completa
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                aoFechar();
                window.location.href = `/biblioteca/${obra.id}`;
              }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 transition-all active:scale-95"
            >
              <BookOpen className="w-4 h-4" />
              Ver Conteúdo e Fragmentos do Livro
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
