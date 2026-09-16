# Estado Atual do Projeto

Atualizado em **16/09/2026** após auditoria cruzada dos documentos canônicos, GitHub, Supabase e Vercel.

## Infraestrutura oficial

- GitHub: `villacanabrava-maker/Biblioteca-Celebro-Reflex-es-`
- Branch principal: `main`
- Branch atual: `feature/processamento`
- PR atual: #7
- Supabase: `xzkzdaxxmizcgfkjgzoq`
- Vercel: projeto `cerebro-autoral`
- Produção: `https://cerebro-autoral.vercel.app`

O Vercel está ligado ao repositório canônico. O deploy de produção inspecionado está `READY`; a página de login responde HTTP 200, `/biblioteca` redireciona para login sem sessão e não foram encontrados clusters de erro de runtime nos últimos 7 dias.

## Fase atual

**Pipeline Documental — modelo de dados completo; preparação do workflow real de processamento.**

Biblioteca, Storage, Auth SSR, API segura, deploy e a representação estrutural/inteligente de documentos já existem no banco. O próximo bloco implementará execução real: validação do arquivo, recálculo do hash no servidor, extração, normalização, estruturação, fragmentação, sínteses, elementos, taxonomia, embeddings, relações, validação e publicação atômica.

## Concluído na `main`

- Next.js + React + TypeScript;
- sistema visual inicial;
- schemas canônicos;
- schema `sistema`;
- estrutura da Taxonomia Mestre;
- Biblioteca;
- Storage privado `originais-biblioteca`;
- fronteira da Data API em `aplicacao`;
- Auth SSR com `@supabase/ssr` e `getClaims()`;
- login, cadastro, confirmação SSR e logout;
- upload TUS + SHA-256 incremental;
- Biblioteca lendo dados reais;
- PRs #1 a #6 incorporados.

## Aplicado no Supabase e versionado no PR #7

- `0008_processamento_execucoes` — execuções e etapas idempotentes;
- `0009_indice_fk_etapas_execucao` — índice da FK composta;
- `0010_seeds_versoes_base` — Pipeline 1.0 + Taxonomia 1.0;
- `0011_processamento_documentos_hierarquia` — Documento Processado, seções, fragmentos e sínteses;
- `0012_indices_fk_processamento_hierarquia` — índices adicionais apontados pelo advisor;
- `0013_processamento_elementos_vetores_grafo` — vetores HNSW, elementos, evidências, relações e FK Taxonomia → Elementos;
- `0014_indice_fk_taxonomia_elementos` — índice dedicado da FK composta Taxonomia → Elementos;
- `0015_integridade_proveniencia_publicacao` — evidência no mesmo documento e estado `ativo` com publicação explícita;
- `0016_deduplicacao_hash_biblioteca` — deduplicação concorrente por usuário + SHA-256.

## Pipeline — estruturas atuais

### Execução

- `processamento.execucoes`
- `processamento.etapas_execucao`

### Representação hierárquica

- `processamento.documentos_processados`
- `processamento.secoes`
- `processamento.fragmentos`
- `processamento.sinteses`

### Representação intelectual

- `processamento.vetores`
- `processamento.elementos`
- `processamento.evidencias`
- `processamento.relacoes_elementos`

Fragmentos possuem Full Text Search gerado automaticamente. Vetores usam `extensions.vector(1536)` + HNSW/cosine. Elementos carregam modelo/prompt, importância, confiança e estado de revisão. Evidências apontam para fragmentos concretos do mesmo Documento Processado. Relações formam o grafo intelectual inclusive entre documentos do mesmo usuário.

Somente um Documento Processado `ativo` por usuário/obra pode existir, e um documento `ativo` exige `publicado_em` preenchido.

## Auditoria do Supabase

Confirmado:

- schemas internos sem `USAGE` para `anon`/`authenticated`;
- `authenticated` recebe `USAGE` apenas em `aplicacao`;
- `service_role` também não recebe acesso direto aos schemas internos; futuros workflows devem usar RPCs server-only em `aplicacao`;
- Data API limitada a `public, graphql_public, aplicacao`;
- RLS ativo nas tabelas pessoais;
- policies por `auth.uid()`;
- Storage privado e segregado por pasta de usuário;
- RPCs públicas `SECURITY DEFINER`, `search_path = ''` e grants explícitos;
- funções internas de trigger sem execução externa;
- nenhuma constraint `NOT VALID` pendente;
- advisor de performance sem FKs não indexadas após `0014`;
- avisos restantes de performance são somente `unused_index`, esperados em tabelas vazias.

