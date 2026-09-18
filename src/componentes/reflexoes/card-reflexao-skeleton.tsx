import React from "react";

export function CardReflexaoSkeleton() {
  return (
    <div className="bg-neutral-900/50 border border-neutral-800/80 rounded-2xl p-5 flex flex-col justify-between space-y-4 animate-pulse">
      <div className="space-y-3">
        {/* Badges Skeleton */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="h-5 w-16 bg-neutral-800 rounded-full" />
            <div className="h-5 w-20 bg-neutral-800 rounded-full" />
          </div>
          <div className="h-4 w-24 bg-neutral-800/70 rounded" />
        </div>

        {/* Título & Descrição Skeleton */}
        <div className="space-y-2">
          <div className="h-6 w-3/4 bg-neutral-800 rounded" />
          <div className="h-4 w-full bg-neutral-800/60 rounded" />
          <div className="h-4 w-2/3 bg-neutral-800/40 rounded" />
        </div>
      </div>

      {/* Rodapé Skeleton */}
      <div className="pt-3 border-t border-neutral-800/60 flex items-center justify-between gap-2">
        <div className="h-6 w-28 bg-neutral-800/70 rounded-lg" />
        <div className="h-4 w-20 bg-neutral-800/80 rounded" />
      </div>
    </div>
  );
}
