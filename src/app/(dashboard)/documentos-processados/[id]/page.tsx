import { notFound } from "next/navigation";
import { obterExtracaoCompletaDocumento } from "@/acoes/processamento";
import { VisualizadorExtracaoLivro } from "@/componentes/processamento/visualizador-extracao-livro";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const dados = await obterExtracaoCompletaDocumento(id);

  if (!dados) {
    return { title: "Documento não encontrado | Cérebro Autoral" };
  }

  return {
    title: `${dados.documento.titulo_processado} (Extração) | Cérebro Autoral`,
    description: `Auditoria e materiais extraídos da obra ${dados.documento.titulo_processado}.`,
  };
}

export default async function DetalheDocumentoProcessadoPage({ params }: Props) {
  const { id } = await params;
  const dados = await obterExtracaoCompletaDocumento(id);

  if (!dados) {
    notFound();
  }

  return <VisualizadorExtracaoLivro dados={dados} />;
}
