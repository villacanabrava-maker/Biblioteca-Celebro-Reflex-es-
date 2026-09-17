"use client";

import { useState, useMemo } from "react";
import { Network, ZoomIn, ZoomOut, Filter, Info, ArrowRight } from "lucide-react";
import type { ConceitoTaxonomico, ArestaGrafoTaxonomia } from "@/tipos/taxonomia";

interface Props {
  conceitos: ConceitoTaxonomico[];
  arestas: ArestaGrafoTaxonomia[];
}

const CORES_DOMINIO: Record<string, { bg: string; border: string; text: string; fill: string }> = {
  intelectual: { bg: "bg-blue-950/80", border: "border-blue-500", text: "text-blue-300", fill: "#3b82f6" },
  axiologico: { bg: "bg-amber-950/80", border: "border-amber-500", text: "text-amber-300", fill: "#f59e0b" },
  reflexivo: { bg: "bg-purple-950/80", border: "border-purple-500", text: "text-purple-300", fill: "#a855f7" },
  narrativo: { bg: "bg-emerald-950/80", border: "border-emerald-500", text: "text-emerald-300", fill: "#10b981" },
  temporal: { bg: "bg-orange-950/80", border: "border-orange-500", text: "text-orange-300", fill: "#f97316" },
  retorico: { bg: "bg-rose-950/80", border: "border-rose-500", text: "text-rose-300", fill: "#f43f5e" },
  linguistico: { bg: "bg-cyan-950/80", border: "border-cyan-500", text: "text-cyan-300", fill: "#06b6d4" },
  estrutural: { bg: "bg-neutral-900/80", border: "border-neutral-500", text: "text-neutral-300", fill: "#737373" },
  autoral: { bg: "bg-amber-950/90", border: "border-amber-400", text: "text-amber-200", fill: "#fbbf24" },
};

const CORES_RELACAO: Record<string, string> = {
  mais_amplo: "#3b82f6",
  mais_especifico: "#60a5fa",
  relacionado: "#737373",
  contrasta_com: "#f43f5e",
  deriva_de: "#a855f7",
  evolui_para: "#10b981",
  associado_a: "#eab308",
};

