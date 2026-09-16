import Link from 'next/link'
import { AppShell } from '@/componentes/app-shell'
import { createClient } from '@/infraestrutura/supabase/server'

type ObraBiblioteca = {
  id: string
  codigo: string
  titulo: string
  tipo_obra: string
  autoria: 'autoral' | 'externa'
  participacao_cerebro: string
  idioma: string
  descricao: string | null
  estado: string
  criado_em: string
  versao_id: string | null
  numero_versao: number | null
  nome_arquivo: string | null
  estado_processamento: string | null
  versao_criada_em: string | null
}

function rotuloTipo(tipo: string) {
  return tipo.replaceAll('_', ' ')
}

function rotuloParticipacao(valor: string) {
  const rotulos: Record<string, string> = {
    autoral_prioritaria: 'Autoral prioritária',
    externa_referencia: 'Externa — referência',
    externa_influencia: 'Influência externa',
    excluida_cerebro: 'Excluída do Cérebro',
  }
  return rotulos[valor] ?? valor
}

function statusProcessamento(valor: string | null) {
  if (valor === 'concluido') return ['Concluído', 'status status-sucesso'] as const
  if (valor === 'em_processamento') return ['Processando', 'status status-aviso'] as const
  if (valor === 'falhou') return ['Falhou', 'status status-neutro'] as const
  return ['Recebido', 'status status-neutro'] as const
}

export default async function BibliotecaPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.schema('aplicacao').rpc('listar_obras')
  const obras = (data ?? []) as ObraBiblioteca[]

  return (
    <AppShell ativo="biblioteca" titulo="Biblioteca" subtitulo="Seu acervo pessoal de fontes e documentos">
      <section className="card card-padding">
        <div className="card-header">
          <div>
            <h2>Seu acervo</h2>
            <p>Originais preservados, versões rastreáveis e processamento visível.</p>
          </div>
          <Link className="botao botao-primario" href="/biblioteca/adicionar">＋ Adicionar</Link>
        </div>

        <div className="abas" aria-label="Categorias da biblioteca">
          <span className="aba ativa">Todos</span>
          <span className="aba">Livros</span>
          <span className="aba">Reflexões</span>
          <span className="aba">Cartas</span>
          <span className="aba">Relatos</span>
          <span className="aba">Outros</span>
        </div>

        <div className="toolbar">
          <input className="campo-busca" type="search" placeholder="Busca e filtros serão conectados ao retrieval na próxima evolução" aria-label="Buscar na biblioteca" disabled />
          <span className="status status-neutro">{obras.length} {obras.length === 1 ? 'obra' : 'obras'}</span>
        </div>

        {error ? (
          <div className="vazio">
            <div className="icone-vazio">!</div>
            <h3>Não foi possível consultar sua Biblioteca</h3>
            <p>A conexão está protegida. Atualize a página ou verifique a configuração do Supabase neste ambiente.</p>
          </div>
        ) : obras.length === 0 ? (
          <div className="vazio">
            <div className="icone-vazio">▤</div>
            <h3>Sua Biblioteca está pronta para receber o primeiro conteúdo</h3>
            <p>
              O arquivo original será preservado. O processamento criará uma representação separada, com estrutura, fragmentos, evidências e proveniência.
            </p>
            <Link className="botao botao-primario" href="/biblioteca/adicionar">Adicionar primeiro conteúdo</Link>
          </div>
        ) : (
          <div className="lista">
            {obras.map((obra) => {
              const [rotuloStatus, classeStatus] = statusProcessamento(obra.estado_processamento)
              return (
                <article className="item-lista" key={obra.id}>
                  <div className="icone-quadrado" aria-hidden="true">▤</div>
                  <div className="item-lista-corpo">
                    <strong>{obra.titulo}</strong>
                    <p>
                      {obra.codigo} · {rotuloTipo(obra.tipo_obra)} · {obra.autoria === 'autoral' ? 'Autoral' : 'Externa'}
                      {obra.numero_versao ? ` · versão ${obra.numero_versao}` : ''}
                    </p>
                    <div className="tags" style={{ marginTop: 9 }}>
                      <span className="tag">{rotuloParticipacao(obra.participacao_cerebro)}</span>
                      <span className="tag verde">{obra.idioma}</span>
                      {obra.nome_arquivo ? <span className="tag">{obra.nome_arquivo}</span> : null}
                    </div>
                  </div>
                  <span className={classeStatus}>{rotuloStatus}</span>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </AppShell>
  )
}
