# Decisões Arquiteturais

Este arquivo registra escolhas técnicas que não estavam completamente congeladas nos documentos canônicos. Uma decisão não deve ser alterada silenciosamente: quando houver refinamento ou substituição, isso deve aparecer em novo ADR ou na própria decisão com indicação explícita.

---

## ADR-001 — Migrations iniciais pequenas e ordenadas

**Contexto:** o Dicionário Mestre descreve uma fundação ampla, mas define uma ordem explícita entre extensões/schemas e os domínios.

**Decisão:** dividir a fundação em migrations pequenas e cumulativas, respeitando a ordem canônica.

**Consequência:** revisão, teste e correção ficam menores e rastreáveis.

## ADR-002 — Schemas internos fechados por padrão

**Contexto:** RLS controla linhas; GRANT/REVOKE controla acesso aos objetos.

**Decisão:** `sistema`, `taxonomia`, `biblioteca`, `processamento`, `cerebro_autoral`, `reflexoes` e `auditoria` permanecem internos. A superfície de API é controlada por `aplicacao`.

**Consequência:** criar uma tabela não a transforma automaticamente em endpoint público.

## ADR-003 — Versão do pipeline como texto

**Contexto:** os documentos usam identificadores como `1.0`, `1.1` e `2.0`.

**Decisão:** `sistema.versoes_pipeline.numero_versao` usa `text`.

**Consequência:** ordem cronológica depende de datas/estado, não de ordenação lexical.

## ADR-004 — Estados iniciais do pipeline

**Contexto:** o Dicionário exige estado versionado do pipeline, mas não congelou todo o vocabulário operacional na fundação.

**Decisão:** versões de pipeline usam `rascunho`, `ativa`, `arquivada` e `invalidada`, por `text + CHECK`.

**Consequência:** novos estados exigem migration explícita.

## ADR-005 — Configurações do usuário não são cofre de segredos

**Contexto:** preferências e segredos têm riscos e ciclos de vida diferentes.

**Decisão:** `sistema.configuracoes_usuario` guarda apenas preferências não secretas. Chaves, senhas e tokens ficam fora do banco de preferências.

**Consequência:** nenhuma credencial deve ser persistida nessa tabela.

## ADR-006 — Estado de conceito ainda sem CHECK

**Contexto:** `taxonomia.conceitos.estado` é obrigatório, mas o Dicionário não enumera seus valores.

**Decisão:** manter `text not null` sem inventar um vocabulário.

**Consequência:** o CHECK será criado quando o Dicionário formalizar os estados.

## ADR-007 — FK Taxonomia → Elementos foi inicialmente adiada

**Contexto:** Taxonomia foi criada antes de `processamento.elementos`.

**Decisão:** `classificacoes_elementos.elemento_id` nasceu sem FK e a referência foi adicionada em `0013`, quando a tabela de elementos passou a existir.

**Consequência:** a ordem canônica foi preservada e a integridade referencial hoje está completa.

## ADR-008 — Bloqueio de duplicações taxonômicas exatas

**Contexto:** reexecuções não devem multiplicar a mesma entidade canônica.

**Decisão:** usar constraints de unicidade para conceitos/termos/relações/classificações semanticamente idênticos no mesmo escopo.

**Consequência:** evidências repetidas devem ser modeladas como evidências, não como duplicação da entidade canônica.

## ADR-009 — Chave OpenAI somente server-side

**Contexto:** chaves em browser, Git ou README podem gerar acesso indevido e cobrança.

**Decisão:** somente `OPENAI_API_KEY` no ambiente servidor. A chave enviada no chat é tratada como exposta e deve ser rotacionada antes da ativação real.

**Consequência:** o código pode existir sem segredo; produção só será ativada com chave nova armazenada diretamente no ambiente.

## ADR-010 — Integridade multiusuário por FKs compostas

**Contexto:** um filho com `usuario_id` não deve poder apontar para entidade de outro usuário.

**Decisão:** quando pai e filho carregam usuário, usar vínculos do tipo `(parent_id, usuario_id) -> (parent.id, parent.usuario_id)`.

**Consequência:** erros internos não atravessam fronteira de propriedade apenas por conhecer um UUID.

## ADR-011 — Busca textual inicial usa configuração `simple`

