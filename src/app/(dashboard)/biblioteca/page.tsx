import { Metadata } from "next";
import { obterObras, obterEstatisticasBiblioteca } from "@/acoes/biblioteca";
import { obterUsuarioAtualId } from "@/infraestrutura/auth/usuario-atual";
import { EstatisticasBibliotecaComponent } from "@/componentes/biblioteca/estatisticas-biblioteca";
import { ListaObras } from "@/componentes/biblioteca/lista-obras";

export const metadata: Metadata = {
  title: "Biblioteca & Acervo Original | Memória Reflexiva",
  description: "Manuscritos, livros e fontes que compõem o Núcleo Autoral e Influências Deliberadas",
};

export const dynamic = "force-dynamic";

export default async function BibliotecaPage() {
  const usuarioId = await obterUsuarioAtualId();
  const [obras, estatisticas] = await Promise.all([
    obterObras(),
    obterEstatisticasBiblioteca(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      {/* Cabeçalho da Página */}
      <div className="mb-8">
        <h1 className="font-serif text-2xl md:text-3xl lg:text-4xl font-medium text-neutral-100 tracking-tight">
          Biblioteca & Acervo Original
        </h1>
        <p className="text-neutral-400 text-sm md:text-base mt-2 max-w-2xl leading-relaxed">
          Preservação dos arquivos originais e catalogação ontológica. Todas as obras são rigorosamente
          distinguidas entre <strong className="text-amber-300 font-medium">Núcleo Autoral</strong> e{" "}
          <strong className="text-blue-300 font-medium">Influências Deliberadas</strong>.
        </p>
      </div>

      {/* Métricas Consolidadas */}
      <EstatisticasBibliotecaComponent estatisticas={estatisticas} />

      {/* Lista Interativa e Filtros */}
      <ListaObras obrasIniciais={obras} usuarioId={usuarioId} />
    </div>
  );
}
