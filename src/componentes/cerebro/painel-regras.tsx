"use client";

import { useState, useMemo } from "react";
import { ShieldCheck, Ban, Sliders, Search, AlertTriangle, Sparkles } from "lucide-react";
import type { RegraCerebro, TipoRegra } from "@/tipos/cerebro";

interface Props {
  regras: RegraCerebro[];
}

export function PainelRegras({ regras }: Props) {
  const [abaAtiva, setAbaAtiva] = useState<string>("todas");
  const [busca, setBusca] = useState("");

  const regrasFiltradas = useMemo(() => {
    return regras.filter((r) => {
      const matchAba =
        abaAtiva === "todas"
          ? true
          : abaAtiva === "prescritiva"
          ? r.tipo_regra === "prescritiva"
          : abaAtiva === "proscritiva"
          ? r.tipo_regra === "proscritiva"
          : r.tipo_regra === "preferencia" || r.tipo_regra === "restricao_estilo";

      const termoBusca = busca.toLowerCase().trim();
      const matchBusca =
        !termoBusca ||
        r.enunciado.toLowerCase().includes(termoBusca) ||
        (r.explicacao && r.explicacao.toLowerCase().includes(termoBusca)) ||
        (r.dimensao_nome && r.dimensao_nome.toLowerCase().includes(termoBusca));

      return matchAba && matchBusca;
    });
  }, [regras, abaAtiva, busca]);

  const totais = useMemo(() => {
    return {
      todas: regras.length,
      prescritivas: regras.filter((r) => r.tipo_regra === "prescritiva").length,
      proscritivas: regras.filter((r) => r.tipo_regra === "proscritiva").length,
      estilo: regras.filter((r) => r.tipo_regra === "preferencia" || r.tipo_regra === "restricao_estilo").length,
    };
  }, [regras]);

  return (
    <div className="space-y-5">
      {/* Controles: Abas e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-neutral-900/70 border border-neutral-800 p-3 rounded-2xl">
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setAbaAtiva("todas")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              abaAtiva === "todas"
                ? "bg-neutral-100 text-neutral-900 font-semibold shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Todas ({totais.todas})
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva("prescritiva")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              abaAtiva === "prescritiva"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Prescritivas ({totais.prescritivas})</span>
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva("proscritiva")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              abaAtiva === "proscritiva"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Anti-regras ({totais.proscritivas})</span>
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva("estilo")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              abaAtiva === "estilo"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Estilo & Preferências ({totais.estilo})</span>
          </button>
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Filtrar regras por enunciado..."
            className="w-full pl-8 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Listagem de Regras */}
      {regrasFiltradas.length === 0 ? (
        <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-12 text-center">
          <ShieldCheck className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
          <h4 className="font-serif text-base text-neutral-300">Nenhuma regra ativa encontrada</h4>
          <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
            {busca
              ? "Nenhuma regra atende ao filtro de busca informado."
              : "As regras prescritivas e anti-regras são geradas automaticamente ao mapear as dimensões com IA na aba anterior."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {regrasFiltradas.map((regra) => {
            const ehProscritiva = regra.tipo_regra === "proscritiva";
            const ehPrescritiva = regra.tipo_regra === "prescritiva";

            return (
              <div
                key={regra.id}
                className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-neutral-700 transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-medium border flex items-center gap-1 ${
                        ehProscritiva
                          ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                          : ehPrescritiva
                          ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                          : "bg-purple-500/10 text-purple-300 border-purple-500/30"
                      }`}
                    >
                      {ehProscritiva ? (
                        <>
                          <Ban className="w-3 h-3" />
                          <span>ANTI-REGRA (VETO)</span>
                        </>
                      ) : ehPrescritiva ? (
                        <>
                          <ShieldCheck className="w-3 h-3" />
                          <span>REGRA PRESCRITIVA</span>
                        </>
                      ) : (
                        <>
                          <Sliders className="w-3 h-3" />
                          <span>PREFERÊNCIA</span>
                        </>
                      )}
                    </span>

                    <span className="text-[11px] font-mono text-neutral-500">
                      Peso: <strong className="text-neutral-300">{regra.peso}/10</strong>
                    </span>
                  </div>

                  <h4 className="font-serif text-base font-medium text-neutral-100 leading-snug">
                    {regra.enunciado}
                  </h4>

                  {regra.explicacao && (
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      {regra.explicacao}
                    </p>
                  )}
                </div>

                {/* Rodapé com Origem da Dimensão */}
                <div className="pt-3 border-t border-neutral-800/60 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                  <span>
                    {regra.dimensao_nome ? (
                      <span className="text-neutral-300">
                        {regra.dimensao_codigo}: {regra.dimensao_nome}
                      </span>
                    ) : (
                      "Geral"
                    )}
                  </span>
                  {regra.dimensao_plano && (
                    <span className="capitalize text-amber-400/80">
                      Plano {regra.dimensao_plano}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