**Contexto:** o corpus pode ser multilíngue.

**Decisão:** FTS inicial usa `to_tsvector('simple', ...)`; stemming específico será avaliado na recuperação híbrida.

**Consequência:** a base não assume prematuramente que todo conteúdo está em português.

## ADR-012 — Regra completa de `externa_influencia` é progressiva

**Contexto:** influência deliberada exige entidade própria no Cérebro Autoral.

**Decisão:** a Biblioteca já exige autoria externa; a validação contra `cerebro_autoral.influencias_externas` será adicionada quando essa estrutura existir.

**Consequência:** não criamos dependência circular, mas também não tratamos referência comum como influência metodológica.

## ADR-013 — `atualizado_em` sem trigger global prematuro

**Contexto:** utilitários/triggers compartilhados pertencem a uma etapa posterior da fundação.

**Decisão:** campos recebem `default now()` e o trigger compartilhado será introduzido em migration própria quando necessário.

**Consequência:** atualizações feitas antes disso precisam escrever `atualizado_em` explicitamente.

## ADR-014 — Bucket de originais privado e versionado por migration

**Contexto:** o original é conteúdo intelectual privado e a infraestrutura deve ser reproduzível.

**Decisão:** `originais-biblioteca` é criado/configurado por migration com `public = false`.

**Consequência:** um ambiente novo reproduz bucket e políticas sem configuração invisível.

## ADR-015 — Isolamento de Storage pelo primeiro segmento do caminho

**Contexto:** cada usuário precisa ter namespace próprio.

**Decisão:** caminho efetivo `{usuario_id}/{obra_id}/{versao_id}/original.ext`; policies exigem primeira pasta igual a `auth.uid()`.

**Consequência:** a API normal do Storage não permite acesso à pasta de outro usuário.

## ADR-016 — MIME e tamanho de arquivo ainda não congelados

**Contexto:** formatos finais e estratégia de OCR continuam deliberadamente abertos no Dicionário.

**Decisão:** bucket sem `allowed_mime_types`/limite global por enquanto; validação evoluirá junto do pipeline.

**Consequência:** não bloqueamos prematuramente documentos que podem ser suportados depois.

## ADR-017 — `aplicacao` é a fronteira da Data API

**Contexto:** expor schemas internos ampliaria superfície e acoplamento.

**Decisão:** PostgREST expõe `public`, `graphql_public` e `aplicacao`; schemas de domínio ficam fechados.

**Consequência:** novas operações públicas exigem RPC deliberada e grant explícito.

## ADR-018 — RPCs públicas derivam identidade de `auth.uid()`

**Contexto:** o navegador não pode escolher quem é o proprietário.

**Decisão:** RPCs não recebem `usuario_id`; derivam o usuário autenticado e usam `SECURITY DEFINER` + `search_path = ''`.

**Consequência:** autorização não depende de campos enviados pelo cliente.

## ADR-019 — Códigos humanos iniciais derivados de UUID

**Contexto:** o Dicionário exige código humano, mas não congela contador global.

**Decisão:** `OBR-`/`VOB-` usam prefixo derivado do UUID; UUID continua sendo a chave real.

**Consequência:** evitamos contador global e vazamento de volume sem impedir futura numeração sequencial.

## ADR-020 — TUS com retries; retomada entre reloads exige IDs persistentes

**Contexto:** `findPreviousUploads()` era incompatível com novos UUIDs gerados a cada submissão.

**Decisão:** manter TUS, endpoint direto, chunks de 6 MB e retries da operação atual, mas não retomar fingerprint de submissão anterior até existir uma operação persistente com IDs estáveis.

**Consequência:** elimina risco de upload antigo ser registrado com caminho/UUID novo.

## ADR-021 — SHA-256 incremental no navegador e revalidação futura no servidor

**Contexto:** hash é necessário para integridade/deduplicação, mas arquivos grandes não devem ser carregados inteiros na memória.

**Decisão:** calcular SHA-256 em blocos com `hash-wasm`; o pipeline deverá recalcular/verificar o objeto armazenado antes de processar.

**Consequência:** o upload já tem identidade de conteúdo sem transformar o navegador em autoridade final.

## ADR-022 — `externa_influencia` não aparece no upload inicial

