"use client";

import { useState } from "react";
import Link from "next/link";
import {
  UserCheck,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Sparkles,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { registrarRevisaoAutor, incorporarReflexaoMemoria } from "@/acoes/reflexoes";

interface Props {
  versaoId?: string;
  entradaId: string;
  estadoEntrada: string;
  incorporado?: boolean;
  obraIncorporadaId?: string | null;
  aoSalvar?: () => void;
}

export function PainelRevisaoAutor({
  versaoId,
  entradaId,
  estadoEntrada,
  incorporado = false,
  obraIncorporadaId,
  aoSalvar,
}: Props) {
  const [comentario, setComentario] = useState("");
  const [aprovado, setAprovado] = useState(estadoEntrada === "concluida" || incorporado);
  const [salvando, setSalvando] = useState(false);
  const [incorporando, setIncorporando] = useState(false);
  const [obraIdGerada, setObraIdGerada] = useState<string | null>(obraIncorporadaId || null);
  const [foiIncorporado, setFoiIncorporado] = useState(incorporado);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  if (!versaoId) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-sm">
        <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-serif text-lg font-bold text-slate-800">
          Aguardando Redação da Versão
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
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
          ? "Reflexão aprovada com sucesso! O texto foi chancelado no seu histórico de reflexões."
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

  const handleIncorporar = async () => {
    try {
      setIncorporando(true);
      setErro(null);

      const res = await incorporarReflexaoMemoria({
        entradaId,
        versaoId,
      });

      setFoiIncorporado(true);
      setObraIdGerada(res.obraId);
      setMensagemSucesso(
        "Reflexão incorporada à Memória com sucesso! Uma nova obra autoral ativa foi criada na Biblioteca e passa a alimentar o Cérebro Autoral."
      );
      aoSalvar?.();
    } catch (err: any) {
      console.error("Erro ao incorporar reflexão:", err);
      setErro(err.message || "Erro ao incorporar reflexão à memória.");
    } finally {
      setIncorporando(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Parecer Final e Incorporação à Memória
            </h3>
            <p className="text-xs text-slate-500">
              Decisão soberana do autor sobre a validação e absorção do conhecimento
            </p>
          </div>
        </div>

        {foiIncorporado && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Incorporado à Memória
          </span>
        )}
      </div>

      {mensagemSucesso && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-medium animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="flex-1">
            <span>{mensagemSucesso}</span>
            {obraIdGerada && (
              <div className="mt-1.5">
                <Link
                  href={`/biblioteca/${obraIdGerada}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 underline underline-offset-2"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Ver Obra Criada na Biblioteca</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {erro && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {/* Caixa de Incorporação à Biblioteca */}
      <div className="p-5 rounded-2xl border bg-gradient-to-br from-blue-50/60 to-indigo-50/40 border-blue-200/80 space-y-3">
        <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>Alimentação do Cérebro Autoral</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          {foiIncorporado
            ? "Esta reflexão foi incorporada e publicada como obra autoral ativa na Biblioteca. Seus fragmentos e conceitos agora retroalimentam continuamente as próximas reflexões do Cérebro Autoral."
            : "Ao incorporar, este ensaio é promovido a uma nova Obra Autoral na Biblioteca, é fragmentado e ativado no banco de dados. O Cérebro Autoral passará a utilizá-lo como evidência viva."}
        </p>

        {!foiIncorporado ? (
          <div className="pt-1">
            <button
              type="button"
              disabled={incorporando}
              onClick={handleIncorporar}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/25 transition-all disabled:opacity-50"
            >
              {incorporando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Incorporando à Biblioteca...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Incorporar à Memória Autoral (Criar Obra)</span>
                </>
              )}
            </button>
          </div>
        ) : (
          obraIdGerada && (
            <div className="pt-1">
              <Link
                href={`/biblioteca/${obraIdGerada}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-bold shadow-xs transition-colors"
              >
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Abrir Obra na Biblioteca</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )
        )}
      </div>

      {/* Formulário de Revisão e Anotações */}
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Anotações e Comentário Crítico do Autor
          </label>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows={4}
            placeholder="Registre aqui seus apontamentos, correções manuais ou justificativa de aprovação..."
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-sans resize-none"
          />
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
          <input
            type="checkbox"
            id="chk-aprovado"
            checked={aprovado}
            onChange={(e) => setAprovado(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
          />
          <label htmlFor="chk-aprovado" className="text-xs font-semibold text-slate-800 cursor-pointer">
            Declarar esta reflexão formalmente aprovada pelo autor
          </label>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={salvando}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all disabled:opacity-50"
          >
            {salvando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Salvar Notas de Revisão</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
