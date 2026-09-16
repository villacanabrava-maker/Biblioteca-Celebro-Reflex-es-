export default function PaginaInicial() {
  return (
    <main className="pagina">
      <section className="hero">
        <p className="etiqueta">Fase 0 · Fundação técnica</p>
        <h1>Cérebro Autoral</h1>
        <p className="descricao">
          Plataforma de Inteligência Autoral Personalizada para transformar produção intelectual em conhecimento estruturado, metodologia autoral e novas reflexões personalizadas.
        </p>
      </section>

      <section className="painel" aria-labelledby="estado-projeto">
        <h2 id="estado-projeto">Estado do projeto</h2>
        <ul>
          <li>GitHub oficial conectado</li>
          <li>Fundação Next.js iniciada</li>
          <li>Supabase oficial identificado</li>
          <li>Projeto Vercel ainda será criado a partir deste repositório</li>
        </ul>
      </section>
    </main>
  );
}