**Contexto:** influência externa deliberada exige escopo, intensidade e registro próprio.

**Decisão:** upload de fonte externa oferece `externa_referencia` ou `excluida_cerebro`; influência será habilitada apenas no painel específico.

**Consequência:** referência externa não vira influência metodológica por clique acidental.

## ADR-023 — Auth SSR usa `getClaims()` para autorização

**Contexto:** `getSession()` não deve ser prova de identidade no servidor.

**Decisão:** usar `@supabase/ssr`, cookies, `proxy.ts` e `getClaims()` server-side. `getSession()` no browser é usado somente para obter token encaminhado ao Storage.

**Consequência:** decisões de autorização server-side dependem de JWT validado.

## ADR-024 — Deploy usa Vercel novo e exclusivo

**Contexto:** o projeto novo não pode herdar silenciosamente deploy/configuração do aplicativo anterior.

**Decisão:** projeto Vercel `cerebro-autoral`, ligado ao repositório canônico novo.

**Consequência:** produção atual está separada do legado e foi verificada online.

## ADR-025 — Nome das migrations no Git coincide com histórico Supabase

**Contexto:** a auditoria encontrou timestamps divergentes e prefixo duplicado nos arquivos.

**Decisão:** renomear arquivos para os números de versão já registrados no Supabase, sem alterar SQL nem reexecutar banco.

**Consequência:** replay/CLI/auditoria passam a descrever a mesma sequência do banco real. A regra vale para migrations futuras; a auditoria da Fase 3 aplicou novamente essa regra à `0017`.

## ADR-026 — Pipeline 1.0 e Taxonomia 1.0 existem antes da primeira execução

**Contexto:** `processamento.execucoes` exige versões referenciáveis e as tabelas estavam vazias.

**Decisão:** `0010` cria/ativa apenas os registros de versão `1.0`, sem inventar conceitos ou modelos.

**Consequência:** toda execução poderá registrar proveniência desde o início.

## ADR-027 — Runtime Node é o mesmo no CI e Vercel

**Contexto:** `>=22` permitiu Vercel Node 24 enquanto CI validava Node 22.

**Decisão:** `engines.node = 22.x` e CI em Node 22.x.

**Consequência:** upgrade de major passa a ser decisão explícita e testada. A configuração externa da Vercel deve ser mantida em 22.x para cumprir esta decisão.

## ADR-028 — Dependências exigem lockfile e CI usa `npm ci`

**Contexto:** sem lockfile, builds em datas diferentes podiam resolver árvores diferentes.

**Decisão:** versionar `package-lock.json` e usar `npm ci` no CI. A versão original de `packageManager` foi npm 10.9.8; a atualização para npm 11.19.1 é formalizada no ADR-041.

**Consequência:** builds são reproduzíveis e mudanças de dependência exigem commit.

## ADR-029 — Repositório público é risco operacional

**Contexto:** o repo canônico está público; não foram encontrados segredos conhecidos, mas arquitetura e documentação proprietária ficam expostas.

**Decisão:** recomendar repositório privado antes de conteúdo intelectual real. Segurança do aplicativo não dependerá apenas dessa privacidade.

**Consequência:** alteração de visibilidade continua como ação administrativa externa.

## ADR-030 — ESLint permanece em 9.39.5 por compatibilidade comprovada

**Contexto:** atualização para ESLint 10.10.0 foi testada no CI e falhou porque `eslint-config-next 16.3.5` carrega plugin React dependente de API removida no ESLint 10.

**Decisão:** fixar `eslint = 9.39.5` até a cadeia Next/plugin suportar ESLint 10.

**Consequência:** não mascaramos erro nem mantemos `latest`; upgrade será um PR técnico próprio quando compatível.

## ADR-031 — Vetores v1 usam 1536 dimensões + HNSW cosine

**Contexto:** o Dicionário v1 padroniza `vector(1536)` e exige versionamento para mudança dimensional. A recuperação semântica precisa de índice vetorial.

**Decisão:** `processamento.vetores.embedding` usa `extensions.vector(1536)` e índice HNSW com `extensions.vector_cosine_ops`.

**Consequência:** o índice pode existir desde tabela vazia e qualquer mudança de dimensionalidade exige migration/versionamento explícito.

