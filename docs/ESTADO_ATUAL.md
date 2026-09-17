# Estado Atual do Projeto

Atualizado em **17/09/2026** durante a auditoria de handoff da Fase 3.

## Infraestrutura oficial

Somente estes recursos pertencem ao projeto:

- GitHub: `villacanabrava-maker/Biblioteca-Celebro-Reflex-es-`
- Supabase: `xzkzdaxxmizcgfkjgzoq` — `Biblioteca-Celebro-Reflex-es-`, `ACTIVE_HEALTHY`, `us-west-2`, PostgreSQL 17.6
- Vercel: projeto `cerebro-autoral`
- Produção: `https://cerebro-autoral.vercel.app`

Outros projetos das contas conectadas não pertencem a este aplicativo e não devem ser alterados.

## Handoff em revisão

O trabalho determinístico feito por outro agente foi isolado no **PR #14**, branch `review/handoff-claude-fase3`, para revisão antes de chegar à `main`.

Escopo consolidado nessa revisão:

```text
validar_arquivo          ✅ main
identificar_formato      ✅ main
extrair_conteudo         ✅ main — PDF textual/TXT/Markdown
normalizar_conteudo      ✅ main
identificar_estrutura    ✅ auditado no PR #14
criar_hierarquia         ✅ auditado no PR #14
criar_fragmentos         ✅ auditado e endurecido no PR #14
criar_sinteses           ⬜ ainda não consolidado
```

A feature flag permanece:

```text
PROCESSAMENTO_WORKFLOW_ATIVO=false
```

Nenhum Documento Processado parcial alimenta o Cérebro Autoral.

## Banco oficial

Última fotografia auditada:

- 1 usuário Auth de teste;
- 0 obras;
- 0 versões de obra;
- 0 execuções;
- 0 Documentos Processados;
- 0 fragmentos;
- 0 elementos;
- 1 versão ativa de Pipeline;
- 1 versão ativa de Taxonomia.

As migrations oficiais chegaram a:

- `0022` — RLS nos catálogos globais;
- `0023` — artefato `estrutura_identificada`;
- `0024` — Documento Processado candidato + hierarquia de seções;
- `0025` — RPCs de fragmentos + índices de caractere;
- `0026` — correção de contagem de fragmentos;
- `0027` — correção de ambiguidade SQL;
- `0028` (`20260917012837`) — `offset_pagina_inicio` para fragmentação PDF precisa;
- `0029` (`20260917014156`) — listagem backend-only dos fragmentos para replay seguro.

Nenhuma migration aplicada foi reescrita.

## Achados desta auditoria

### 1. Fronteira PDF era insuficiente

A versão anterior conhecia o número da página em que uma seção começava, mas não persistia o offset do título dentro da página. Isso produzia dois riscos:

- duas seções na mesma página poderiam compartilhar/duplicar texto;
- quando uma nova seção começava no meio da página seguinte, o texto anterior ao novo título poderia ser descartado do fragmento precedente.

**Correção:** `0028` persiste `offset_pagina_inicio` e o domínio de fragmentação usa página + offset para recortar o texto próprio da seção.

### 2. Replay de `criar_fragmentos` confiava cedo demais no estado

A primeira versão retornava sucesso imediatamente quando `backend_iniciar_etapa` informava que a etapa já havia sido concluída.

**Correção:** o replay agora revalida o artefato normalizado, recalcula os fragmentos determinísticos e compara com os fragmentos persistidos. A nova RPC `backend_listar_fragmentos_documento` (`0029`) é `SECURITY DEFINER`, `search_path=''` e executável somente por `service_role`.

A execução normal também relê e compara os fragmentos depois da persistência, antes de concluir a etapa.

### 3. Rascunho de IA antigo não faz parte do banco

A branch `claude/confident-cannon-ovdoev` possui um commit WIP (`0b9d739...`) com um arquivo local chamado `0028_ia_sinteses_secao`. Ele **nunca foi aplicado ao Supabase**, não possui testes completos nem integração de workflow.

O número oficial `0028` agora pertence a `0028_offsets_pdf_fragmentacao`. O rascunho de IA deverá ser revisado e renumerado após `0029`; não pode ser aplicado como está.

## Validação

Na rodada de CI que incluiu as correções funcionais e os três novos testes:

- `npm ci`: passou;
- `npm audit --omit=dev --audit-level=high`: 0 vulnerabilidades;
- ESLint: passou (um warning cosmético do novo teste foi depois removido);
- TypeScript: passou;
- testes: **39/39 passaram**;
- build Next.js: passou;
- banco local: `supabase start` + migrations + seed + `db reset` + `status` + shutdown: passou;
- Preview Vercel do código/testes: `READY`.

Depois da remoção do warning e das atualizações documentais, o head final do PR precisa repetir os mesmos gates antes do merge.

## Segurança

A auditoria após `0028/0029` confirma:

- schemas internos continuam fechados;
- RLS permanece ativo nas superfícies pessoais/sensíveis;
- Storage permanece privado;
- `anon` e `authenticated` não executam RPCs `backend_*`;
- RPCs internas usam `SECURITY DEFINER` + `search_path=''`;
- `service_role` só acessa operações internas pelas RPCs deliberadamente concedidas;
- nenhuma nova FK sem índice foi apontada.

Advisor de segurança: único aviso remanescente é **Leaked Password Protection Disabled**.

Advisor de performance: apenas `unused_index` informativo enquanto o banco continua sem corpus.

## Vercel

- projeto correto: `cerebro-autoral`;
- Preview do PR #14 com as correções/testes está `READY`;
- produção continua ligada à `main`, que ainda não contém o PR #14;
- Dashboard ainda reporta Node 24.x, enquanto o projeto exige Node 22.x; ajuste administrativo continua pendente.

`PROCESSAMENTO_WORKFLOW_ATIVO=false` impede exposição do Pipeline parcial.

## OpenAI

A chave antiga foi rotacionada e a nova está configurada diretamente na Vercel. Nenhum segredo foi versionado.

A IA ainda não é parte da implementação consolidada do Pipeline. A próxima etapa, `criar_sinteses`, será a primeira cognitiva e deverá ser reconstruída com:

- documentação oficial atual da OpenAI revalidada;
- Responses API;
- `store:false`;
- Structured Outputs/JSON Schema;
- validação Zod;
- cliente injetável para testes sem custo;
- auditoria de modelo/prompt/execução;
- SQL validado em `BEGIN ... ROLLBACK` antes de aplicação.

Nenhuma chamada real paga será executada sem confirmação do proprietário.

## Próximo marco

1. fechar os gates finais do PR #14;
2. incorporar a parte determinística auditada à `main`;
3. verificar Production Vercel no commit de merge;
4. sincronizar a fotografia documental pós-merge;
5. iniciar uma branch nova para reconstruir/revisar `criar_sinteses` a partir das decisões canônicas, usando o WIP antigo apenas como referência.

## Regra permanente

Nenhuma migration aplicada é reescrita para esconder correções. Nenhum segredo é commitido. Todo resultado parcial permanece separado de Documento Processado ativo. O usuário continua sendo a autoridade final sobre autoria e incorporação ao Cérebro Autoral.
