# Estado Atual do Projeto

Atualizado em **17/09/2026** após a incorporação auditada do handoff da Fase 3.

## Infraestrutura oficial

- GitHub: `villacanabrava-maker/Biblioteca-Celebro-Reflex-es-`
- `main`: `1b68ba494e62bc5875868bdf4884620c02264c83`
- Supabase: `xzkzdaxxmizcgfkjgzoq` — `ACTIVE_HEALTHY`, `us-west-2`, PostgreSQL 17.6
- Vercel: `cerebro-autoral`
- Produção: `https://cerebro-autoral.vercel.app`
- Deployment pós-merge: `dpl_2xo3HF6gsHcKE2DVazD4kousiBQo` — `READY`
- `PROCESSAMENTO_WORKFLOW_ATIVO=false`

Outros projetos das contas conectadas não pertencem a este aplicativo.

## Marco incorporado

O PR #14 foi incorporado por squash merge depois de revisão manual e validação independente em GitHub, Supabase e Vercel.

A parte determinística da Fase 3 está consolidada até `criar_fragmentos`:

```text
validar_arquivo          ✅
identificar_formato      ✅
extrair_conteudo         ✅ PDF textual/TXT/Markdown
normalizar_conteudo      ✅
identificar_estrutura    ✅
criar_hierarquia         ✅
criar_fragmentos         ✅ auditado/hardened
criar_sinteses           ⬜ próxima etapa cognitiva
```

Nenhum resultado parcial é Documento Processado ativo e nenhum resultado parcial alimenta o Cérebro Autoral.

## Banco oficial

Última fotografia:

- 1 usuário Auth de teste;
- 0 obras;
- 0 versões de obra;
- 0 execuções;
- 0 Documentos Processados;
- 0 fragmentos;
- 0 elementos;
- 1 versão ativa de Pipeline;
- 1 versão ativa de Taxonomia.

Portanto, o hardening/migrations recentes não tocaram corpus autoral real.

## Migrations recentes

```text
0022  RLS dos catálogos de sistema/taxonomia
0023  artefato estrutura_identificada
0024  materialização do Documento Processado candidato + seções
0025  posições de seção + RPCs de fragmentação
0026  correção da contagem de fragmentos
0027  correção de ambiguidade SQL
0028  offset_pagina_inicio para recorte PDF intrapágina
0029  leitura backend-only de fragmentos para replay seguro
```

Versões reais atribuídas pelo Supabase:

- `20260917012837_0028_offsets_pdf_fragmentacao`
- `20260917014156_0029_listagem_fragmentos_replay`

## Bugs encontrados e corrigidos na auditoria

### PDF intrapágina

Número de página sozinho não era suficiente para separar títulos na mesma página. Também podia haver perda do prefixo de uma página quando o próximo título começava no meio dela.

Correção:

- `identificar_estrutura` já media o offset do título na página;
- `0028` passou a persistir esse offset em `processamento.secoes`;
- `criar_fragmentos` usa página + offset para recortar exatamente o texto próprio.

Há testes para:

1. duas seções na mesma página sem duplicação;
2. texto de continuação antes do próximo título na página seguinte sem perda.

### Replay de fragmentos

A primeira implementação podia retornar sucesso quando a máquina de estados informava que a etapa já havia passado, antes de comprovar que o artefato e os fragmentos persistidos continuavam íntegros.

Correção:

- artefato normalizado é baixado/revalidado;
- fragmentos esperados são recalculados;
- `0029` lista os fragmentos persistidos por RPC server-only;
- esperado/persistido são comparados deterministicamente;
- divergência falha em vez de ser aceita como sucesso.

A escrita normal também é verificada antes da conclusão da etapa.

## Gates do PR #14

No head final:

- `npm ci` ✅
- `npm audit --omit=dev --audit-level=high` ✅ — 0 vulnerabilidades
- ESLint ✅
- TypeScript ✅
- **39/39 testes** ✅
- Next.js build ✅
- Supabase local + todas as migrations/seed ✅
- `supabase db reset` ✅
- Preview Vercel ✅ READY
- advisors do Supabase ✅ sem novo alerta estrutural

## Produção pós-merge

O deployment de produção ligado ao merge `1b68ba4…` está `READY`.

Verificações realizadas:

- `/` responde com autenticação para visitante sem sessão;
- `/biblioteca` permanece protegida e vai para autenticação sem sessão;
- nenhum erro de runtime foi encontrado no intervalo pós-deploy.

## Segurança

Mantido:

- schemas internos fechados;
- RLS;
- Storage privado;
- RPCs backend `SECURITY DEFINER` + `search_path=''`;
- sem `EXECUTE` de RPC backend para `anon`/`authenticated`;
- `service_role` somente em operações explicitamente concedidas;
- sem segredo no GitHub;
- OpenAI key somente na Vercel.

Advisor de segurança: único aviso atual é **Leaked Password Protection Disabled**.

Advisor de performance: somente `unused_index` informativo enquanto não há corpus.

Pendências externas:

1. Leaked Password Protection do Supabase Auth;
2. Vercel Dashboard ainda em Node 24.x versus Node 22.x do projeto;
3. Ruleset de `main` ainda não obrigatório;
4. E2E com documento controlado antes de ligar o Workflow.

## OpenAI / próxima etapa

A chave OpenAI foi rotacionada e a nova chave está configurada na Vercel. Nenhuma chamada paga foi feita nesta auditoria.

O WIP antigo de `criar_sinteses` (`0b9d739...`) foi revisado apenas como referência e **não será mesclado diretamente** porque:

- usava o número `0028`, já ocupado oficialmente;
- redefinia `backend_listar_fragmentos_documento` com assinatura incompatível com a RPC oficial `0029`;
- usava `gpt-5.5` como placeholder;
- não possuía step do workflow nem testes completos;
- sua migration nunca foi validada contra o banco real.

A documentação oficial atual da OpenAI foi reconsultada. A nova implementação deverá escolher explicitamente o modelo por qualidade/custo, usar Responses API, `store:false`, Structured Outputs/JSON Schema e validação Zod.

Próximo marco:

1. abrir branch nova de IA a partir da `main` consolidada;
2. redesenhar/renumerar a migration de auditoria/sínteses após `0029`;
3. criar testes com cliente OpenAI falso;
4. validar SQL em `BEGIN ... ROLLBACK`;
5. criar `criar-sinteses-step.ts` e integrar ao workflow;
6. somente depois solicitar confirmação do proprietário para a primeira chamada real paga.

## Regra permanente

Nenhuma migration aplicada é reescrita para esconder correções. Nenhum segredo é commitido. Conteúdo do usuário é tratado como dado, nunca instrução. O proprietário permanece a autoridade final sobre autoria e incorporação ao Cérebro Autoral.
