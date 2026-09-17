"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Sparkles, Loader2, BookOpen, AlertCircle } from "lucide-react";
import { criarNovaReflexao } from "@/acoes/reflexoes";
import type { FormatoReflexao } from "@/tipos/reflexoes";

interface Props {
  aberto: boolean;
  aoFechar: () => void;
}

const FORMATOS: { id: FormatoReflexao; rotulo: string; descricao: string }[] = [
  { id: "ensaio", rotulo: "Ensaio Epistêmico", descricao: "Desenvolvimento denso, dialético e aprofundado" },
  { id: "artigo", rotulo: "Artigo de Opinião", descricao: "Posicionamento claro para debate público" },
  { id: "aforismo", rotulo: "Aforismos & Máximas", descricao: "Sínteses cortantes e condensadas" },
  { id: "newsletter", rotulo: "Carta / Newsletter", descricao: "Diálogo íntimo e provocativo com a comunidade" },
  { id: "dialogo", rotulo: "Diálogo Socrático", descricao: "Investigação dialógica entre dois pontos de vista" },
  { id: "tese", rotulo: "Tese Canônica", descricao: "Fundamentação formal de novo axioma ou conceito" },
];

export function ModalNovaReflexao({ aberto, aoFechar }: Props) {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [temaCentral, setTemaCentral] = useState("");
  const [provocacaoInicial, setProvocacaoInicial] = useState("");
  const [objetivoComunicativo, setObjetivoComunicativo] = useState("");
  const [publicoAlvo, setPublicoAlvo] = useState("");
  const [formatoDesejado, setFormatoDesejado] = useState<FormatoReflexao>("ensaio");
  const [restricoesEspecificas, setRestricoesEspecificas] = useState("");

  const [planejando, setPlanejando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!aberto) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !temaCentral.trim() || !provocacaoInicial.trim()) {
      setErro("Título, tema central e provocação inicial são obrigatórios.");
      return;
    }

    try {
      setPlanejando(true);
      setErro(null);

      const resultado = await criarNovaReflexao({
        titulo,
        temaCentral,
        provocacaoInicial,
        objetivoComunicativo,
        publicoAlvo,
        formatoDesejado,
        restricoesEspecificas,
      });

      aoFechar();
      router.push(`/reflexoes/${resultado.entradaId}`);
    } catch (err: any) {
      console.error("Erro ao criar reflexão:", err);
      setErro(err.message || "Erro inesperado ao criar reflexão.");
    } finally {
      setPlanejando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6 my-8">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-medium text-neutral-100">
                Nova Reflexão Autoral
              </h2>
              <p className="text-xs text-neutral-400">
                Defina a intenção e a provocação inicial para o Cérebro planejar o raciocínio.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={aoFechar}
            disabled={planejando}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {erro && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Título Provisório */}
          <div className="space-y-1.5">
            <label className="block text-neutral-300 font-medium font-mono uppercase tracking-wider text-[11px]">
              Título de Trabalho *
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: A Ilusão da Produtividade Algorítmica"
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tema Central */}
            <div className="space-y-1.5">
              <label className="block text-neutral-300 font-medium font-mono uppercase tracking-wider text-[11px]">
                Tema Central *
              </label>
              <input
                type="text"
                required
                value={temaCentral}
                onChange={(e) => setTemaCentral(e.target.value)}
                placeholder="Ex: Autonomia intelectual vs automação"
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Formato Desejado */}
            <div className="space-y-1.5">
              <label className="block text-neutral-300 font-medium font-mono uppercase tracking-wider text-[11px]">
                Formato Desejado
              </label>
              <select
                value={formatoDesejado}
                onChange={(e) => setFormatoDesejado(e.target.value as FormatoReflexao)}
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-200 focus:outline-none focus:border-amber-500 transition-colors capitalize"
              >
                {FORMATOS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.rotulo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Provocação Inicial / Centelha */}
          <div className="space-y-1.5">
            <label className="block text-neutral-300 font-medium font-mono uppercase tracking-wider text-[11px]">
              Provocação Inicial (O Inquietamento do Autor) *
            </label>
            <textarea
              required
              rows={4}
              value={provocacaoInicial}
              onChange={(e) => setProvocacaoInicial(e.target.value)}
              placeholder="Qual a dúvida, paradoxo ou contraste que motivou esta reflexão? Ex: Percebo que quanto mais ferramentas de síntese usamos, menos sintetizamos internamente..."
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors resize-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Objetivo Comunicativo */}
            <div className="space-y-1.5">
              <label className="block text-neutral-300 font-medium font-mono uppercase tracking-wider text-[11px]">
                Objetivo Comunicativo (Opcional)
              </label>
              <input
                type="text"
                value={objetivoComunicativo}
                onChange={(e) => setObjetivoComunicativo(e.target.value)}
                placeholder="Ex: Desconstruir o mito da agilidade cognitiva"
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Público-Alvo */}
            <div className="space-y-1.5">
              <label className="block text-neutral-300 font-medium font-mono uppercase tracking-wider text-[11px]">
                Público-Alvo (Opcional)
              </label>
              <input
                type="text"
                value={publicoAlvo}
                onChange={(e) => setPublicoAlvo(e.target.value)}
                placeholder="Ex: Criadores e pensadores contemporâneos"
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          {/* Restrições Específicas */}
          <div className="space-y-1.5">
            <label className="block text-neutral-300 font-medium font-mono uppercase tracking-wider text-[11px]">
              Restrições Específicas ou Vetos (Opcional)
            </label>
            <input
              type="text"
              value={restricoesEspecificas}
              onChange={(e) => setRestricoesEspecificas(e.target.value)}
              placeholder="Ex: Não utilizar tom professoral nem metáforas financeiras"
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Botões de Ação */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={aoFechar}
              disabled={planejando}
              className="px-4 py-2 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={planejando}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 font-medium rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {planejando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Concebendo Arquitetura Cognitiva...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Gerar Plano de Raciocínio</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
