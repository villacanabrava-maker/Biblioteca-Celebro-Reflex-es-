# Decisões Arquiteturais

Este arquivo registra escolhas técnicas que não estavam completamente congeladas nos documentos canônicos. Quando uma decisão mudar, ela deverá ser registrada aqui em vez de ser alterada silenciosamente.

## ADR-001 — Migrations iniciais pequenas e ordenadas

**Contexto:** o Dicionário Mestre descreve uma primeira migration ampla, mas também define uma ordem explícita: extensões e schemas, depois `sistema`, `taxonomia`, `biblioteca` e os demais domínios.

**Decisão:** dividir a fundação em migrations pequenas e cumulativas. `0001_fundacao` cria somente extensões, schemas e negação de acesso por padrão. `0002_sistema` cria o schema operacional de sistema. As migrations seguintes respeitam a ordem do Dicionário.

**Consequência:** cada mudança pode ser revisada, testada e revertida com menor risco, sem perder a ordem conceitual definida pelo projeto.

## ADR-002 — Schemas internos fechados por padrão

**Contexto:** Supabase separa privilégios PostgreSQL de RLS. RLS controla linhas; GRANT/REVOKE controla se o objeto pode ser alcançado.

**Decisão:** `sistema`, `taxonomia`, `biblioteca`, `processamento`, `cerebro_autoral`, `reflexoes` e `auditoria` permanecem internos por padrão. A interface recebe somente o acesso mínimo necessário por uma camada controlada em `aplicacao` ou por endpoints do servidor. Tabelas pessoais continuam usando RLS como defesa adicional.

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

## ADR-010 — Integridade multiusuário por FK composta na Biblioteca

**Contexto:** o Dicionário Mestre recomenda que tabelas filhas com `usuario_id` preservem o vínculo `(parent_id, usuario_id) -> (parent.id, parent.usuario_id)` para evitar associações acidentais entre usuários.

**Decisão:** `biblioteca.versoes_obras` referencia `biblioteca.obras` pelo par `(obra_id, usuario_id)`. A tabela pai recebe `unique (id, usuario_id)` apenas para permitir essa FK composta.

**Consequência:** uma versão física não pode apontar para uma obra de outro usuário mesmo que um ID incorreto seja enviado pela aplicação ou por processo interno.

## ADR-011 — Busca textual inicial da Biblioteca usa configuração `simple`

**Contexto:** o Dicionário exige índice de busca textual em título/descrição e o corpus poderá conter múltiplos idiomas. Usar uma configuração linguística fixa como `portuguese` introduziria stemming específico de um idioma antes de conhecermos o corpus real.

**Decisão:** o primeiro índice Full Text Search de `biblioteca.obras` usa `to_tsvector('simple', titulo_normalizado || descricao)`. Busca multilíngue, pesos, normalização avançada e reranking serão refinados na fase de recuperação híbrida.

**Consequência:** a Biblioteca já nasce pesquisável sem assumir que todo conteúdo está em português. A estratégia poderá evoluir por migration e avaliação de retrieval.

## ADR-012 — Regra completa de `externa_influencia` é parcialmente adiada

**Contexto:** o Dicionário determina que `participacao_cerebro = 'externa_influencia'` exija `autoria = 'externa'` e um registro ativo em `cerebro_autoral.influencias_externas`. Essa tabela ainda não existe na etapa da Biblioteca.

**Decisão:** `0004_biblioteca` já exige por CHECK que `externa_influencia` tenha autoria externa. A validação contra um registro ativo de influência será adicionada quando `cerebro_autoral.influencias_externas` for criada.

**Consequência:** a parte verificável da regra já é garantida no banco, sem criar dependência circular ou inventar uma tabela fora da ordem de construção.

## ADR-013 — `atualizado_em` sem trigger global nesta etapa

**Contexto:** `biblioteca.obras` possui `atualizado_em`, mas o Dicionário coloca funções utilitárias e triggers como etapa posterior às tabelas/índices principais.

