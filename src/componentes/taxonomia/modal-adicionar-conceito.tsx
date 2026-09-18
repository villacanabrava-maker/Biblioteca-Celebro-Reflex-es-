"use client";

import { useState } from "react";
import { X, Plus, Compass, AlertCircle, Loader2 } from "lucide-react";
import { cadastrarConceito } from "@/acoes/taxonomia";
import { useDialogModalAcessivel } from "@/componentes/comum/use-dialog-modal-acessivel";
import type { DominioTaxonomico } from "@/tipos/taxonomia";

interface Props {
  aberto: boolean;
  aoFechar: () => void;
  aoSucesso?: () => void;
}

const DOMINIOS: { id: DominioTaxonomico; rotulo: string }[] = [
  { id: "intelectual", rotulo: "Intelectual" },
  { id: "axiologico", rotulo: "Axiológico (Valores)" },
  { id: "reflexivo", rotulo: "Reflexivo" },
  { id: "narrativo", rotulo: "Narrativo" },
  { id: "temporal", rotulo: "Temporal" },
  { id: "retorico", rotulo: "Retórico" },
  { id: "linguistico", rotulo: "Linguístico" },
  { id: "estrutural", rotulo: "Estrutural" },
  { id: "autoral", rotulo: "Autoral" },
];

export function ModalAdicionarConceito({ aberto, aoFechar, aoSucesso }: Props) {
  const [termoPreferencial, setTermoPreferencial] = useState("");
  const [dominio, setDominio] = useState<DominioTaxonomico>("reflexivo");
  const [definicao, setDefinicao] = useState("");
  const [sinonimosTexto, setSinonimosTexto] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const dialogRef = useDialogModalAcessivel({
    aberto,
    aoFechar,
    bloqueado: salvando,
  });

  if (!aberto) return null;

  async function lidarSubmissao(e: React.FormEvent) {
    e.preventDefault();
    if (!termoPreferencial.trim() || !definicao.trim()) {
      setErro("Termo preferencial e definição são obrigatórios.");
      return;
    }

    try {
      setSalvando(true);
      setErro(null);

      const sinonimos = sinonimosTexto
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      await cadastrarConceito({
        termoPreferencial: termoPreferencial.trim(),
        definicao: definicao.trim(),
        dominio,
        sinonimos,
      });

      aoSucesso?.();
      aoFechar();
    } catch (err: any) {
      console.error("Erro ao cadastrar conceito:", err);
      setErro(err.message || "Erro inesperado ao cadastrar conceito.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-taxonomia-titulo"
        tabIndex={-1}
        className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6"
      >
        {/* Cabeçalho */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="modal-taxonomia-titulo"
                data-dialog-initial-focus
                tabIndex={-1}
                className="font-serif text-lg font-medium text-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400"
              >
                Novo Conceito Ontológico
              </h3>
              <p className="text-xs text-neutral-400">
                Expanda o universo conceitual canônico do seu pensamento
              </p>
            </div>
          </div>
          <button
            onClick={aoFechar}
            disabled={salvando}
            aria-label="Fechar"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {erro && (
          <div role="alert" className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{erro}</span>
          </div>
        )}

        <form onSubmit={lidarSubmissao} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-400 font-medium mb-1.5">
              Termo Preferencial (Canônico) *
            </label>
            <input
              type="text"
              required
              value={termoPreferencial}
              onChange={(e) => setTermoPreferencial(e.target.value)}
              placeholder="Ex: Escuta Reflexiva"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500/60"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-400 font-medium mb-1.5">
              Domínio Ontológico *
            </label>
            <select
              value={dominio}
              onChange={(e) => setDominio(e.target.value as DominioTaxonomico)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-amber-500/60"
            >
              {DOMINIOS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.rotulo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-400 font-medium mb-1.5">
              Definição Conceitual *
            </label>
            <textarea
              required
              rows={3}
              value={definicao}
              onChange={(e) => setDefinicao(e.target.value)}
              placeholder="Explicite a tese ou significado deste conceito na sua obra..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500/60"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-400 font-medium mb-1.5">
              Sinônimos e Variações Lexicais (separados por vírgula)
            </label>
            <input
              type="text"
              value={sinonimosTexto}
              onChange={(e) => setSinonimosTexto(e.target.value)}
              placeholder="Ex: escuta atenta, atenção auditiva, silêncio acolhedor"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500/60"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={aoFechar}
              disabled={salvando}
              className="px-4 py-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-5 py-2 rounded-lg text-xs font-medium bg-amber-500 hover:bg-amber-400 text-neutral-950 transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              {salvando ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Salvar Conceito
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