### Alerta de segurança aberto

O advisor do Supabase reporta **Leaked Password Protection Disabled**. A documentação oficial informa que a proteção contra senhas comprometidas usa HaveIBeenPwned/Pwned Passwords e está disponível no plano Pro e acima.

Antes de usuários reais, ativar em Auth → Providers → Email se o plano permitir. O conector atual não expõe essa configuração.

## Correções realizadas nesta auditoria

1. Vercel novo/canônico foi confirmado e o README antigo foi corrigido.
2. Os nomes/timestamps dos arquivos de migrations foram alinhados às versões do Supabase; o prefixo duplicado foi removido.
3. Pipeline 1.0 e Taxonomia 1.0 foram ativados em `0010`.
4. FKs sem índice detectadas pelos advisors foram corrigidas em migrations incrementais (`0009`, `0012`, `0014`).
5. A retomada TUS insegura entre novas submissões com UUIDs diferentes foi removida; retries da operação atual continuam.
6. SHA-256, que antes era apenas armazenado, passou a ser usado para deduplicação real e concorrente em `0016`.
7. Evidências foram endurecidas para não cruzar Documentos Processados em `0015`.
8. Documento Processado `ativo` passou a exigir `publicado_em` em `0015`.
9. Node foi fixado em `22.x` para CI/Vercel usarem a mesma major.
10. Actions foram atualizadas para v7.
11. O primeiro `package-lock.json` foi gerado por um runner verde e versionado.
12. CI foi migrado para `npm ci` e voltou a `permissions: contents: read`.
13. ESLint 10 foi testado e rejeitado por incompatibilidade real com o plugin React de `eslint-config-next 16.3.5`; ESLint `9.39.5` fica fixado até upgrade compatível.
14. As rotas públicas do Proxy foram estreitadas para `/login` e `/auth/*`.
15. `.gitignore` passou a bloquear todo `.env*`, exceto `.env.example`.
16. Documento Processado/hierarquia e representação intelectual foram implementados até `0016`.
17. README, este arquivo e ADRs são mantidos sincronizados com o estado real.

## Pontos externos ainda pendentes

### GitHub

O repositório está atualmente **público**. Nenhum segredo conhecido foi encontrado nas buscas realizadas, mas código e arquitetura também ficam públicos. Recomendação: torná-lo privado antes de conteúdo intelectual real.

A API acessível mostra zero rulesets; a proteção administrativa da `main` precisa ser confirmada/configurada fora do conector atual.

### Supabase Auth

Confirmar no Dashboard:

- Site URL `https://cerebro-autoral.vercel.app`;
- Redirect URLs de produção/preview quando necessário;
- template de confirmação SSR com `/auth/confirm` + `token_hash`;
- Leaked Password Protection se o plano permitir.

### OpenAI

A chave fornecida no chat é tratada como exposta e não será usada. Antes de ativar IA, ela deve ser rotacionada e a nova chave cadastrada diretamente no ambiente servidor/Vercel.

## Próximo passo técnico

1. concluir CI final e incorporar PR #7 somente com tudo verde;
2. confirmar o novo deploy Vercel após merge;
3. implementar RPCs server-only para o workflow sem abrir schemas internos;
4. implementar `processar_obra()` sobre as tabelas já prontas;
5. validar/recalcular hash do arquivo no servidor antes de extrair;
6. implementar extração/normalização/estruturação com etapas idempotentes;
7. publicar Documento Processado como `candidato` e só promovê-lo a `ativo` após validação;
8. integrar IA somente após rotação segura da chave e registro dos modelos/prompts usados;
9. atualizar README/ADRs em cada marco.

## Regra permanente

Nenhuma chave administrativa, segredo ou credencial privada deve ser commitida. Nenhuma migration aplicada deve ser reescrita para esconder correções. Toda mudança de estado real deve aparecer no README e neste documento.
