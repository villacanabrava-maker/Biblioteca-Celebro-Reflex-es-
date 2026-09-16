import { AppShell } from "@/componentes/app-shell";

export default function AdicionarConteudoPage() {
  return (
    <AppShell ativo="biblioteca" titulo="Adicionar conteúdo" subtitulo="Inclua uma nova fonte sem alterar o original">
      <section className="card card-padding">
        <div className="card-header">
          <div><h2>Novo conteúdo</h2><p>Esta é a camada visual inicial. O envio real será conectado ao Storage e ao workflow documental.</p></div>
          <span className="status status-neutro">Interface</span>
        </div>

        <h3>1. Tipo de conteúdo</h3>
        <div className="opcoes-conteudo" style={{ marginBottom: 24 }}>
          <button className="opcao-conteudo ativa" type="button">▤<br />Enviar arquivo</button>
          <button className="opcao-conteudo" type="button">✎<br />Escrever texto</button>
          <button className="opcao-conteudo" type="button">◌<br />Adicionar relato</button>
          <button className="opcao-conteudo" type="button">✉<br />Adicionar carta</button>
          <button className="opcao-conteudo" type="button">✦<br />Adicionar reflexão</button>
          <button className="opcao-conteudo" type="button" disabled>▧<br />Envio em lote</button>
        </div>

        <div className="form-grid">
          <div className="grupo-campo full">
            <label htmlFor="arquivo">2. Arquivo original</label>
            <div className="vazio" style={{ padding: 28 }}>
              <div className="icone-vazio">⇧</div>
              <h3>Selecione ou arraste um arquivo</h3>
              <p>O original será armazenado de forma privada e nunca será alterado pelo processamento.</p>
              <input id="arquivo" type="file" disabled aria-describedby="arquivo-ajuda" />
              <small id="arquivo-ajuda" style={{ display: "block", marginTop: 10, color: "var(--text-muted)" }}>Upload será habilitado quando o Storage e as políticas estiverem prontos.</small>
            </div>
          </div>
          <div className="grupo-campo full"><label htmlFor="titulo">Título</label><input className="campo" id="titulo" placeholder="Ex.: Reflexão sobre o futuro" /></div>
          <div className="grupo-campo"><label htmlFor="tipo">Tipo</label><select id="tipo"><option>Documento</option><option>Livro</option><option>Reflexão</option><option>Carta</option><option>Relato</option></select></div>
          <div className="grupo-campo"><label htmlFor="autoria">Autoria</label><select id="autoria"><option>Autoral</option><option>Externa</option></select></div>
          <div className="grupo-campo"><label htmlFor="ano">Ano</label><input className="campo" id="ano" inputMode="numeric" placeholder="2026" /></div>
          <div className="grupo-campo"><label htmlFor="participacao">Participação no cérebro</label><select id="participacao"><option>Autoral prioritária</option><option>Externa — referência</option><option>Excluída do cérebro</option></select></div>
          <div className="grupo-campo full"><label htmlFor="observacoes">Observações</label><textarea id="observacoes" placeholder="Contexto opcional sobre a origem ou importância deste material..." /></div>
        </div>

        <button className="botao botao-primario botao-bloco" style={{ marginTop: 20 }} type="button" disabled>Enviar para processamento</button>
      </section>
    </AppShell>
  );
}
