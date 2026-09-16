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

## ADR-006 — Estado de conceito ainda sem CHECK

**Contexto:** o Dicionário Mestre exige `taxonomia.conceitos.estado`, mas não enumera quais valores são canônicos para esse campo. Ao mesmo tempo, a regra geral do projeto determina que estados técnicos estáveis usem `text + CHECK`.

**Decisão:** em `0003_taxonomia`, `estado` é `text not null`, mas ainda sem `CHECK`. Não será inventado um vocabulário que os documentos não definiram.

**Consequência:** antes de a Taxonomia Mestre entrar em operação real, o vocabulário de estado de conceito deverá ser formalizado no Dicionário e endurecido por migration explícita.

## ADR-007 — FK de classificação para elemento processado é adiada

**Contexto:** o Dicionário ordena a criação de Taxonomia antes de Processamento, mas `taxonomia.classificacoes_elementos.elemento_id` deverá apontar para `processamento.elementos`, tabela que ainda não existe nessa etapa.

**Decisão:** criar `elemento_id uuid not null` em `0003_taxonomia`, documentando a referência lógica, e adicionar a FK somente na migration em que `processamento.elementos` existir.

**Consequência:** a ordem canônica das migrations é preservada sem criar dependência impossível. A integridade referencial completa será adicionada antes de classificações reais entrarem em produção.

## ADR-008 — Bloqueio de duplicações exatas na Taxonomia

**Contexto:** o Dicionário define vocabulários controlados e uma Taxonomia Mestre reutilizável, mas não especifica todas as constraints de duplicidade.

**Decisão:** impedir duplicações exatamente equivalentes dentro do mesmo escopo, incluindo código de conceito na mesma versão, termo normalizado repetido no mesmo conceito/tipo/idioma, relação idêntica com a mesma origem e classificação idêntica do mesmo usuário/elemento/conceito/papel.

**Consequência:** reexecuções e processamento repetido não geram linhas semanticamente idênticas. Se no futuro houver necessidade de registrar ocorrências múltiplas como evidências separadas, isso será modelado em tabela própria de evidência/proveniência, e não por duplicação da entidade canônica.

## ADR-009 — Chave da OpenAI somente em secret servidor-side

**Contexto:** a aplicação precisará chamar a OpenAI API, mas qualquer chave colocada em código, README, browser ou repositório compromete a segurança e pode gerar uso e cobrança indevidos.

**Decisão:** a aplicação usará apenas a variável servidor-side `OPENAI_API_KEY`. O valor nunca será persistido no repositório. Uma chave fornecida diretamente em conversa de desenvolvimento será considerada exposta e deverá ser rotacionada antes de ser ativada no ambiente real.

**Consequência:** a integração da OpenAI pode ser preparada no código sem depender do segredo. A ativação efetiva só ocorrerá quando uma chave nova estiver armazenada no mecanismo de secrets do ambiente servidor.