**Decisão:** a coluna nasce com `default now()`, mas o trigger reutilizável de atualização automática será criado em uma migration de funções/triggers compartilhados, em vez de duplicar função técnica dentro de `0004_biblioteca`.

**Consequência:** até essa migration utilitária existir, qualquer atualização de obra feita pelo backend deverá também atualizar `atualizado_em` explicitamente.

## ADR-014 — Bucket de originais é privado e versionado por migration

**Contexto:** os documentos canônicos definem o bucket `originais-biblioteca` como privado. A documentação atual do Supabase suporta criação de buckets por SQL e informa que buckets privados submetem operações e downloads às políticas RLS.

**Decisão:** `0006_storage_biblioteca` cria/garante o bucket `originais-biblioteca` com `public = false` e versiona as políticas de `storage.objects` no mesmo histórico de migrations do projeto.

**Consequência:** a infraestrutura de arquivos pode ser reproduzida junto com o banco, e um deploy novo não depende de configuração manual silenciosa no Dashboard.

## ADR-015 — Isolamento de objetos pelo primeiro segmento do caminho

**Contexto:** o caminho canônico é representado como `/{usuario_id}/{obra_id}/{versao_id}/original.ext`. No Supabase Storage, nomes de objetos não precisam de barra inicial e a função `storage.foldername(name)` permite controlar pastas via RLS.

**Decisão:** o nome efetivo do objeto será `{usuario_id}/{obra_id}/{versao_id}/original.ext`. As quatro policies de SELECT/INSERT/UPDATE/DELETE exigem que o primeiro segmento seja exatamente `auth.uid()::text` e que o bucket seja `originais-biblioteca`.

**Consequência:** um usuário autenticado não pode usar a API normal do Storage para acessar ou gravar arquivos na pasta de outro usuário. O backend deverá sempre gerar caminhos nesse formato.

## ADR-016 — MIME e tamanho de arquivo ainda não congelados no bucket

**Contexto:** o Dicionário Mestre deixa deliberadamente em aberto o conjunto completo de tipos de arquivo e a estratégia final de OCR. O Supabase permite configurar `allowed_mime_types` e limite de tamanho diretamente no bucket.

**Decisão:** `0006_storage_biblioteca` não congela MIME nem limite máximo de arquivo. Essas restrições serão definidas após a fase de upload/processamento validar os formatos suportados e os limites operacionais.

**Consequência:** não bloqueamos prematuramente documentos válidos. A validação inicial será feita pela aplicação e, quando os formatos forem formalizados, o bucket poderá ser endurecido por migration explícita.

## ADR-017 — `aplicacao` é a única fronteira da Biblioteca na Data API

**Contexto:** a interface precisa consultar e registrar obras, mas expor `biblioteca` diretamente pela Data API enfraqueceria a separação entre persistência interna e superfície pública.

**Decisão:** `0007_api_aplicacao_biblioteca` configura `pgrst.db_schemas` como `public, graphql_public, aplicacao`. O schema `biblioteca` permanece fora da Data API. A UI acessa somente funções explicitamente liberadas em `aplicacao`.

**Consequência:** evolução de tabelas internas não amplia automaticamente a superfície HTTP. Qualquer nova operação pública exige uma RPC deliberada e um grant explícito.

## ADR-018 — RPCs públicas não recebem `usuario_id` do navegador

**Contexto:** permitir que o cliente informe o proprietário de uma obra cria risco de troca de identidade e exige confiar em um campo controlado pelo usuário.

**Decisão:** `aplicacao.listar_obras()` e `aplicacao.registrar_obra_arquivo(...)` derivam a identidade exclusivamente de `auth.uid()`. As funções são `SECURITY DEFINER`, usam `set search_path = ''`, validam entradas e recebem grants mínimos.

**Consequência:** a autorização não depende de o navegador enviar o usuário correto. O banco continua sendo a autoridade sobre identidade e propriedade.

## ADR-019 — Códigos humanos iniciais derivados de UUID

