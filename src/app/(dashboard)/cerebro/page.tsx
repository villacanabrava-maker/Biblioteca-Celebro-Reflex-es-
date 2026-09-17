import { Metadata } from "next";
import {
  obterDimensoesCerebro,
  obterCaracteristicasDimensao,
  obterRegrasCerebro,
  obterResumoCerebro,
} from "@/acoes/cerebro";
import { PainelCerebroModerno } from "@/componentes/cerebro/painel-cerebro-moderno";

export const metadata: Metadata = {
  title: "Meu Cérebro | Memória Reflexiva",
  description:
    "O que a IA aprendeu sobre você: estilo de escrita, temas recorrentes, forma de pensar e evidências.",
};

export const dynamic = "force-dynamic";

export default async function PaginaCerebro() {
  const [resumo, dimensoes, caracteristicas, regras] = await Promise.all([
    obterResumoCerebro(),
    obterDimensoesCerebro(),
    obterCaracteristicasDimensao(),
    obterRegrasCerebro(),
  ]);

  return (
    <PainelCerebroModerno
      resumo={resumo}
      dimensoes={dimensoes}
      caracteristicas={caracteristicas}
      regras={regras}
    />
  );
}
