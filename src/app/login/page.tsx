import Link from 'next/link'
import { criarConta, entrar } from './actions'

type LoginPageProps = {
  searchParams: Promise<{
    erro?: string
    status?: string
  }>
}

const mensagensErro: Record<string, string> = {
  configuracao: 'A conexão com o Supabase ainda não foi configurada neste ambiente.',
  dados: 'Informe um e-mail válido e uma senha com pelo menos 8 caracteres.',
  credenciais: 'Não foi possível entrar. Verifique o e-mail e a senha.',
  cadastro: 'Não foi possível criar a conta com esses dados.',
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const mensagemErro = params.erro ? mensagensErro[params.erro] : null
  const aguardandoConfirmacao = params.status === 'confirmacao'

  return (
    <main className="login-page">
      <section className="login-arte">
        <Link className="marca" href="/">
          <span className="marca-simbolo" aria-hidden="true">◜</span>
          <span className="marca-texto">
            <strong>Cérebro Autoral</strong>
            <small>Seu acervo. Seu pensamento. Novas reflexões.</small>
          </span>
        </Link>
        <div className="login-frase">
          <h2>Entre no seu universo autoral.</h2>
          <p>
            Um espaço privado para organizar sua produção intelectual, compreender
            sua metodologia e construir novas reflexões com contexto.
          </p>
        </div>
      </section>

      <section className="login-form-area">
        <form className="login-form">
          <span className="status status-neutro">Supabase Auth</span>
          <h1 style={{ marginTop: 16 }}>Acesse seu Cérebro Autoral</h1>
          <p>Entre com sua conta ou crie uma nova conta com e-mail e senha.</p>

          {mensagemErro ? (
            <div className="login-seguranca" role="alert">
              {mensagemErro}
            </div>
          ) : null}

          {aguardandoConfirmacao ? (
            <div className="login-seguranca" role="status">
              Conta criada. Se a confirmação de e-mail estiver habilitada no projeto,
              confirme a mensagem recebida antes de entrar.
            </div>
          ) : null}

          <div className="grupo-campo">
            <label htmlFor="email">E-mail</label>
            <input
              className="campo"
              id="email"
              name="email"
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="grupo-campo">
            <label htmlFor="senha">Senha</label>
            <input
              className="campo"
              id="senha"
              name="senha"
              type="password"
              placeholder="Mínimo de 8 caracteres"
              autoComplete="current-password"
              minLength={8}
              maxLength={128}
              required
            />
          </div>

          <div className="login-ajudas">
            <span>Sessão protegida por cookies do Supabase Auth</span>
            <span>Recuperação de senha será adicionada em etapa própria</span>
          </div>

          <button className="botao botao-primario botao-bloco" formAction={entrar}>
            Entrar
          </button>
          <button className="botao botao-secundario botao-bloco" formAction={criarConta}>
            Criar conta
          </button>

          <div className="login-seguranca">
            Credenciais são enviadas diretamente ao Supabase Auth. Senhas e chaves
            secretas nunca são gravadas no código do aplicativo.
          </div>
        </form>
      </section>
    </main>
  )
}
