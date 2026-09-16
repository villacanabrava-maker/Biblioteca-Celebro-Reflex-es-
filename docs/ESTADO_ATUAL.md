# Estado Atual do Projeto

Atualizado em **16/09/2026** após conclusão da auditoria cruzada dos documentos canônicos, GitHub, Supabase e Vercel.

## Infraestrutura oficial

- GitHub: `villacanabrava-maker/Biblioteca-Celebro-Reflex-es-`
- Branch oficial: `main`
- Supabase: `xzkzdaxxmizcgfkjgzoq`
- Vercel: projeto `cerebro-autoral`
- Produção: `https://cerebro-autoral.vercel.app`
- Fase 2 / PR #7: **incorporada à `main`**
- Commit de produção da Fase 2: `326286036566ccc46addfc4b071fd224cd1a5c09`

O Vercel recebeu exatamente esse commit da `main`, concluiu o deployment com estado `READY`, atualizou o domínio principal e não apresentou erros de runtime na verificação pós-merge. A página de login responde e `/biblioteca` continua protegida para visitantes sem sessão.

## Fase atual

**Pipeline Documental — modelo de dados concluído. Próxima etapa: workflow real de processamento.**

Biblioteca, Storage, Auth SSR, API segura, deploy e a representação estrutural/inteligente de documentos estão na `main`. O próximo bloco implementará execução real: validação do arquivo, recálculo de hash no servidor, extração, normalização, estruturação, fragmentação, sínteses, elementos, taxonomia, embeddings, relações, validação e publicação atômica.

## Concluído em `main`

- Next.js + React + TypeScript;
- sistema visual inicial;
- schemas canônicos;
- schema `sistema`;
- estrutura/versionamento da Taxonomia Mestre;
- Biblioteca e versões de obras;
- Storage privado `originais-biblioteca`;
- fronteira da Data API em `aplicacao`;
- Auth SSR com `@supabase/ssr` e `getClaims()`;
- login, cadastro, confirmação SSR e logout;
- upload TUS + SHA-256 incremental;
- deduplicação real por usuário + SHA-256;
- Biblioteca lendo dados reais;
- Pipeline Documental modelado até `0016`;
- lockfile versionado e CI com `npm ci`;
- PRs #1 a #7 incorporados.

## Migrations aplicadas no Supabase e versionadas em `main`

- `0001_fundacao`
- `0002_sistema`
- `0003_taxonomia`
- `0004_biblioteca`
- `0005_indice_fk_biblioteca`
- `0006_storage_biblioteca`
- `0007_api_aplicacao_biblioteca`
- `0008_processamento_execucoes`
- `0009_indice_fk_etapas_execucao`
- `0010_seeds_versoes_base`
- `0011_processamento_documentos_hierarquia`
- `0012_indices_fk_processamento_hierarquia`
- `0013_processamento_elementos_vetores_grafo`
- `0014_indice_fk_taxonomia_elementos`
- `0015_integridade_proveniencia_publicacao`
- `0016_deduplicacao_hash_biblioteca`

## Pipeline — estruturas prontas

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

Fragmentos possuem Full Text Search automático. Vetores usam `vector(1536)` + HNSW/cosine. Evidências só podem apontar para fragmentos do mesmo Documento Processado. Um Documento Processado `ativo` exige `publicado_em` e existe no máximo um ativo por usuário/obra.

## Auditoria de segurança

Confirmado:

- schemas internos fechados para navegador;
- `authenticated` recebe acesso de schema somente em `aplicacao`;
- Data API limitada a `public, graphql_public, aplicacao`;
- RLS ativo nas tabelas pessoais;
- Storage privado e segregado por usuário;
- RPCs públicas `SECURITY DEFINER`, `search_path = ''` e grants mínimos;
- funções internas sem execução externa;
- nenhuma constraint `NOT VALID` pendente;
- advisor de performance sem FKs não indexadas;
- avisos restantes de performance são apenas `unused_index`, esperados com tabelas vazias.

### Alerta externo ainda aberto

O Supabase Auth reporta **Leaked Password Protection Disabled**. A proteção deve ser habilitada no Dashboard antes de usuários reais, se o plano permitir.

## Correções concluídas na auditoria

1. Vercel canônico confirmado e deploy pós-merge verificado.
2. Migrations do GitHub alinhadas ao histórico real do Supabase.
3. Pipeline 1.0 e Taxonomia 1.0 ativados.
4. FKs sem índices corrigidas.
5. Retomada TUS insegura removida.
6. Deduplicação SHA-256 implementada com lock transacional.
7. Evidências impedidas de cruzar Documentos Processados.
8. Documento Processado `ativo` exige publicação explícita.
9. Node fixado em `22.x` para CI/Vercel.
10. Actions atualizadas para v7.
11. `package-lock.json` versionado e CI migrado para `npm ci`.
12. ESLint 9.39.5 fixado após teste real de incompatibilidade do ESLint 10 com a cadeia Next atual.
13. Proxy endurecido para rotas públicas exatas.
14. `.gitignore` endurecido para qualquer `.env*`, exceto `.env.example`.
15. README, `ESTADO_ATUAL` e ADRs sincronizados com a Fase 2.

## Pontos externos ainda pendentes

### GitHub

O repositório continua **público**. Recomendação: torná-lo privado antes de conteúdo intelectual real. A configuração de ruleset/branch protection da `main` precisa ser confirmada com acesso administrativo.

### Supabase Auth

Confirmar no Dashboard:

- Site URL `https://cerebro-autoral.vercel.app`;
- Redirect URLs necessárias;
- template SSR de confirmação com `/auth/confirm` + `token_hash`;
- Leaked Password Protection, se o plano permitir.

### OpenAI

A chave fornecida anteriormente no chat é tratada como exposta e não será usada. Antes de ativar IA, deve ser rotacionada e a nova chave cadastrada diretamente no ambiente servidor/Vercel.

## Próximo passo técnico

1. criar a camada server-only de operações do workflow em `aplicacao`;
2. implementar `processar_obra()` sem abrir schemas internos;
3. recalcular/verificar SHA-256 no servidor;
4. extrair e normalizar conteúdo;
5. construir estrutura/seções/fragmentos de forma idempotente;
6. integrar sínteses/elementos/taxonomia/embeddings somente com modelos e prompts versionados;
7. publicar Documento Processado como `candidato` e promovê-lo a `ativo` somente após validação;
8. atualizar README/ADRs em cada marco.

## Regra permanente

Nenhuma chave administrativa, segredo ou credencial privada deve ser commitida. Nenhuma migration aplicada deve ser reescrita para esconder correções. Toda mudança de estado real deve aparecer no README e neste documento.