## ADR-032 — Documento Processado preserva hierarquia, não chunks planos

**Contexto:** o produto precisa recuperar conteúdo com contexto estrutural.

**Decisão:** modelar `documentos_processados`, `secoes`, `fragmentos` e `sinteses`, preservando pai/filho, ordem, páginas e conteúdo contextualizado.

**Consequência:** retrieval futuro pode operar por obra, parte, capítulo, seção e fragmento.

## ADR-033 — Evidência pertence ao mesmo Documento Processado do elemento

**Contexto:** FKs por usuário impediam cruzar usuários, mas ainda permitiam elemento de um documento apontar para fragmento de outro documento do mesmo usuário.

**Decisão:** `0015` cria validação no banco que exige o mesmo `documento_processado_id` entre elemento e fragmento de uma evidência.

**Consequência:** proveniência textual de cada elemento permanece local ao documento que o originou; relações intelectuais entre documentos continuam permitidas em `relacoes_elementos`.

## ADR-034 — Documento Processado ativo exige publicação explícita

**Contexto:** regra canônica determina publicação candidata → ativa somente após validação.

**Decisão:** estado `ativo` exige `publicado_em not null`; índice parcial garante no máximo um ativo por usuário/obra.

**Consequência:** o Cérebro não deverá consumir representação parcial ou nunca publicada.

## ADR-035 — Deduplicação por hash usa advisory lock, não UNIQUE estrutural

**Contexto:** o Dicionário define `hash_sha256` para integridade/deduplicação e recomenda índice `(usuario_id, hash_sha256)`, mas não exige `UNIQUE`. Uma simples consulta antes do insert teria corrida concorrente.

**Decisão:** `0016` usa `pg_advisory_xact_lock` derivado de usuário + SHA-256, consulta hash existente dentro da transação e recusa o segundo registro com `arquivo_duplicado_por_hash`.

**Consequência:** deduplicação é segura sob concorrência sem impor semântica de unicidade que o Dicionário não congelou.

## ADR-036 — Backend não ganha acesso direto aos schemas internos

**Contexto:** a auditoria confirmou que até `service_role` não possui `USAGE` em `processamento`, `biblioteca` e demais schemas internos.

**Decisão:** manter a fronteira. O workflow documental usará RPCs **server-only em `aplicacao`**, concedidas apenas ao backend, executando internamente com `SECURITY DEFINER` e `search_path = ''`.

**Consequência:** não precisamos abrir schemas internos na Data API para executar processamento.

## ADR-037 — Rotas públicas do Proxy são exatas

**Contexto:** `startsWith('/login')` e `startsWith('/auth')` poderiam tornar públicos caminhos apenas semelhantes.

**Decisão:** considerar público somente `/login` e caminhos dentro de `/auth/`.

**Consequência:** novas rotas semelhantes não escapam da autenticação por prefixo amplo.

## ADR-038 — Todos os arquivos `.env*` são ignorados, exceto exemplo

**Contexto:** ignorar somente `.env`, `.env.local` e variantes locais ainda deixava risco de `/.env.production` real ser commitido.

**Decisão:** `.gitignore` usa `.env*` e exceção `!.env.example`.

**Consequência:** configuração documentada continua versionável sem permitir segredo real por padrão.

## ADR-039 — Proteção contra senhas vazadas é requisito antes de usuários reais

**Contexto:** o advisor de segurança do Supabase reporta `Leaked Password Protection Disabled`. A documentação atual informa integração com Pwned Passwords/HaveIBeenPwned disponível no plano Pro e acima.

**Decisão:** ativar a proteção no Dashboard antes de abertura para usuários reais, se o plano permitir; manter também política mínima de senha e avaliar MFA.

**Consequência:** este item permanece bloqueio externo de hardening, pois o conector atual não expõe essa configuração.

## ADR-040 — Documentos canônicos completos serão versionados por domínio sem reinterpretação silenciosa

**Contexto:** o repositório hoje contém `DECISOES.md`, `ESTADO_ATUAL.md` e `DESIGN_VISUAL.md`, enquanto o plano prevê documentação dedicada de arquitetura, segurança, pipeline, Cérebro e motor de reflexões.

