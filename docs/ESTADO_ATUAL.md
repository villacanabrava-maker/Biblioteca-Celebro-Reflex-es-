# Estado Atual do Projeto

Atualizado em **16/09/2026** após auditoria cruzada de documentos canônicos, GitHub, Supabase e Vercel.

## Infraestrutura oficial

- GitHub: `villacanabrava-maker/Biblioteca-Celebro-Reflex-es-`
- Branch principal: `main`
- Branch de trabalho atual: `feature/processamento`
- Supabase: `xzkzdaxxmizcgfkjgzoq`
- Vercel: projeto `cerebro-autoral`
- Produção: `https://cerebro-autoral.vercel.app`

O projeto Vercel está ligado exatamente ao repositório canônico e o último deploy de produção inspecionado está `READY`. A página de login responde HTTP 200 e uma rota protegida (`/biblioteca`) redireciona corretamente para login quando não existe sessão. Não foram encontrados clusters de erro de runtime no Vercel nos últimos 7 dias.

## Fase atual

**Pipeline Documental — fundação operacional e preparação do Documento Processado.**

A Biblioteca, Storage, autenticação SSR, API segura e deploy já existem. O trabalho atual prepara execução idempotente/versionada do processamento e, em seguida, a representação hierárquica dos documentos.

## Concluído na `main`

- Next.js + React + TypeScript;
- sistema visual inicial;
- schemas canônicos;
- schema `sistema`;
- estrutura da Taxonomia Mestre;
- Biblioteca (`obras` + `versoes_obras`);
- Storage privado `originais-biblioteca`;
- fronteira da Data API em `aplicacao`;
- Auth SSR com `@supabase/ssr` e `getClaims()`;
- login, cadastro, confirmação SSR e logout;
- upload TUS + SHA-256 incremental;
- Biblioteca lendo dados reais;
- CI com lint, TypeScript e build;
- PRs #1 a #6 incorporados.

## Aplicado no Supabase e em `feature/processamento`

- `0008_processamento_execucoes` — `processamento.execucoes` e `processamento.etapas_execucao`;
- `0009_indice_fk_etapas_execucao` — índice da FK composta detectado pelo advisor;
- `0010_seeds_versoes_base` — ativa `Pipeline 1.0` e `Taxonomia 1.0`.

## Auditoria de segurança do Supabase

Confirmado:

- schemas internos sem `USAGE` para `anon`/`authenticated`;
- `authenticated` recebe `USAGE` apenas em `aplicacao`;
- Data API (`authenticator`) limitada a `public, graphql_public, aplicacao`;
- RLS ativo nas tabelas pessoais implementadas;
- policies por `auth.uid()` coerentes;
- Storage privado e segregado pelo primeiro segmento do caminho;
- RPCs públicas com `SECURITY DEFINER`, `search_path = ''` e grants explícitos;
- nenhuma constraint pendente `NOT VALID`;
- advisor de segurança sem alertas após as últimas migrations.

## Correções realizadas nesta auditoria

1. Os nomes/timestamps dos arquivos de migrations no GitHub foram alinhados às versões realmente registradas no Supabase. Havia timestamps divergentes e um prefixo duplicado.
2. Foram criadas as versões-base ativas `Pipeline 1.0` e `Taxonomia 1.0`, necessárias para iniciar execuções documentais com proveniência.
3. O upload TUS deixou de retomar automaticamente fingerprints antigos enquanto obra/versão recebem novos UUIDs a cada tentativa. Isso evita registro em caminho diferente do objeto efetivamente enviado.
4. Node foi fixado em `22.x`, eliminando divergência entre CI e Vercel.
5. GitHub Actions está sendo atualizado para `checkout@v7` / `setup-node@v7`.
6. ESLint foi fixado em versão explícita em vez de `latest`.
7. Está em andamento a geração/commit de `package-lock.json` para trocar CI de `npm install` para `npm ci`.
8. README foi atualizado para refletir o Vercel já existente e o estado real do Pipeline.

## Pontos externos ainda pendentes

### GitHub

O repositório está atualmente **público**. Nenhum segredo conhecido foi encontrado nas buscas realizadas, mas a arquitetura/documentação do produto também fica pública. A recomendação de segurança é torná-lo privado antes de armazenar conteúdo intelectual real de produção.

A API acessível mostra zero rulesets. A proteção administrativa da `main` não pôde ser lida/alterada pelo conector atual e precisa ser confirmada na configuração do GitHub.

### Supabase Auth

O conector atual não expõe Site URL/Redirect URLs/templates de e-mail. Deve ser confirmado no Dashboard que o domínio oficial é `https://cerebro-autoral.vercel.app` e que o template de confirmação SSR usa `/auth/confirm` com `token_hash`.

### OpenAI

A chave enviada anteriormente no chat é tratada como exposta e não será usada. Antes de ativar IA, deve ser rotacionada e a nova chave configurada diretamente como secret do servidor/Vercel.

## Próximo passo técnico

Depois de o CI desta auditoria ficar reproduzível e verde:

1. criar `processamento.documentos_processados`;
2. criar `processamento.secoes` hierárquicas;
3. criar `processamento.fragmentos` contextualizados + FTS;
4. criar `processamento.sinteses` multinível;
5. testar tudo em transação reversível;
6. aplicar no Supabase oficial;
7. rodar advisors;
8. atualizar README/decisões;
9. seguir para vetores, elementos, evidências e relações.

## Regra permanente

Nenhuma chave administrativa, segredo de produção ou credencial privada deve ser commitida. Nenhuma migration aplicada deve ser reescrita para esconder correções. Toda mudança de estado real deve aparecer no README e neste documento.
