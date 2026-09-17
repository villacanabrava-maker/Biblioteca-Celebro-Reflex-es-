"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  ArrowUpDown,
  BookOpen,
  Sparkles,
  Inbox,
  Filter,
} from "lucide-react";
import type { ObraDetalhada, TipoObra } from "@/tipos/biblioteca";
import { CardObra } from "./card-obra";
import { ModalAdicionarConteudo } from "./modal-adicionar-conteudo";
import { ModalProcessamento } from "@/componentes/processamento/modal-processamento";
import { VisualizadorFragmentos } from "@/componentes/processamento/visualizador-fragmentos";

interface Props {
  obrasIniciais: ObraDetalhada[];
  usuarioId: string;
}

const ABAS_TIPO: { id: string; rotulo: string }[] = [
  { id: "todos", rotulo: "Todos" },
  { id: "livro", rotulo: "Livros" },
  { id: "reflexao", rotulo: "Reflexões" },
  { id: "carta", rotulo: "Cartas" },
  { id: "relato", rotulo: "Relatos" },
  { id: "outros", rotulo: "Outros" },
];

export function ListaObras({ obrasIniciais, usuarioId }: Props) {
  const [obras, setObras] = useState<ObraDetalhada[]>(obrasIniciais);
  const [abaAtiva, setAbaAtiva] = useState("todos");
  const [busca, setBusca] = useState("");
  const [ordenacao, setOrdenacao] = useState<"recentes" | "antigos" | "titulo">("recentes");
  const [modalAberto, setModalAberto] = useState(false);
  const [obraProcessamento, setObraProcessamento] = useState<ObraDetalhada | null>(null);
  const [obraFragmentos, setObraFragmentos] = useState<ObraDetalhada | null>(null);

  // Filtragem e ordenação
  const obrasFiltradas = useMemo(() => {
    return obras
      .filter((obra) => {
        // Filtro por tipo de aba
        if (abaAtiva !== "todos") {
          if (abaAtiva === "outros") {
            const principais = ["livro", "reflexao", "carta", "relato"];
            if (principais.includes(obra.tipo)) return false;
          } else if (obra.tipo !== abaAtiva) {
            return false;
          }
        }

        // Filtro de busca textual
        if (busca.trim().length > 0) {
          const termo = busca.toLowerCase().trim();
          const coincideTitulo = obra.titulo.toLowerCase().includes(termo);
          const coincideSubtitulo = obra.subtitulo?.toLowerCase().includes(termo);
          const coincideAutor = obra.autor_nome.toLowerCase().includes(termo);
          const coincideDescricao = obra.descricao?.toLowerCase().includes(termo);

          if (!coincideTitulo && !coincideSubtitulo && !coincideAutor && !coincideDescricao) {
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
    <div className="space-y-6">
      {/* 1. Abas de Pílulas Claras (Todos, Livros, Reflexões, Cartas, Relatos, Outros) */}
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

      {/* 2. Barra de Busca e Botão Azul "+ Adicionar" */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar na biblioteca..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-colors"
          />
          {busca && (
            <button
              onClick={() => setBusca("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Limpar
            </button>
          )}
        </div>

        <button
          onClick={() => setModalAberto(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5px]" />
          <span>+ Adicionar</span>
        </button>
      </div>

      {/* 3. Contador de Documentos e Ordenação */}
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

      {/* 4. Lista de Documentos em Cards */}
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
            Adicionar Primeiro Conteúdo
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