**Decisão:** depois da consolidação estrutural, criar os documentos dedicados preservando a terminologia e o conteúdo dos quatro documentos canônicos fornecidos pelo proprietário; complementos técnicos devem ser identificados como decisão/implementação, não como alteração silenciosa da fonte.

**Consequência:** o GitHub passará a ser suficiente para reconstruir também o conhecimento arquitetural do projeto, não apenas o código e o banco.

## ADR-041 — npm 11.19.1 substitui npm 10.9.8 para lockfile reproduzível

**Contexto:** ao adicionar o Workflow SDK, npm 10.9.8 gerou em ambiente limpo um `package-lock.json` que o próprio `npm ci` recusava por resolução transitiva incompatível de `chokidar`/`readdirp`. A falha foi reproduzida no GitHub Actions.

**Decisão:** fixar `packageManager = npm@11.19.1`, usar a mesma versão para geração/validação do lockfile e manter `npm ci` como instalação final do CI.

**Consequência:** o ADR-028 continua válido quanto a lockfile/`npm ci`; apenas a versão do gerenciador é substituída formalmente. CI volta a `contents: read` depois do bootstrap.

## ADR-042 — Pipeline usa Vercel Workflow SDK fixado e execução durável

**Contexto:** processamento de livros é longo, precisa sobreviver a retries/falhas e não pode depender do tempo de uma única request HTTP.

**Decisão:** usar `workflow@4.8.8`, `withWorkflow()`, funções `'use workflow'` e etapas `'use step'`. O endpoint interno `/.well-known/workflow/` é excluído do Proxy de sessão conforme a integração oficial. Execuções do Pipeline são iniciadas em `sfo1`, próxima ao Supabase `us-west-2`.

**Consequência:** as etapas podem ser retomadas/repetidas pelo runtime durável sem abrir schemas internos nem manter uma request do usuário viva. Esta decisão é refinada pelos ADR-046 e ADR-047.

## ADR-043 — Disparo do workflow tem reserva transacional recuperável no banco

**Contexto:** a API documentada de `start()` expõe região, mas não foi adotada uma suposição não documentada de idempotency key. Duas requests concorrentes poderiam disparar workflows duplicados; uma falha entre criar a execução e disparar o workflow poderia deixá-la presa.

**Decisão:** `0018` adiciona `workflow_reservado_em`, `workflow_iniciado_em` e `workflow_tentativas`. `backend_iniciar_processamento` usa advisory lock e reserva de cinco minutos; retorna `deve_iniciar_workflow`. Reserva abandonada pode ser recuperada; execução `falhou`/`cancelado` pode ser retomada de forma controlada.

**Consequência:** concorrência e crash pré-disparo são tratados pelo nosso estado determinístico, sem depender de comportamento implícito do provedor.

## ADR-044 — Erro transitório usa retries; falha terminal só após esgotamento

**Contexto:** uma primeira versão marcava a obra como `falhou` dentro do `catch` de uma função `'use step'`. Como steps são automaticamente retryáveis, uma tentativa posterior poderia ter sucesso enquanto o banco já registrava falha terminal.

**Decisão:** erros transitórios de Storage/rede são relançados para o mecanismo de retry. Divergência determinística de hash/tamanho falha imediatamente. Se os retries se esgotarem, o workflow registra `VALIDACAO_ORIGINAL_ESGOTOU_RETRIES` em etapa separada.

**Consequência:** o estado persistido distingue falha temporária de terminal e não contradiz o runtime durável.

## ADR-045 — Workflow permanece desligado até E2E positivo com documento real

**Contexto:** o banco oficial ainda possui zero obras/execuções/Documentos Processados. CI, schema, permissões e Preview podem ser validados sem conteúdo real, mas isso não prova o caminho `Storage → workflow → hash servidor` com um usuário autenticado.

**Decisão:** manter `PROCESSAMENTO_WORKFLOW_ATIVO=false` e não conectar o frontend ao endpoint de início até existir uma obra de teste e o fluxo `validar_arquivo` passar ponta a ponta.

**Consequência:** a infraestrutura da Fase 3 pode ser incorporada sem expor uma funcionalidade parcialmente validada; ativação é um marco separado e auditável.

## ADR-046 — Workflow 4.8.9 com overrides transitivos de segurança

