import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-arte">
        <Link className="marca" href="/">
          <span className="marca-simbolo" aria-hidden="true">◜</span>
          <span className="marca-texto"><strong>Cérebro Autoral</strong><small>Seu acervo. Seu pensamento. Novas reflexões.</small></span>
        </Link>
        <div className="login-frase">
          <h2>Entre no seu universo autoral.</h2>
          <p>Um espaço privado para organizar sua produção intelectual, compreender sua metodologia e construir novas reflexões com contexto.</p>
        </div>
      </section>

      <section className="login-form-area">
        <form className="login-form">
          <span className="status status-neutro">Interface inicial</span>
          <h1 style={{ marginTop: 16 }}>Bem-vindo de volta</h1>
          <p>A autenticação real será conectada ao Supabase Auth na etapa técnica seguinte.</p>
          <div className="grupo-campo"><label htmlFor="email">E-mail</label><input className="campo" id="email" type="email" placeholder="seu@email.com" autoComplete="email" /></div>
          <div className="grupo-campo"><label htmlFor="senha">Senha</label><input className="campo" id="senha" type="password" placeholder="Digite sua senha" autoComplete="current-password" /></div>
          <div className="login-ajudas"><label><input type="checkbox" /> Lembrar de mim</label><span>Recuperar senha</span></div>
          <button className="botao botao-primario botao-bloco" type="button" disabled>Entrar</button>
          <div className="login-seguranca">Seus textos, fontes, reflexões e inferências autorais são tratados como conteúdo privado. Credenciais nunca serão gravadas no código do aplicativo.</div>
        </form>
      </section>
    </main>
  );
}
