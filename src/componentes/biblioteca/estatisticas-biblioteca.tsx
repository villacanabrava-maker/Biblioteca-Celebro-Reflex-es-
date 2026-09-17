import { BookOpen, Sparkles, Compass, Brain } from "lucide-react";
import type { EstatisticasBiblioteca } from "@/tipos/biblioteca";

interface Props {
  estatisticas: EstatisticasBiblioteca;
}

export function EstatisticasBibliotecaComponent({ estatisticas }: Props) {
  const percentualAutoral =
    estatisticas.total_obras > 0
      ? Math.round((estatisticas.total_autorais / estatisticas.total_obras) * 100)
      : 100;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
      {/* Total de Obras */}
      <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-4 md:p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-wider text-neutral-400 font-medium">
            Total do Acervo
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <BookOpen className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl md:text-3xl font-serif font-medium text-neutral-100">
          {estatisticas.total_obras}
        </div>
        <div className="text-xs text-neutral-400 mt-1">
          {estatisticas.total_paginas > 0
            ? `${estatisticas.total_paginas} págs catalogadas`
            : "Obras preservadas"}
        </div>
      </div>

      {/* Núcleo Autoral */}
      <div className="bg-neutral-900/60 border border-amber-500/30 rounded-xl p-4 md:p-5 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-wider text-amber-300/90 font-medium">
            Núcleo Autoral
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl md:text-3xl font-serif font-medium text-amber-200">
          {estatisticas.total_autorais}
        </div>
        <div className="text-xs text-amber-400/80 mt-1 flex items-center gap-1">
          <span>{percentualAutoral}% do acervo total</span>
        </div>
      </div>

      {/* Influências Deliberadas */}
      <div className="bg-neutral-900/60 border border-blue-500/20 rounded-xl p-4 md:p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-wider text-blue-300/90 font-medium">
            Influências Externas
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Compass className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl md:text-3xl font-serif font-medium text-blue-200">
          {estatisticas.total_influencias_externas}
        </div>
        <div className="text-xs text-blue-400/80 mt-1">
          Fontes de diálogo deliberado
        </div>
      </div>

      {/* Participam do Cérebro */}
      <div className="bg-neutral-900/60 border border-emerald-500/20 rounded-xl p-4 md:p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-wider text-emerald-300/90 font-medium">
            Cérebro Ativo
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Brain className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl md:text-3xl font-serif font-medium text-emerald-200">
          {estatisticas.total_no_cerebro}
        </div>
        <div className="text-xs text-emerald-400/80 mt-1">
          Obras alimentando o modelo
        </div>
      </div>
    </div>
  );
}