**Contexto:** o `npm audit` identificou vulnerabilidades altas em dependências transitivas da linha estável do Workflow SDK. `workflow@4.8.9` corrige outros problemas da biblioteca, mas ainda trazia faixas vulneráveis de `nanoid` e `undici` na árvore resolvida.

**Decisão:** atualizar para `workflow@4.8.9` e fixar por `overrides` `nanoid@5.1.16` e `undici@7.29.0`. Não usar `npm audit fix --force` nem migrar automaticamente para Workflow 5 beta.

**Consequência:** `npm ci`, `npm audit --omit=dev --audit-level=high`, lint, TypeScript e build passaram juntos. O audit permanece um portão obrigatório do CI.

## ADR-047 — Não forçar região enquanto o SDK estável não aceitar `region`

**Contexto:** exemplos atuais da documentação do Workflow mostram opção `region` em `start()`, mas a assinatura TypeScript do Workflow 4.8.x instalado rejeita esse campo. O Preview Vercel falhou e expôs a divergência entre documentação mais nova e API da linha estável escolhida.

**Decisão:** remover `region` de `start()` enquanto o projeto permanecer em Workflow 4.8.x. Não adotar versão prerelease apenas para obter esse parâmetro.

**Consequência:** código e SDK instalado voltam a ser coerentes; uma futura mudança de versão poderá reavaliar colocação regional em PR próprio.

## ADR-048 — Supabase local é parte do contrato reproduzível do repositório

**Contexto:** migrations existiam, mas o repositório não continha `supabase/config.toml` nem seed local, portanto não havia uma definição completa de ambiente para `supabase start/db reset`.

**Decisão:** versionar `supabase/config.toml` sem segredos e `supabase/seed.sql` sem dados pessoais. O CI usa Supabase CLI fixado e reconstrói o banco do zero.

**Consequência:** o histórico de migrations deixa de ser apenas documentação e passa a ser provado automaticamente contra um ambiente limpo.

## ADR-049 — Transições de workflow são monotônicas e bloqueadas no banco

**Contexto:** retries/replays atrasados poderiam concluir ou falhar uma etapa depois que a execução já tivesse avançado, regressando o estado global.

**Decisão:** `0019` usa `FOR UPDATE` nas transições críticas; início/conclusão/falha só modificam o estado quando a etapa recebida é a etapa atual e a execução não é terminal. Percentual usa `greatest()` para não regredir.

**Consequência:** a máquina de estados permanece coerente mesmo sob retries, chamadas duplicadas e concorrência.

## ADR-050 — OpenAI rotacionada, server-only e stateless por padrão

**Contexto:** a chave inicialmente compartilhada foi exposta e posteriormente rotacionada. O proprietário confirmou que a chave nova foi configurada diretamente na Vercel. A Responses API armazena resposta por padrão quando `store` é omitido/verdadeiro.

**Decisão:** manter `OPENAI_API_KEY` somente no servidor, nunca no Git/browser; para conteúdo intelectual privado usar `store: false`; usar Structured Outputs/JSON Schema e validação Zod antes de persistência; centralizar modelos em `MODELO_IA_*`.

**Consequência:** a credencial não bloqueia mais a implementação, mas IA só será ativada quando o Pipeline chegar às etapas cognitivas apropriadas e houver auditoria/proveniência operacional.

## ADR-051 — `main` deve ganhar Ruleset antes de corpus intelectual real

**Contexto:** o repositório canônico ainda está público e a API de Rulesets retorna lista vazia. A documentação atual do GitHub permite exigir PR, status checks e bloquear force push.

**Decisão:** antes de conteúdo intelectual real, tornar o repositório privado quando operacionalmente viável e criar Ruleset para `main` exigindo os jobs de CI. Avaliar CodeQL default setup conforme disponibilidade da conta.

**Consequência:** o processo que hoje é seguido disciplinarmente passa a ser também imposto pela plataforma.

## ADR-052 — Artefatos intermediários são separados de Documento Processado

**Contexto:** os documentos canônicos definem Documento Processado como representação computacional integral/publicável e proíbem processamento parcial de alimentar o Cérebro. Extração e normalização precisam persistir resultados idempotentes entre retries sem guardar livros inteiros em `jsonb`.

