import Link from "next/link";
import { AppShell } from "@/componentes/app-shell";

export default function PaginaInicial() {
  return (
    <AppShell
      ativo="inicio"
      titulo="Início"
      subtitulo="Visão geral do seu universo autoral"
    >
      <div className="grid-dashboard">
        <div className="coluna">
          <section className="card hero-reflexivo">
            <div className="hero-conteudo">
              <p className="etiqueta">Seu espaço de memória, pensamento e criação</p>
              <h2>Toda grande reflexão começa com uma pergunta.</h2>
              <p>
                O Cérebro Autoral vai organizar seu acervo, compreender como você pensa e apoiar novas reflexões sem apagar sua voz.
              </p>
            </div>
          </section>

          <section className="metricas" aria-label="Resumo do projeto">
            <Link className="card metrica" href="/biblioteca">
              <div className="metrica-topo"><span className="icone-quadrado">▤</span><span>Biblioteca</span></div>
              <strong>0</strong>
              <span>documentos autorais processados</span>
            </Link>
            <Link className="card metrica" href="/cerebro-autoral">
              <div className="metrica-topo"><span className="icone-quadrado">◉</span><span>Cérebro</span></div>
              <strong>0%</strong>
              <span>metodologia autoral analisada</span>
            </Link>
            <Link className="card metrica" href="/reflexoes">
              <div className="metrica-topo"><span className="icone-quadrado">✦</span><span>Reflexões</span></div>
              <strong>0</strong>
              <span>reflexões aprovadas</span>
            </Link>
          </section>

          <section className="card card-padding">
            <div className="card-header">
              <div><h2>Ações rápidas</h2><p>Os principais caminhos para começar.</p></div>
            </div>
            <div className="acoes-rapidas">
              <Link className="acao-rapida" href="/biblioteca/adicionar"><span className="icone-quadrado">＋</span><span>Adicionar conteúdo</span></Link>
              <Link className="acao-rapida" href="/criar-reflexao"><span className="icone-quadrado">✎</span><span>Criar reflexão</span></Link>
              <Link className="acao-rapida" href="/cerebro-autoral"><span className="icone-quadrado">◉</span><span>Explorar cérebro</span></Link>
              <Link className="acao-rapida" href="/reflexoes"><span className="icone-quadrado">✦</span><span>Ver reflexões</span></Link>
            </div>
          </section>
        </div>

        <div className="coluna">
          <section className="card card-padding">
            <div className="card-header"><div><h2>Estado do Cérebro Autoral</h2><p>Baseado apenas em evidências autorais validadas.</p></div><span className="status status-neutro">Inicial</span></div>
            <div className="progresso" aria-label="0 por cento analisado"><span style={{ width: "0%" }} /></div>
            <div className="insight" style={{ marginTop: 16 }}>
              Ainda não há evidências suficientes. O primeiro passo é construir sua Biblioteca com fontes autorais preservadas e rastreáveis.
            </div>
          </section>

          <section className="card card-padding">
            <div className="card-header"><div><h2>Atividade recente</h2><p>O histórico aparecerá conforme você usar o sistema.</p></div></div>
            <div className="lista">
              <div className="item-lista">
                <span className="icone-quadrado">✓</span>
                <div className="item-lista-corpo"><strong>Fundação técnica iniciada</strong><p>GitHub e Supabase oficiais já foram identificados e conectados.</p></div>
              </div>
              <div className="item-lista">
                <span className="icone-quadrado">◌</span>
                <div className="item-lista-corpo"><strong>Próximo marco</strong><p>Validar a interface-base e iniciar a fundação versionada do banco.</p></div>
              </div>
            </div>
          </section>

          <section className="card card-padding">
            <div className="card-header"><div><h3>Princípio central</h3></div></div>
            <p style={{ marginBottom: 0, color: "var(--text-muted)", lineHeight: 1.65 }}>
              A IA interpreta, propõe e relaciona. Você continua sendo a autoridade final sobre sua identidade, suas fontes e o que pode ser incorporado ao seu Cérebro Autoral.
            </p>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
