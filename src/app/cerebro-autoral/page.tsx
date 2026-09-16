import { AppShell } from "@/componentes/app-shell";

export default function CerebroAutoralPage() {
  return (
    <AppShell ativo="cerebro" titulo="Meu Cérebro Autoral" subtitulo="O que o sistema aprendeu, com evidências, sobre como você pensa">
      <div className="grid-dashboard">
        <div className="coluna">
          <section className="card card-padding">
            <div className="abas" aria-label="Áreas do Cérebro Autoral">
              <span className="aba ativa">Visão geral</span><span className="aba">Método</span><span className="aba">Expressão</span><span className="aba">Narrativa</span><span className="aba">Evolução</span>
            </div>
            <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "auto 1fr", gap: 18, alignItems: "center" }}>
              <div className="icone-vazio" style={{ margin: 0 }}>◉</div>
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: ".86rem" }}>Corpus autoral analisado</span>
                <h2 style={{ margin: "3px 0 9px", fontSize: "2.3rem" }}>0%</h2>
                <div className="progresso"><span style={{ width: "0%" }} /></div>
              </div>
            </div>
          </section>

          <section className="vazio">
            <div className="icone-vazio">◉</div>
            <h3>Seu Cérebro Autoral ainda não tem evidências suficientes</h3>
            <p>
              Ele será construído a partir de fontes autorais processadas, evidências rastreáveis, recorrências, exceções e confirmações humanas — nunca apenas pela “opinião” de um modelo de IA.
            </p>
          </section>
        </div>

        <div className="coluna">
          <section className="card card-padding">
            <div className="card-header"><div><h3>Três planos de análise</h3><p>Uma separação essencial para evitar conclusões erradas.</p></div></div>
            <div className="lista">
              <div className="item-lista"><span className="icone-quadrado">1</span><div className="item-lista-corpo"><strong>Conteúdo</strong><p>Sobre o que você pensa e escreve.</p></div></div>
              <div className="item-lista"><span className="icone-quadrado">2</span><div className="item-lista-corpo"><strong>Método</strong><p>Como você desenvolve, relaciona e argumenta.</p></div></div>
              <div className="item-lista"><span className="icone-quadrado">3</span><div className="item-lista-corpo"><strong>Expressão</strong><p>Como o pensamento aparece linguisticamente.</p></div></div>
            </div>
          </section>

          <section className="card card-padding">
            <div className="card-header"><div><h3>Dimensões iniciais</h3><p>O modelo arquitetural prevê 18 dimensões versionadas.</p></div></div>
            <div className="tags">
              <span className="tag">Metodologia de pensamento</span><span className="tag">Interpretação</span><span className="tag">Associação</span><span className="tag">Argumentação</span><span className="tag verde">Escrita</span><span className="tag verde">Revisão</span><span className="tag violeta">Narrativa</span><span className="tag violeta">Identidade linguística</span><span className="tag amarela">Evolução autoral</span>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
