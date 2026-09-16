# Decisões Arquiteturais

Este arquivo registra escolhas técnicas que não estavam completamente congeladas nos documentos canônicos. Quando uma decisão mudar, ela deverá ser registrada aqui em vez de ser alterada silenciosamente.

## ADR-001 — Migrations iniciais pequenas e ordenadas

**Contexto:** o Dicionário Mestre descreve uma primeira migration ampla, mas também define uma ordem explícita: extensões e schemas, depois `sistema`, `taxonomia`, `biblioteca` e os demais domínios.

**Decisão:** dividir a fundação em migrations pequenas e cumulativas. `0001_fundacao` cria somente extensões, schemas e negação de acesso por padrão. `0002_sistema` cria o schema operacional de sistema. As migrations seguintes respeitam a ordem do Dicionário.

**Consequência:** cada mudança pode ser revisada, testada e revertida com menor risco, sem perder a ordem conceitual definida pelo projeto.

## ADR-002 — Schemas internos fechados por padrão

**Contexto:** Supabase separa privilégios PostgreSQL de RLS. RLS controla linhas; GRANT/REVOKE controla se o objeto pode ser alcançado.

**Decisão:** `sistema`, `taxonomia`, `biblioteca`, `processamento`, `cerebro_autoral`, `reflexoes` e `auditoria` permanecem internos por padrão. A interface receberá somente o acesso mínimo necessário por uma camada controlada em `aplicacao` ou por endpoints do servidor. Tabelas pessoais continuam usando RLS como defesa adicional.

**Consequência:** nenhuma tabela nova se torna uma API pública apenas por ter sido criada.

## ADR-003 — Versão do pipeline como texto

**Contexto:** os documentos usam exemplos como pipeline `2.0`, e não definem `numero_versao` como inteiro.

**Decisão:** `sistema.versoes_pipeline.numero_versao` é `text`, permitindo identificadores semânticos como `1.0`, `1.1` ou `2.0`.

**Consequência:** comparação cronológica deve usar datas/estado, e não ordenação lexical do identificador.

## ADR-004 — Estados iniciais do pipeline

**Contexto:** o Dicionário exige um campo `estado`, mas não fecha seu vocabulário.

**Decisão inicial:** usar os estados técnicos `rascunho`, `ativa`, `arquivada` e `invalidada`, implementados como `text + CHECK`.

**Consequência:** qualquer novo estado exigirá migration explícita e atualização deste registro.

## ADR-005 — Configurações do usuário não são um cofre de segredos

**Contexto:** o Dicionário determina que `sistema.configuracoes_usuario` armazene preferências seguras e não secretas.

**Decisão:** idioma, recuperação, nível de detalhamento e aprovação manual ficam em colunas próprias. Apenas preferências visuais flexíveis ficam em `jsonb`. Chaves de API, senhas, tokens e segredos são proibidos nessa tabela.

**Consequência:** configurações importantes continuam pesquisáveis e validáveis, enquanto metadados puramente visuais podem evoluir sem alterar o schema a cada detalhe de interface.
