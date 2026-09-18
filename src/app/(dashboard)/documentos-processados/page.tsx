import { obterListaDocumentosProcessados } from "@/acoes/processamento";
import { PainelDocumentosProcessados } from "@/componentes/processamento/painel-documentos-processados";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Documentos Processados | Cérebro Autoral",
  description: "Auditoria, decomposição computacional e materiais extraídos pelo pipeline de IA.",
};

export default async function DocumentosProcessadosPage() {
  const documentos = await obterListaDocumentosProcessados();

  return <PainelDocumentosProcessados documentos={documentos} />;
}
