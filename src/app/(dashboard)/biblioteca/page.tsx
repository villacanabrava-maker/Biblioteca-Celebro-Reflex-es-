import { Metadata } from "next";
import { obterObras, obterEstatisticasBiblioteca } from "@/acoes/biblioteca";
import { obterUsuarioAtualId } from "@/infraestrutura/auth/usuario-atual";
import { ListaObras } from "@/componentes/biblioteca/lista-obras";

export const metadata: Metadata = {
  title: "Biblioteca | Rflex01",
  description: "Seu acervo pessoal de documentos, livros, cartas, relatos e reflexões.",
};

export const dynamic = "force-dynamic";

export default async function BibliotecaPage() {
  const usuarioId = await obterUsuarioAtualId();
  const [obras] = await Promise.all([
    obterObras(),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Cabeçalho da Biblioteca */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
          Biblioteca
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Seu acervo de documentos, textos e referências. Encontre o que precisa e acompanhe o processamento.
        </p>
      </div>

      {/* Lista Interativa de Obras com Filtros, Busca e Modal de Upload */}
      <ListaObras obrasIniciais={obras} usuarioId={usuarioId} />
    </div>
  );
}
