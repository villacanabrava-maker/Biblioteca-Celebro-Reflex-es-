"use client";

import { useState } from "react";
import {
  X,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
  Sparkles,
  Zap,
} from "lucide-react";
import { iniciarProcessamentoObra } from "@/acoes/processamento";
import type { ObraDetalhada } from "@/tipos/biblioteca";

interface Props {
  obra: ObraDetalhada | null;
  aberto: boolean;
  aoFechar: () => void;
  aoConcluir: (obraId: string) => void;
}

export function ModalProcessamento({ obra, aberto, aoFechar, aoConcluir }: Props) {
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{
    totalSecoes: number;
    totalFragmentos: number;
    totalTokens: number;
    custoEstimadoUsd: number;
  } | null>(null);

  if (!aberto || !obra) return null;

  async function lidarProcessar() {
    if (!obra?.versao_id) {
      setErro("Nenhuma versão de arquivo encontrada para esta obra.");
      return;
    }

    try {
      setProcessando(true);
      setErro(null);
      setResultado(null);

      const res = await iniciarProcessamentoObra(obra.versao_id);

      if (!res.sucesso) {
        throw new Error(res.erro || "Falha desconhecida no pipeline.");
      }

      if (res.resultado) {
        setResultado(res.resultado);
      }
      aoConcluir(obra.id);
    } catch (err: any) {
      console.error("Erro ao processar obra:", err);
      setErro(err.message || "Erro inesperado durante o processamento.");
    } finally {
      setProcessando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-medium text-neutral-100">
                Processamento Cognitivo
              </h3>
              <p className="text-xs text-neutral-400">
                Extração semântica, vetorização 1536d e ativação ontológica
              </p>
            </div>
          </div>
          <button
            onClick={aoFechar}
            disabled={processando}
            aria-label="Fechar modal"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Detalhes da Obra */}
        <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400">Obra Alvo:</span>
            <span
              className={`px-2 py-0.5 rounded-full font-medium ${
                obra.natureza === "autoral"
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                  : "bg-blue-500/15 text-blue-300 border border-blue-500/30"
              }`}
            >
              {obra.natureza === "autoral" ? "Núcleo Autoral" : "Influência Externa"}
            </span>
          </div>
          <p className="font-serif text-sm font-medium text-neutral-100 line-clamp-1">
            {obra.titulo}
          </p>
          <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono pt-1">
            <span>{obra.autor_nome}</span>
            <span>•</span>
            <span>{obra.arquivo_nome_original || "Documento"}</span>
          </div>
        </div>

        {/* Etapas do Pipeline */}
        <div className="space-y-3">
          <h4 className="text-xs uppercase tracking-wider text-neutral-400 font-medium">
            Etapas do Pipeline Durável
          </h4>
          <div className="space-y-2 text-xs text-neutral-300">
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-neutral-950 border border-neutral-800/80">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>1. Extração do texto original preservando parágrafos</span>
            </div>
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-neutral-950 border border-neutral-800/80">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>2. Chunking semântico hierárquico (seções e fragmentos)</span>
            </div>
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-neutral-950 border border-neutral-800/80">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>3. Geração de vetores 1536d (OpenAI text-embedding-3-small)</span>
            </div>
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-neutral-950 border border-neutral-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>4. Publicação atômica e ativação no Cérebro Autoral</span>
            </div>
          </div>
        </div>

        {/* Mensagem de Erro */}
        {erro && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{erro}</span>
          </div>
        )}

        {/* Resultado Concluído */}
        {resultado && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-300 font-medium text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Processamento concluído com sucesso!
            </div>
            <div className="grid grid-cols-2 gap-2 text-neutral-300 pt-1 font-mono">
              <div>Seções: {resultado.totalSecoes}</div>
              <div>Fragmentos: {resultado.totalFragmentos}</div>
              <div>Tokens: {resultado.totalTokens}</div>
              <div>Custo: ${resultado.custoEstimadoUsd.toFixed(6)}</div>
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={aoFechar}
            disabled={processando}
            className="px-4 py-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors disabled:opacity-40"
          >
            {resultado ? "Fechar" : "Cancelar"}
          </button>
          {!resultado && (
            <button
              type="button"
              onClick={lidarProcessar}
              disabled={processando}
              className="px-5 py-2 rounded-lg text-xs font-medium bg-amber-500 hover:bg-amber-400 text-neutral-950 transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              {processando ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Processando com IA...
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5" />
                  Executar Pipeline
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
