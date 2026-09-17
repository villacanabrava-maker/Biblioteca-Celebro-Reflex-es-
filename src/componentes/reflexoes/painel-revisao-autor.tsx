"use client";

import { useState } from "react";
import { UserCheck, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { registrarRevisaoAutor } from "@/acoes/reflexoes";

interface Props {
  versaoId?: string;
  entradaId: string;
  estadoEntrada: string;
  aoSalvar?: () => void;
}

export function PainelRevisaoAutor({
  versaoId,
  entradaId,
  estadoEntrada,
  aoSalvar,
}: Props) {
  const [comentario, setComentario] = useState("");
  const [aprovado, setAprovado] = useState(estadoEntrada === "concluida");
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  if (!versaoId) {
    return (
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-12 text-center">
        <UserCheck className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
        <h3 className="font-serif text-lg text-neutral-200">
          Aguardando Redação de Versão
        </h3>
        <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
          Gere uma versão na aba anterior para registrar suas impressões, anotações de revisão e aprovação final.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSalvando(true);
      setErro(null);
      setMensagemSucesso(null);

      await registrarRevisaoAutor({
        versaoId,
        entradaId,
        comentarioGeral: comentario,
        aprovado,
      });

      setMensagemSucesso(
        aprovado
          ? "Reflexão aprovada com sucesso! O texto foi chancelado no seu cânone autoral."
          : "Notas de revisão salvas com sucesso."
      );
      aoSalvar?.();
    } catch (err: any) {
      console.error("Erro ao salvar revisão:", err);
      setErro(err.message || "Erro inesperado ao salvar revisão.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <UserCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-serif text-lg font-medium text-neutral-100">
            Chancela & Revisão do Autor
          </h3>
          <p className="text-xs text-neutral-400">
            A decisão final é sempre sua. Registre suas anotações e declare se esta reflexão está aprovada para publicação.
          </p>
        </div>
      </div>

      {mensagemSucesso && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {erro && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2.5 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="space-y-1.5">
          <label className="block text-neutral-300 font-medium font-mono uppercase tracking-wider text-[11px]">
            Notas Pessoais & Observações de Estilo
          </label>
          <textarea
            rows={4}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Ex: O terceiro parágrafo capturou com precisão a ironia que eu pretendia. Refinar a metáfora de abertura na próxima conferência..."
            className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors resize-none leading-relaxed"
          />
        </div>

        {/* Checkbox de Aprovação */}
        <label className="flex items-start gap-3 p-4 rounded-xl bg-neutral-950 border border-neutral-800 cursor-pointer hover:border-amber-500/40 transition-colors">
          <input
            type="checkbox"
            checked={aprovado}
            onChange={(e) => setAprovado(e.target.checked)}
            className="mt-0.5 rounded border-neutral-700 text-amber-500 focus:ring-amber-500"
          />
          <div>
            <span className="font-medium text-neutral-200 block">
              Aprovar oficialmente esta reflexão
            </span>
            <span className="text-neutral-400 text-[11px]">
              Ao marcar esta opção, o ensaio passa para o estado "Concluída" e serve como evidência confirmada para calibrar o Cérebro Autoral.
            </span>
          </div>
        </label>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={salvando}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 font-medium rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
          >
            {salvando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registrando Revisão...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Salvar Parecer do Autor</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
