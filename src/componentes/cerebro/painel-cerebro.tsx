"use client";

import { useState } from "react";
import { Layers, ShieldAlert } from "lucide-react";
import type { DimensaoCerebro, CaracteristicaCerebro, RegraCerebro, ResumoCerebro } from "@/tipos/cerebro";
import { ResumoCerebroComponente } from "./resumo-cerebro";
import { AcordeaoDimensoes } from "./acordeao-dimensoes";
import { PainelRegras } from "./painel-regras";

interface Props {
  resumo: ResumoCerebro;
  dimensoes: DimensaoCerebro[];
  caracteristicas: CaracteristicaCerebro[];
  regras: RegraCerebro[];
}

export function PainelCerebro({
  resumo,
  dimensoes,
  caracteristicas,
  regras,
}: Props) {
  const [abaPrincipal, setAbaPrincipal] = useState<"dimensoes" | "regras">(
    "dimensoes"
  );

  return (
    <div className="space-y-6">
      {/* Cards de Métricas Resumidas */}
      <ResumoCerebroComponente resumo={resumo} />

      {/* Alternador Principal de Abas */}
      <div className="border-b border-neutral-800 flex items-center gap-6">
        <button
          type="button"
          onClick={() => setAbaPrincipal("dimensoes")}
          className={`pb-3 text-sm font-medium transition-colors relative flex items-center gap-2 ${
            abaPrincipal === "dimensoes"
              ? "text-amber-400 font-semibold"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Dimensões Metodológicas (18)</span>
          {abaPrincipal === "dimensoes" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setAbaPrincipal("regras")}
          className={`pb-3 text-sm font-medium transition-colors relative flex items-center gap-2 ${
            abaPrincipal === "regras"
              ? "text-amber-400 font-semibold"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Regras & Anti-regras ({regras.length})</span>
          {abaPrincipal === "regras" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
          )}
        </button>
      </div>

      {/* Conteúdo da Aba Selecionada */}
      {abaPrincipal === "dimensoes" ? (
        <AcordeaoDimensoes
          dimensoes={dimensoes}
          caracteristicas={caracteristicas}
          regras={regras}
        />
      ) : (
        <PainelRegras regras={regras} />
      )}
    </div>
  );
}
