import Link from "next/link";
import { AppShell } from "@/componentes/app-shell";

export default function BibliotecaPage() {
  return (
    <AppShell ativo="biblioteca" titulo="Biblioteca" subtitulo="Seu acervo pessoal de fontes e documentos">
      <section className="card card-padding">
        <div className="card-header">
          <div><h2>Seu acervo</h2><p>Originais preservados, versões rastreáveis e processamento visível.</p></div>
          <Link className="botao botao-primario" href="/biblioteca/adicionar">＋ Adicionar</Link>
        </div>

        <div className="abas" aria-label="Categorias da biblioteca">
          <span className="aba ativa">Todos</span><span className="aba">Livros</span><span className="aba">Reflexões</span><span className="aba">Cartas</span><span className="aba">Relatos</span><span className="aba">Outros</span>
        </div>

        <div className="toolbar">
          <input className="campo-busca" type="search" placeholder="Buscar por título, autor, tema ou conteúdo..." aria-label="Buscar na biblioteca" />
          <button className="botao botao-secundario" type="button">Filtros</button>
        </div>

        <div className="vazio">
          <div className="icone-vazio">▤</div>
          <h3>Sua Biblioteca está pronta para receber o primeiro conteúdo</h3>
          <p>
            O arquivo original será preservado. O processamento criará uma representação separada, com estrutura, fragmentos, evidências e proveniência.
          </p>
          <Link className="botao botao-primario" href="/biblioteca/adicionar">Adicionar primeiro conteúdo</Link>
        </div>
      </section>
    </AppShell>
  );
}
