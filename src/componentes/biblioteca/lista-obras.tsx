"use client";

import { useState, useMemo } from "react";
import { Search, Plus, ArrowUpDown, BookOpen, Inbox, CheckCircle2, Clock, Cpu } from "lucide-react";
import type { ObraDetalhada } from "@/tipos/biblioteca";
import type { SugestaoTagTaxonomia } from "@/tipos/taxonomia";
import { CardObra } from "./card-obra";
import { ModalAdicionarConteudo } from "./modal-adicionar-conteudo";
import { ModalProcessamento } from "@/componentes/processamento/modal-processamento";
import { VisualizadorFragmentos } from "@/componentes/processamento/visualizador-fragmentos";

interface Props {
  obrasIniciais: ObraDetalhada[];
  usuarioId: string;
  sugestoesTagsTaxonomia: SugestaoTagTaxonomia[];
}

const ABAS_TIPO: { id: string; rotulo: string }[] = [
  { id: "todos", rotulo: "Todos" },
  { id: "livro", rotulo: "Livros" },
  { id: "reflexao", rotulo: "Reflexões" },
  { id: "carta", rotulo: "Cartas" },
  { id: "relato", rotulo: "Relatos" },
  { id: "outros", rotulo: "Outros" },
];

export function ListaObras({
  obrasIniciais,
  usuarioId,
  sugestoesTagsTaxonomia,
}: Props) {
  const [obras, setObras] = useState<ObraDetalhada[]>(obrasIniciais);
  const [abaAtiva, setAbaAtiva] = useState("todos");
  const [busca, setBusca] = useState("");
  const [ordenacao, setOrdenacao] = useState<"recentes" | "antigos" | "titulo">("recentes");
  const [modalAberto, setModalAberto] = useState(false);
  const [obraProcessamento, setObraProcessamento] = useState<ObraDetalhada | null>(null);
  const [obraFragmentos, setObraFragmentos] = useState<ObraDetalhada | null>(null);

  // Estatísticas
  const totalProcessadas = obras.filter((o) => o.estado_processamento === "processado").length;
  const totalPendentes = obras.filter(
    (o) => o.estado_processamento !== "processado" && o.estado_processamento !== "em_processamento"
  ).length;
  const totalProcessando = obras.filter(
    (o) => o.estado_processamento === "em_processamento" || o.estado_processamento === "reprocessando"
  ).length;

  // Filtragem e ordenação
  const obrasFiltradas = useMemo(() => {
    return obras
      .filter((obra) => {
        if (abaAtiva !== "todos") {
          if (abaAtiva === "outros") {
            const principais = ["livro", "reflexao", "carta", "relato"];
            if (principais.includes(obra.tipo)) return false;
          } else if (obra.tipo !== abaAtiva) {
            return false;
          }
        }

        if (busca.trim().length > 0) {
          const termo = busca.toLowerCase().trim();
          const coincideTitulo = obra.titulo.toLowerCase().includes(termo);
          const coincideSubtitulo = obra.subtitulo?.toLowerCase().includes(termo);
          const coincideAutor = obra.autor_nome.toLowerCase().includes(termo);
          const coincideDescricao = obra.descricao?.toLowerCase().includes(termo);
          const tagsObra = Array.isArray(obra.metadados?.tags)
            ? obra.metadados.tags.filter(
                (tag): tag is string => typeof tag === "string"
              )
            : [];
          const coincideTag = tagsObra.some((tag) =>
            tag.toLowerCase().includes(termo)
          );

          if (
            !coincideTitulo &&
            !coincideSubtitulo &&
            !coincideAutor &&
            !coincideDescricao &&
            !coincideTag
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (ordenacao === "recentes") {
          return new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime();
        }
        if (ordenacao === "antigos") {
          return new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime();
        }
        return a.titulo.localeCompare(b.titulo);
      });
  }, [obras, abaAtiva, busca, ordenacao]);

  function lidarExcluirObra(id: string) {
    setObras((atuais) => atuais.filter((o) => o.id !== id));
  }

  function lidarSalvarObra(novaObra: ObraDetalhada) {
    setObras((atuais) => [novaObra, ...atuais]);
  }

  return (
    <div className="space-y-5">
      {obras.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 shadow-sm">
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-blue-600" />
            <strong className="text-slate-900">{obras.length}</strong> no acervo
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <strong className="text-slate-900">{totalProcessadas}</strong> processadas
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-amber-600" />
            <strong className="text-slate-900">{totalPendentes}</strong> {totalPendentes === 1 ? "pendente" : "pendentes"}
          </span>
          {totalProcessando > 0 && (
            <span className="inline-flex items-center gap-1.5 font-semibold text-blue-600">
              <Cpu className="h-4 w-4 animate-pulse" />
              {totalProcessando} processando
            </span>
          )}
        </div>
      )}

      {/* Abas de Pílulas */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {ABAS_TIPO.map((aba) => {
          const ativa = abaAtiva === aba.id;
          return (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                ativa
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {aba.rotulo}
            </button>
          );
        })}
      </div>

      {/* Barra de Busca e Botão Adicionar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título, autor ou tema..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 shadow-sm transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
          />
          {busca && (
            <button
              onClick={() => setBusca("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        <button
          onClick={() => setModalAberto(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5px]" />
          <span>Adicionar arquivo</span>
        </button>
      </div>

      {/* Contador e Ordenação */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          <strong className="font-bold text-slate-800">{obrasFiltradas.length}</strong>{" "}
          {obrasFiltradas.length === 1 ? "documento encontrado" : "documentos encontrados"}

        </span>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={ordenacao}
            onChange={(e) => setOrdenacao(e.target.value as any)}
            className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="recentes">Mais recentes</option>
            <option value="antigos">Mais antigos</option>
            <option value="titulo">Título (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Grid de Documentos */}
      {obrasFiltradas.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Nenhum documento encontrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {busca
              ? "Nenhum resultado corresponde à sua pesquisa. Tente outros termos."
              : "Seu acervo ainda não possui documentos cadastrados nesta categoria."}
          </p>
          <button
            onClick={() => setModalAberto(true)}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar arquivo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {obrasFiltradas.map((obra) => (
            <CardObra
              key={obra.id}
              obra={obra}
              aoExcluir={lidarExcluirObra}
              aoIniciarProcessamento={(o) => setObraProcessamento(o)}
              aoVerFragmentos={(o) => setObraFragmentos(o)}
            />
          ))}
        </div>
      )}

      {/* Modais Funcionais */}
      <ModalAdicionarConteudo
        aberto={modalAberto}
        aoFechar={() => setModalAberto(false)}
        aoSalvar={lidarSalvarObra}
        usuarioId={usuarioId}
        sugestoesTagsTaxonomia={sugestoesTagsTaxonomia}
      />

      {obraProcessamento && (
        <ModalProcessamento
          aberto={true}
          obra={obraProcessamento}
          aoFechar={() => setObraProcessamento(null)}
          aoConcluir={(obraId) => {
            setObras((atuais) =>
              atuais.map((o) =>
                o.id === obraId ? { ...o, estado_processamento: "processado" } : o
              )
            );
            setObraProcessamento(null);
          }}
        />
      )}

      {obraFragmentos && (
        <VisualizadorFragmentos
          aberto={true}
          obra={obraFragmentos}
          aoFechar={() => setObraFragmentos(null)}
        />
      )}
    </div>
  );
}
