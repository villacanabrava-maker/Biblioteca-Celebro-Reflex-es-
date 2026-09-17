import { Metadata } from "next";
import { WizardCriarReflexao } from "@/componentes/reflexoes/wizard-criar-reflexao";

export const metadata: Metadata = {
  title: "Criar Reflexão | Memória Reflexiva",
  description:
    "Do externo ao seu novo texto: esteira reflexiva de 7 etapas com planejamento cognitivo e incorporação.",
};

export const dynamic = "force-dynamic";

export default function CriarReflexaoPage() {
  return <WizardCriarReflexao />;
}