**Contexto:** o Dicionário exige códigos humanos e apresenta exemplos como `OBR-000001`, mas não congela uma sequência global. Uma sequência global pode revelar volume, criar contenção e exigir uma política adicional de escopo multiusuário.

**Decisão:** na primeira versão, o código da obra é `OBR-` seguido dos 12 primeiros caracteres hexadecimais do UUID e o código da versão é `VOB-` com o mesmo padrão. Os UUIDs continuam sendo as chaves reais.

**Consequência:** os códigos são estáveis, legíveis e independentes de contador global. Se o produto exigir numeração sequencial humana no futuro, isso será introduzido por migration e decisão própria.

## ADR-020 — Upload resumível TUS desde o primeiro fluxo real

**Contexto:** livros e documentos podem ser grandes. A documentação atual do Supabase recomenda TUS para arquivos acima de 6 MB, redes instáveis e quando progresso/retomada são importantes.

**Decisão:** o frontend usa `tus-js-client`, endpoint direto do Storage, retries progressivos, retomada de uploads anteriores e chunks de exatamente 6 MB. Não é enviado `x-upsert`, evitando sobrescrita silenciosa do original.

**Consequência:** upload de livros grandes é mais resiliente e pode continuar após interrupções sem modificar a regra de preservação do original.

## ADR-021 — SHA-256 incremental no navegador e futura revalidação no pipeline

**Contexto:** o Dicionário exige SHA-256 para integridade e deduplicação. Ler um livro grande inteiro em memória só para calcular hash aumenta uso de RAM desnecessariamente.

**Decisão:** o frontend calcula SHA-256 incrementalmente com `hash-wasm`, em blocos. O hash é enviado para o registro da versão. O pipeline documental poderá recalcular/verificar o hash do objeto armazenado como defesa adicional antes do processamento.

**Consequência:** o primeiro upload já possui identidade de conteúdo sem sacrificar memória do navegador, e a segurança futura não precisa confiar cegamente em um hash informado pelo cliente.

## ADR-022 — `externa_influencia` não aparece no upload inicial

**Contexto:** uma influência externa deliberada exige escopo, intensidade e registro explícito no Cérebro Autoral, estruturas que ainda não foram implementadas.

**Decisão:** ao adicionar uma fonte externa agora, a interface oferece `externa_referencia` ou `excluida_cerebro`. A opção `externa_influencia` só será habilitada no painel próprio de influências quando suas entidades e regras existirem.

**Consequência:** uma referência externa não pode virar influência metodológica apenas por uma seleção prematura no formulário de upload.

## ADR-023 — Auth SSR usa `getClaims()` para autorização

**Contexto:** no padrão atual do Supabase para Next.js SSR, cookies podem precisar ser renovados no Proxy e `getSession()` não deve ser usado no servidor como prova de autorização.

**Decisão:** o projeto usa `@supabase/ssr`, clientes separados para browser/servidor, cookies, `proxy.ts` e `supabase.auth.getClaims()` para validar identidade server-side. `getSession()` é usado apenas no navegador durante TUS para obter o access token que é validado pelo Storage remoto.

**Consequência:** rotas protegidas e operações server-side não confiam em sessão não verificada, enquanto o upload resumível continua compatível com o mecanismo TUS.

## ADR-024 — Deploy novo não reutiliza projeto Vercel antigo

**Contexto:** a inspeção da conta Vercel conectada mostrou apenas projetos antigos e nenhum ligado ao repositório canônico novo. Os documentos do projeto proíbem reutilizar automaticamente o deploy anterior.

**Decisão:** será criado um projeto Vercel exclusivo, recomendado como `cerebro-autoral`, importando `villacanabrava-maker/Biblioteca-Celebro-Reflex-es-`. O projeto receberá apenas as variáveis necessárias ao novo aplicativo.

**Consequência:** o histórico e a configuração do aplicativo anterior não contaminam o novo produto. Como o conector Vercel disponível não permite criar projeto nem editar variáveis de ambiente, essa configuração permanece uma ação externa explícita e documentada.
