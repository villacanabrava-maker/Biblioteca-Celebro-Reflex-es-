import { AppShell } from "@/componentes/app-shell";

const itens = [
  ["◎", "Minha conta", "Dados pessoais, e-mail e gerenciamento da conta"],
  ["≡", "Preferências", "Experiência, notificações e organização"],
  ["◇", "Segurança", "Privacidade, autenticação e proteção dos dados"],
  ["文", "Idioma", "Português (Brasil)"],
  ["◐", "Aparência", "Tema claro, escuro ou automático"],
  ["◉", "Configurações de IA", "Modelos, profundidade e comportamento por tarefa"],
  ["↗", "Integrações", "Serviços externos e conectores futuros"],
  ["?", "Ajuda", "Documentação, tutoriais e suporte"],
  ["i", "Sobre o aplicativo", "Versão, princípios e termos"],
];

export default function ConfiguracoesPage() {
  return (
    <AppShell ativo="configuracoes" titulo="Configurações" subtitulo="Controle, privacidade e preferências">
      <div className="grid-dashboard">
        <section className="card config-lista">
          <div className="card-padding" style={{ paddingBottom: 12 }}>
            <div className="card-header" style={{ marginBottom: 0 }}><div><h2>Seu espaço de controle</h2><p>As opções serão conectadas gradualmente conforme as funcionalidades forem implementadas.</p></div></div>
          </div>
          {itens.map(([icone, titulo, descricao]) => (
            <div className="config-item" key={titulo}>
              <span className="icone-quadrado">{icone}</span>
              <div><strong>{titulo}</strong><p>{descricao}</p></div>
              <span className="seta">›</span>
            </div>
          ))}
        </section>

        <div className="coluna">
          <section className="card card-padding">
            <div className="card-header"><div><h3>Privacidade por padrão</h3><p>Princípio arquitetural, não apenas uma preferência visual.</p></div><span className="status status-sucesso">Ativo</span></div>
            <p style={{ color: "var(--text-muted)", lineHeight: 1.65, marginBottom: 0 }}>
              Conteúdo privado, Storage privado, RLS, mínimo privilégio, segredos somente no servidor e proveniência para inferências importantes.
            </p>
          </section>
          <section className="card card-padding">
            <div className="card-header"><div><h3>Autoria protegida</h3><p>Fontes externas permanecem externas.</p></div></div>
            <div className="tags"><span className="tag verde">Autoral prioritária</span><span className="tag">Externa — referência</span><span className="tag violeta">Influência deliberada</span></div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
