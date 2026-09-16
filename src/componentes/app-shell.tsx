import Link from 'next/link'
import type { ReactNode } from 'react'

type RotaAtiva =
  | 'inicio'
  | 'biblioteca'
  | 'cerebro'
  | 'reflexoes'
  | 'configuracoes'

type AppShellProps = {
  ativo: RotaAtiva
  titulo: string
  subtitulo?: string
  children: ReactNode
}

const navegacao = [
  { chave: 'inicio', href: '/', rotulo: 'Início', icone: '⌂' },
  { chave: 'biblioteca', href: '/biblioteca', rotulo: 'Biblioteca', icone: '▤' },
  { chave: 'cerebro', href: '/cerebro-autoral', rotulo: 'Meu Cérebro', icone: '◉' },
  { chave: 'reflexoes', href: '/reflexoes', rotulo: 'Reflexões', icone: '✦' },
  { chave: 'configuracoes', href: '/configuracoes', rotulo: 'Configurações', icone: '⚙' },
] as const

function Marca({ compacta = false }: { compacta?: boolean }) {
  return (
    <Link className={compacta ? 'marca marca-compacta' : 'marca'} href="/">
      <span className="marca-simbolo" aria-hidden="true">◜</span>
      <span className="marca-texto">
        <strong>Cérebro Autoral</strong>
        {!compacta && <small>Seu acervo. Seu pensamento. Novas reflexões.</small>}
      </span>
    </Link>
  )
}

export function AppShell({ ativo, titulo, subtitulo, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Marca />
        <nav className="sidebar-nav" aria-label="Navegação principal">
          {navegacao.map((item) => (
            <Link
              className={item.chave === ativo ? 'nav-item ativo' : 'nav-item'}
              href={item.href}
              key={item.chave}
              aria-current={item.chave === ativo ? 'page' : undefined}
            >
              <span className="nav-icone" aria-hidden="true">{item.icone}</span>
              <span>{item.rotulo}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-frase">
          <span>“</span>
          Seu pensamento merece contexto, memória e proveniência.
        </div>
      </aside>

      <div className="app-area">
        <header className="topbar">
          <div className="topbar-marca-mobile"><Marca compacta /></div>
          <div className="topbar-titulo">
            <h1>{titulo}</h1>
            {subtitulo && <p>{subtitulo}</p>}
          </div>
          <div className="topbar-acoes">
            <Link className="botao botao-secundario botao-icone" href="/biblioteca" aria-label="Buscar no acervo">⌕</Link>
            <Link className="botao botao-primario topbar-nova-reflexao" href="/criar-reflexao">＋ Nova reflexão</Link>
            <form action="/auth/signout" method="post">
              <button className="botao botao-secundario" type="submit">Sair</button>
            </form>
          </div>
        </header>

        <main className="conteudo-principal">{children}</main>
      </div>

      <nav className="bottom-nav" aria-label="Navegação principal para celular">
        {navegacao.slice(0, 4).map((item) => (
          <Link
            className={item.chave === ativo ? 'bottom-item ativo' : 'bottom-item'}
            href={item.href}
            key={item.chave}
            aria-current={item.chave === ativo ? 'page' : undefined}
          >
            <span aria-hidden="true">{item.icone}</span>
            <small>{item.rotulo === 'Meu Cérebro' ? 'Cérebro' : item.rotulo}</small>
          </Link>
        ))}
        <Link
          className={ativo === 'configuracoes' ? 'bottom-item ativo' : 'bottom-item'}
          href="/configuracoes"
          aria-current={ativo === 'configuracoes' ? 'page' : undefined}
        >
          <span aria-hidden="true">•••</span>
          <small>Mais</small>
        </Link>
      </nav>
    </div>
  )
}
