import { AppShell } from "@/componentes/app-shell";

const etapas = ["Entrada", "Comentário", "Contexto", "Conflitos", "Plano", "IA", "Revisão"];

export default function CriarReflexaoPage() {
  return (
    <AppShell ativo="reflexoes" titulo="Criar Reflexão" subtitulo="Do conteúdo externo ao seu novo texto autoral">
      <section className="card card-padding">
        <div className="etapas" aria-label="Etapas da reflexão">
          {etapas.map((etapa, indice) => (
            <div className={indice === 0 ? "etapa ativa" : "etapa"} key={etapa}>
              <span className="etapa-numero">{indice + 1}</span>
              <span>{etapa}</span>
            </div>
          ))}
        </div>

        <div className="card-header">
          <div><h2>1. Reflexão externa</h2><p>Insira uma ideia, texto ou fonte sobre a qual você deseja pensar.</p></div>
          <span className="status status-neutro">Rascunho</span>
        </div>

        <div className="opcoes-conteudo" style={{ marginBottom: 18 }}>
          <button className="opcao-conteudo ativa" type="button">✎<br />Colar texto</button>
          <button className="opcao-conteudo" type="button">⇧<br />Enviar arquivo</button>
          <button className="opcao-conteudo" type="button">↗<br />Link da web</button>
        </div>

        <div className="grupo-campo">
          <label htmlFor="entrada-reflexao">Conteúdo de partida</label>
          <textarea id="entrada-reflexao" placeholder="Cole aqui um trecho, artigo, ideia, notícia, anotação ou outro conteúdo que deseja colocar em diálogo com o seu universo autoral..." />
          <small style={{ color: "var(--text-muted)" }}>Nesta fase visual o conteúdo ainda não é enviado à IA.</small>
        </div>

        <div className="insight" style={{ margin: "20px 0" }}>
          O fluxo final irá recuperar contexto do seu acervo e do Cérebro Autoral, identificar tensões e conflitos, montar um plano, gerar um rascunho e submetê-lo a auditoria antes da sua revisão.
        </div>

        <button className="botao botao-primario botao-bloco" type="button" disabled>Próximo: adicionar meu comentário</button>
      </section>
    </AppShell>
  );
}
