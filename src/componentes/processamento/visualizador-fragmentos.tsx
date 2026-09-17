"use client";

import { useState, useEffect } from "react";
import {
  X,
  FileText,
  Search,
  Sparkles,
  BookOpen,
  Hash,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { obterDocumentoProcessado, obterFragmentosDocumento } from "@/acoes/processamento";
import type { ObraDetalhada } from "@/tipos/biblioteca";
import type { DocumentoProcessado, FragmentoTextual } from "@/tipos/processamento";

interface Props {
  obra: ObraDetalhada | null;
  aberto: boolean;
  aoFechar: () => void;
}

export function VisualizadorFragmentos({ obra, aberto, aoFechar }: Props) {
  const [carregando, setCarregando] = useState(false);
  const [docProcessado, setDocProcessado] = useState<DocumentoProcessado | null>(null);
  const [fragmentos, setFragmentos] = useState<FragmentoTextual[]>([]);
  const [termoFiltro, setTermoFiltro] = useState("");

  useEffect(() => {
    if (!aberto || !obra?.versao_id) return;

    let cancelado = false;
    async function carregarDados() {
      setCarregando(true);
      try {
        const doc = await obterDocumentoProcessado(obra!.versao_id!);
        if (cancelado) return;
        setDocProcessado(doc);

        if (doc) {
          const frags = await obterFragmentosDocumento(doc.id, 100);
          if (cancelado) return;
          setFragmentos(frags);
        }
      } catch (err) {
        console.error("Erro ao carregar fragmentos:", err);
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    carregarDados();
    return () => {
      cancelado = true;
    };
  }, [aberto, obra]);

  if (!aberto || !obra) return null;

  const fragmentosFiltrados = termoFiltro.trim()
    ? fragmentos.filter((f) =>
        f.conteudo.toLowerCase().includes(termoFiltro.toLowerCase().trim())
      )
    : fragmentos;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Cabeçalho */}
        <div className="px-6 py-5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-serif font-medium text-neutral-100">
                  {obra.titulo}
                </h2>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    obra.natureza === "autoral"
                      ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                      : "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                  }`}
                >
                  {obra.natureza === "autoral" ? "Núcleo Autoral" : "Influência Externa"}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                {docProcessado
                  ? `${docProcessado.total_fragmentos} fragmentos • ${docProcessado.total_palavras} palavras • Publicado e Ativo no Cérebro`
                  : "Estrutura documental e unidades recuperáveis"}
              </p>
            </div>
          </div>
          <button
            onClick={aoFechar}
            aria-label="Fechar visualizador"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Filtro Rápido */}
        <div className="p-4 border-b border-neutral-800/80 bg-neutral-950/60">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={termoFiltro}
              onChange={(e) => setTermoFiltro(e.target.value)}
              placeholder="Filtrar trecho ou palavra nos fragmentos processados..."
              className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>

        {/* Corpo com Lista de Fragmentos */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {carregando ? (
            <div className="py-20 text-center text-neutral-400 flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
              <p className="text-xs">Carregando unidades de conhecimento e fragmentos...</p>
            </div>
          ) : fragmentosFiltrados.length > 0 ? (
            fragmentosFiltrados.map((frag) => (
              <div
                key={frag.id}
                className="p-5 rounded-xl bg-neutral-950/80 border border-neutral-800/80 hover:border-neutral-700/80 transition-colors space-y-3"
              >
                <div className="flex items-center justify-between text-xs text-neutral-400 pb-2 border-b border-neutral-800/60 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-amber-400/90 font-medium">
                      <Hash className="w-3.5 h-3.5" />
                      Fragmento #{frag.ordem}
                    </span>
                    {frag.secao_titulo && (
                      <>
                        <span>•</span>
                        <span className="text-neutral-300 font-serif italic">
                          {frag.secao_titulo}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-emerald-400/90 text-[11px]">
                      <CheckCircle2 className="w-3 h-3" /> Vetorizado HNSW (1536d)
                    </span>
                    <span>•</span>
                    <span>{frag.total_palavras} palavras</span>
                  </div>
                </div>

                <p className="text-sm font-serif text-neutral-200 leading-relaxed whitespace-pre-line">
                  {frag.conteudo}
                </p>
              </div>
            ))
          ) : (
            <div className="py-16 text-center text-neutral-400 space-y-2">
              <FileText className="w-8 h-8 text-neutral-600 mx-auto" />
              <p className="text-sm">Nenhum fragmento encontrado para os termos pesquisados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
