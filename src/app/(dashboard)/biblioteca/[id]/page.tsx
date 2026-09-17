import { notFound } from "next/navigation";
import { obterObraPorId } from "@/acoes/biblioteca";
import { DetalheDocumentoComponente } from "@/componentes/biblioteca/detalhe-documento";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const { obra } = await obterObraPorId(id);

  if (!obra) {
    return { title: "Documento não encontrado | Memória Reflexiva" };
  }

  return {
    title: `${obra.titulo} | Memória Reflexiva`,
    description: obra.subtitulo || obra.descricao || "Detalhes do documento na Memória Reflexiva",
  };
}

export default async function DetalheDocumentoPage({ params }: Props) {
  const { id } = await params;
  const { obra, fragmentos } = await obterObraPorId(id);

  if (!obra) {
    notFound();
  }

  return <DetalheDocumentoComponente obra={obra} fragmentos={fragmentos} />;
}
