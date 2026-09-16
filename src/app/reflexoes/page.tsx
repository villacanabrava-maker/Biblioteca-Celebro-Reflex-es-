import Link from "next/link";
import { AppShell } from "@/componentes/app-shell";

export default function ReflexoesPage() {
  return (
    <AppShell ativo="reflexoes" titulo="Minhas Reflexões" subtitulo="Histórico, versões, revisão e incorporação controlada">
      <section className="card card-padding">
        <div className="card-header">
          <div><h2>Reflexões</h2><p>Uma reflexão aprovada não é automaticamente incorporada ao Cérebro Autoral.</p></div>
          <Link className="botao botao-primario" href="/criar-reflexao">＋ Nova reflexão</Link>
        </div>

        <div className="abas">
          <span className="aba ativa">Todas</span><span className="aba">Rascunhos</span><span className="aba">Em revisão</span><span className="aba">Aprovadas</span><span className="aba">Incorporadas</span>
        </div>
        <div className="toolbar">
          <input className="campo-busca" placeholder="Buscar por título, tema ou conteúdo..." aria-label="Buscar reflexões" />
          <button className="botao botao-secundario" type="button">Filtros</button>
        </div>

        <div className="vazio">
          <div className="icone-vazio">✦</div>
          <h3>Suas novas reflexões aparecerão aqui</h3>
          <p>
            Cada reflexão terá histórico de versões, contexto utilizado, conflitos encontrados, auditoria, revisão humana e decisão explícita de incorporação.
          </p>
          <Link className="botao botao-primario" href="/criar-reflexao">Criar primeira reflexão</Link>
        </div>
      </section>
    </AppShell>
  );
}