export function GrafoTaxonomia({ conceitos, arestas }: Props) {
  const [noSelecionadoId, setNoSelecionadoId] = useState<string | null>(null);
  const [filtroRelacao, setFiltroRelacao] = useState<string>("todas");
  const [escala, setEscala] = useState<number>(1);

  // Layout circular/radial dos nós
  const layoutNos = useMemo(() => {
    const total = conceitos.length;
    if (total === 0) return new Map();

    const mapa = new Map<string, { x: number; y: number; conceito: ConceitoTaxonomico }>();
    const larguraSvg = 800;
    const alturaSvg = 600;
    const centroX = larguraSvg / 2;
    const centroY = alturaSvg / 2;
    const raio = Math.min(centroX, centroY) * 0.72;

    conceitos.forEach((c, idx) => {
      const angulo = (idx / total) * 2 * Math.PI - Math.PI / 2;
      const x = centroX + raio * Math.cos(angulo);
      const y = centroY + raio * Math.sin(angulo);
      mapa.set(c.id, { x, y, conceito: c });
    });

    return mapa;
  }, [conceitos]);

  const arestasFiltradas = useMemo(() => {
    if (filtroRelacao === "todas") return arestas;
    return arestas.filter((a) => a.tipo_relacao === filtroRelacao);
  }, [arestas, filtroRelacao]);

  const vizinhosAtivos = useMemo(() => {
    if (!noSelecionadoId) return new Set<string>();
    const set = new Set<string>([noSelecionadoId]);
    arestasFiltradas.forEach((a) => {
      if (a.origem_id === noSelecionadoId) set.add(a.destino_id);
      if (a.destino_id === noSelecionadoId) set.add(a.origem_id);
    });
    return set;
  }, [noSelecionadoId, arestasFiltradas]);

  const conceitoSelecionado = useMemo(() => {
    if (!noSelecionadoId) return null;
    return conceitos.find((c) => c.id === noSelecionadoId) || null;
  }, [noSelecionadoId, conceitos]);

  const relacoesConceitoSelecionado = useMemo(() => {
    if (!noSelecionadoId) return [];
    return arestas.filter(
      (a) => a.origem_id === noSelecionadoId || a.destino_id === noSelecionadoId
    );
  }, [noSelecionadoId, arestas]);

  if (conceitos.length === 0) {
    return (
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-12 text-center">
        <Network className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
        <h3 className="font-serif text-lg text-neutral-200">Grafo Semântico Vazio</h3>
        <p className="text-sm text-neutral-500 mt-1 max-w-md mx-auto">
          Cadastre conceitos na taxonomia para visualizar a rede ontológica de significados e relações.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de Ferramentas do Grafo */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-neutral-900/80 border border-neutral-800 rounded-xl">
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <Filter className="w-4 h-4 text-amber-400" />
          <span className="font-medium text-neutral-200">Tipo de Relação:</span>
          <select
            value={filtroRelacao}
            onChange={(e) => setFiltroRelacao(e.target.value)}
            aria-label="Filtrar por tipo de relação"
            className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-300 focus:outline-none focus:border-amber-500"
          >
            <option value="todas">Todas as Relações</option>
            <option value="mais_amplo">Mais Amplo</option>
            <option value="mais_especifico">Mais Específico</option>
            <option value="deriva_de">Deriva De</option>
            <option value="evolui_para">Evolui Para</option>
            <option value="contrasta_com">Contrasta Com</option>
            <option value="relacionado">Relacionado</option>
            <option value="associado_a">Associado A</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEscala((prev) => Math.max(0.6, prev - 0.1))}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
            title="Reduzir Zoom"
            aria-label="Reduzir Zoom"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-neutral-400 min-w-10 text-center">
            {Math.round(escala * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setEscala((prev) => Math.min(1.6, prev + 0.1))}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
            title="Aumentar Zoom"
            aria-label="Aumentar Zoom"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          {noSelecionadoId && (
            <button
              type="button"
              onClick={() => setNoSelecionadoId(null)}
              className="ml-2 text-xs px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
            >
              Limpar Seleção
            </button>
          )}
        </div>
      </div>

      {/* Área do Grafo SVG + Painel Lateral */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden relative min-h-[550px] flex items-center justify-center">
          <svg
            viewBox="0 0 800 600"
            className="w-full h-full cursor-grab active:cursor-grabbing select-none"
            style={{ transform: `scale(${escala})`, transformOrigin: "center center", transition: "transform 0.2s ease" }}
          >
            <defs>
              <marker
                id="seta-padrao"
                viewBox="0 0 10 10"
                refX="18"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#737373" />
              </marker>
              <marker
                id="seta-destaque"
                viewBox="0 0 10 10"
                refX="18"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
              </marker>
            </defs>

            {/* Arestas / Conexões Ontológicas */}
            {arestasFiltradas.map((aresta) => {
              const posOrigem = layoutNos.get(aresta.origem_id);
              const posDestino = layoutNos.get(aresta.destino_id);
              if (!posOrigem || !posDestino) return null;

              const estaAtiva =
                !noSelecionadoId ||
                aresta.origem_id === noSelecionadoId ||
                aresta.destino_id === noSelecionadoId;

              const corAresta = estaAtiva
                ? CORES_RELACAO[aresta.tipo_relacao] || "#f59e0b"
                : "#262626";

              return (
                <g key={aresta.relacao_id}>
                  <line
                    x1={posOrigem.x}
                    y1={posOrigem.y}
                    x2={posDestino.x}
                    y2={posDestino.y}
                    stroke={corAresta}
                    strokeWidth={estaAtiva && noSelecionadoId ? 2.5 : 1.2}
                    strokeDasharray={aresta.tipo_relacao === "contrasta_com" ? "4 4" : undefined}
                    opacity={estaAtiva ? 0.85 : 0.15}
                    markerEnd={estaAtiva && noSelecionadoId ? "url(#seta-destaque)" : "url(#seta-padrao)"}
                  />
                </g>
              );
            })}

            {/* Nós dos Conceitos */}
            {Array.from(layoutNos.entries()).map(([id, item]) => {
              const cor = CORES_DOMINIO[item.conceito.dominio] || CORES_DOMINIO.estrutural;
              const isSelected = noSelecionadoId === id;
              const isDimmed = noSelecionadoId !== null && !vizinhosAtivos.has(id);

              return (
                <g
                  key={id}
                  transform={`translate(${item.x}, ${item.y})`}
                  onClick={() => setNoSelecionadoId(isSelected ? null : id)}
                  className="cursor-pointer transition-all duration-300"
                  opacity={isDimmed ? 0.2 : 1}
                >
                  {/* Halo de Seleção */}
                  {isSelected && (
                    <circle
                      r={28}
                      className="animate-ping"
                      fill={cor.fill}
                      opacity={0.2}
                    />
                  )}

                  {/* Círculo Principal do Nó */}
                  <circle
                    r={isSelected ? 18 : 14}
                    fill="#171717"
                    stroke={isSelected ? "#f59e0b" : cor.fill}
                    strokeWidth={isSelected ? 3 : 2}
                  />

                  {/* Ponto Central com cor do Domínio */}
                  <circle
                    r={isSelected ? 6 : 4}
                    fill={cor.fill}
                  />

                  {/* Label do Conceito */}
                  <text
                    y={isSelected ? 32 : 26}
                    textAnchor="middle"
                    fill={isSelected ? "#ffffff" : "#d4d4d4"}
                    fontSize={isSelected ? "12px" : "10px"}
                    fontWeight={isSelected ? "600" : "400"}
                    className="select-none pointer-events-none drop-shadow-md"
                  >
                    {item.conceito.termo_preferencial}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Legenda Flutuante */}
          <div className="absolute bottom-3 left-3 bg-neutral-900/90 backdrop-blur-sm border border-neutral-800 rounded-xl p-2.5 text-[10px] space-y-1">
            <span className="text-neutral-400 font-semibold block mb-1">Domínios Ontológicos:</span>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {Object.entries(CORES_DOMINIO).slice(0, 6).map(([dom, c]) => (
                <div key={dom} className="flex items-center gap-1.5 capitalize">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.fill }} />
                  <span className="text-neutral-300">{dom}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Painel Lateral de Inspeção do Conceito */}
        <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between">
          {conceitoSelecionado ? (
            <div className="space-y-4">
              <div>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium border capitalize ${CORES_DOMINIO[conceitoSelecionado.dominio]?.bg || ""} ${CORES_DOMINIO[conceitoSelecionado.dominio]?.border || ""} ${CORES_DOMINIO[conceitoSelecionado.dominio]?.text || ""}`}>
                  {conceitoSelecionado.dominio}
                </span>
                <h3 className="font-serif text-xl font-medium text-neutral-100 mt-2">
                  {conceitoSelecionado.termo_preferencial}
                </h3>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                  {conceitoSelecionado.definicao}
                </p>
              </div>

              {/* Relações Ontológicas Conectadas */}
              <div className="pt-3 border-t border-neutral-800/80">
                <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2 font-mono">
                  Relações ({relacoesConceitoSelecionado.length})
                </h4>
                {relacoesConceitoSelecionado.length === 0 ? (
                  <p className="text-xs text-neutral-500 italic">
                    Nenhuma aresta ontológica registrada para este conceito.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {relacoesConceitoSelecionado.map((rel) => {
                      const ehOrigem = rel.origem_id === conceitoSelecionado.id;
                      const outroTermo = ehOrigem ? rel.destino_termo : rel.origem_termo;
                      const outroDominio = ehOrigem ? rel.destino_dominio : rel.origem_dominio;

                      return (
                        <div
                          key={rel.relacao_id}
                          className="p-2.5 rounded-lg bg-neutral-950/70 border border-neutral-800 text-xs flex items-center justify-between"
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: CORES_RELACAO[rel.tipo_relacao] || "#737373" }}
                            />
                            <span className="font-mono text-[10px] text-amber-400 capitalize">
                              {rel.tipo_relacao.replace("_", " ")}
                            </span>
                            <ArrowRight className="w-3 h-3 text-neutral-600" />
                            <span className="text-neutral-200 font-medium">{outroTermo}</span>
                          </div>
                          <span className="text-[10px] text-neutral-500 capitalize">
                            {outroDominio}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sinônimos */}
              {conceitoSelecionado.termos_sinonimos && conceitoSelecionado.termos_sinonimos.length > 0 && (
                <div className="pt-3 border-t border-neutral-800/80">
                  <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5 font-mono">
                    Sinônimos & Variações
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {conceitoSelecionado.termos_sinonimos.map((s) => (
                      <span
                        key={s.id}
                        className="text-[11px] px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-400"
                      >
                        {s.termo}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 space-y-2">
              <Info className="w-8 h-8 text-neutral-600 mx-auto" />
              <h4 className="text-sm font-medium text-neutral-300">Nenhum Conceito Selecionado</h4>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                Clique sobre qualquer nó no grafo para inspecionar suas conexões ontológicas, sinônimos e definições.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