**Decisão:** `0020` cria `processamento.artefatos_execucao` e o bucket privado `artefatos-processamento`. PostgreSQL guarda identidade, hash, tamanho, MIME, metadados e proveniência; o conteúdo intermediário fica no Storage privado. Tipos iniciais: `conteudo_extraido` e `conteudo_normalizado`. `0021` explicita negação de acesso a `anon`/`authenticated` sem abrir grants.

**Consequência:** retries podem reutilizar artefatos por execução/tipo, conteúdo grande não polui metadados e nenhum resultado parcial é confundido com Documento Processado ativo.

## ADR-053 — Formatos v1 usam allowlist pequena e defesa em profundidade

**Contexto:** extensão e MIME fornecidos pelo cliente não provam o formato real. O Dicionário deixa a lista final de formatos e a estratégia de OCR deliberadamente abertas.

**Decisão:** a primeira allowlist processável contém PDF com camada textual, TXT UTF-8 e Markdown UTF-8. Identificação combina extensão, MIME e conteúdo/amostra. PDF exige assinatura `%PDF-`; texto rejeita NUL/controles incompatíveis. DOCX permanece explicitamente não suportado até validação segura do container OOXML. PDF sem texto retorna caso de OCR pendente, sem atalho por IA.

**Consequência:** a Biblioteca continua podendo preservar fontes mais amplas, mas o Pipeline só processa aquilo que sabe identificar/extrair com segurança e de forma explicável.

## ADR-054 — Extração PDF é determinística, sequencial e limitada

**Contexto:** PDFs são entrada não confiável e podem causar consumo excessivo de CPU/memória. APIs convenientes que extraem todas as páginas em paralelo ampliam o risco para livros grandes.

**Decisão:** usar `unpdf@1.8.1`/PDF.js serverless e percorrer páginas sequencialmente. Guardrails v1: TXT/Markdown até 20 MiB; PDF até 50 MiB/1.000 páginas; até 12 milhões de caracteres extraídos; artefato JSON até 30 MiB; `maxImageSize` 16.777.216 pixels; timeout de parsing PDF de 90 s. O original é novamente validado por SHA-256/tamanho imediatamente antes da extração.

**Consequência:** o parser tem limites operacionais claros, mantém proveniência por página e detecta mudança do original entre etapas. Os limites são versionados e poderão ser ajustados por evidência, não são promessa permanente do produto.

## ADR-055 — Testes unitários do processamento são portão obrigatório do CI

**Contexto:** lint, TypeScript e build não provam comportamento de segurança do detector/extrator. Node 22.18+ consegue executar módulos TypeScript erasáveis sem framework adicional.

**Decisão:** usar o test runner nativo do Node e executar `npm test` no CI. A suíte cobre PDF verdadeiro/falso, TXT/Markdown UTF-8, binário disfarçado, DOCX fora do escopo, BOM/UTF-8 inválido/conteúdo vazio e extração real de um PDF textual mínimo preservando página.

**Consequência:** regras determinísticas críticas passam a ser protegidas contra regressão sem adicionar um framework de testes desnecessário nesta fase.

## ADR-056 — Normalização autoral usa NFC e revalida artefatos em replay

**Contexto:** a etapa de normalização precisa reduzir diferenças técnicas de codificação sem apagar sinais que poderão compor identidade linguística, ritmo e estrutura. O Unicode distingue equivalência canônica de equivalência de compatibilidade; Markdown também pode atribuir significado a espaços antes da quebra de linha. Além disso, um registro de artefato no banco não prova sozinho que os bytes privados continuam íntegros.

**Decisão:** `normalizar_conteudo` converte CRLF/CR para LF e normaliza Unicode em NFC. Não usa NFKC/NFKD como regra autoral, não faz `trim`, não colapsa espaços e não reescreve pontuação/caixa/aspas/travessões/vocabulário. Páginas PDF mantêm ordem e número. Antes de criar ou reutilizar `conteudo_normalizado`, o workflow valida bytes, MIME, limites, SHA-256, tamanho, schema e a cadeia de proveniência original → extração → normalização. Em replay de etapa já avançada, o artefato é revalidado mas a transição de estado não é repetida.

**Consequência:** a representação normalizada é tecnicamente consistente sem se tornar uma edição silenciosa do autor; corrupção/troca de artefato é detectada inclusive em replays duráveis.
