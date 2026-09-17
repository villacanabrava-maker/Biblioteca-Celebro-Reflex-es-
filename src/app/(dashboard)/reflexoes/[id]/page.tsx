import { notFound } from "next/navigation";
import { Metadata } from "next";
import { obterReflexaoCompleta } from "@/acoes/reflexoes";
import { EstudioReflexao } from "@/componentes/reflexoes/estudio-reflexao";

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const dados = await obterReflexaoCompleta(id);
  if (!dados.entrada) {
    return { title: "Reflexão Não Encontrada | Memória Reflexiva" };
  }

  return {
    title: `${dados.entrada.titulo} | Estúdio de Reflexões`,
    description: dados.entrada.tema_central,
  };
}

export default async function PaginaDetalheReflexao({ params }: Props) {
  const { id } = await params;
  const dados = await obterReflexaoCompleta(id);

  if (!dados.entrada) {
    notFound();
  }

  return (
    <EstudioReflexao
      entrada={dados.entrada}
      plano={dados.plano}
      versoes={dados.versoes}
    />
  );
}
