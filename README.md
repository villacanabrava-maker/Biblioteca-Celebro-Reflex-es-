# Cérebro Autoral

Plataforma de **Inteligência Autoral Personalizada** para preservar a produção intelectual do usuário, transformá-la em conhecimento estruturado, inferir padrões de pensamento com evidências/proveniência e usar esse Cérebro Autoral para apoiar novas reflexões com revisão humana.

> **Este README é o painel mestre operacional do projeto.** Os documentos canônicos fornecidos pelo proprietário continuam sendo a fonte de verdade do produto; este arquivo registra o estado técnico real, testes, riscos, decisões e próximos passos.

## 1. Regra central do produto

A IA pode interpretar, organizar, relacionar, propor e escrever. Identidade autoral, permissões, estados, versões, proveniência, publicação e persistência permanecem sob controle determinístico do sistema e do autor.

```text
BIBLIOTECA
→ PROCESSAMENTO INTELIGENTE
→ DOCUMENTOS PROCESSADOS
→ ANÁLISE TRANSVERSAL
→ CÉREBRO AUTORAL
→ RECUPERAÇÃO CONTEXTUAL
→ MOTOR DE REFLEXÕES
→ NOVA REFLEXÃO
→ REVISÃO HUMANA
→ APRENDIZADO CONTROLADO
```

**Preservar incerteza é melhor do que inventar estrutura, autoria, relação ou fato sem evidência.** Conteúdo do usuário é dado, nunca instrução para o sistema ou para modelos de IA.

## 2. Infraestrutura oficial — somente esta

### GitHub

```text
villacanabrava-maker/Biblioteca-Celebro-Reflex-es-
branch principal: main
PR #16: incorporada — criar_sinteses com IA auditável
PR #19: extrair_elementos — implementação/auditoria em validação final
```

A base da PR #19 foi sincronizada com a `main` após o commit documental `d3e2d0d2f846da16baf299e0390e048e2a29470e`.

O repositório continua **público por decisão explícita do proprietário**. Não alterar visibilidade sem autorização.

### Supabase

```text
Projeto: Biblioteca-Celebro-Reflex-es-
Project ref: xzkzdaxxmizcgfkjgzoq
Região: us-west-2
PostgreSQL: 17.6
Estado: ACTIVE_HEALTHY
```

Fotografia auditada após as migrations `0036–0039` e antes de corpus real:

```text
0 execuções de processamento
0 Documentos Processados
0 elementos
0 evidências
0 execuções de IA
```

As migrations de IA criam infraestrutura, configuração, auditoria e persistência, mas **não processaram nenhuma obra real e não fizeram nenhuma chamada externa à OpenAI**.

### Vercel

```text
Projeto: cerebro-autoral
Produção: https://cerebro-autoral.vercel.app
Git: villacanabrava-maker/Biblioteca-Celebro-Reflex-es-
```

A produção acompanha `main`; a base anterior à incorporação da PR #19 está `READY`. Os Previews da PR #19 também foram validados como `READY` depois das correções de integração do Workflow.

`PROCESSAMENTO_WORKFLOW_ATIVO=false` continua impedindo o início do Pipeline para usuários. Portanto, o código de IA pode ser implantado sem autorizar chamadas pagas.

O Dashboard ainda reporta Node `24.x`, enquanto `package.json` exige Node `22.x`; CI e Vercel usam Node 22.x por causa do `engines`. O ajuste do painel continua pendência externa.

Outros projetos GitHub/Supabase/Vercel da conta **não pertencem** ao Cérebro Autoral e não devem ser tocados.

## 3. Stack atual

### Aplicação

- Next.js `16.3.5`
- React `19.3.0`
- TypeScript `6.0.3`
- Node `22.x`
- npm `11.19.1`
- ESLint `9.39.5`
- App Router + `proxy.ts`

### Supabase / upload

- `@supabase/supabase-js` `2.116.0`
- `@supabase/ssr` `0.12.7`
- `tus-js-client` `4.3.1`
- `hash-wasm` `4.12.0`
- Supabase CLI `2.117.0` no CI
- PostgreSQL + pgvector/HNSW
- Full Text Search
- Storage privado
- RLS
- SHA-256 incremental + deduplicação

### Pipeline documental

- Vercel Workflow SDK `4.8.9`
- `unpdf` `1.8.1`
- PDF textual, TXT e Markdown v1
- normalização LF + Unicode NFC
- artefatos intermediários privados
- steps duráveis/idempotentes
- workflow composto para preservar o pipeline já estabilizado e encadear novas etapas
- `PROCESSAMENTO_WORKFLOW_ATIVO=false`

### Supply chain

```json
"overrides": {
  "nanoid": "5.1.16",
  "undici": "7.29.0"
}
```

`npm audit --omit=dev --audit-level=high` permanece gate obrigatório.

### OpenAI

- pacote `openai` `7.15.0`
- Zod `4.6.5`
- chave somente em ambiente servidor/Vercel
- nenhuma chave versionada
- Responses API + Structured Outputs
- `store:false` obrigatório para conteúdo intelectual privado
- SDK com `maxRetries:0`; retries/cobrança são controlados pela camada auditável

Configuração atual:

```text
MODELO_IA_ANALISE  → padrão gpt-5.6-terra
MODELO_IA_EXTRACAO → padrão gpt-5.6-terra
```

A extração possui configuração própria para que o modelo possa ser trocado sem alterar o restante do Pipeline.

Snapshot operacional pesquisado em 17/09/2026:

| Modelo | Entrada / 1M | Cache / 1M | Saída / 1M | Uso planejado |
|---|---:|---:|---:|---|
| `gpt-5.6-luna` | US$ 0,20 | US$ 0,02 | US$ 1,20 | candidato a alto volume após avaliação |
| `gpt-5.6-terra` | US$ 2,00 | US$ 0,20 | US$ 12,00 | padrão atual: equilíbrio qualidade/custo |
| `gpt-5.6-sol` | US$ 4,00 | US$ 0,40 | US$ 20,00 | escalonamento de alta complexidade |

A estratégia não é usar o modelo mais caro em tudo. Luna será comparada com Terra em avaliações próprias do aplicativo antes de qualquer troca de etapa. Sol fica reservado a exceções de alta complexidade.

**Nenhuma chamada real paga foi executada até este ponto.**

## 4. Estado funcional do Pipeline

| Etapa | Estado |
|---|---|
| `validar_arquivo` | ✅ concluída/testada |
| `identificar_formato` | ✅ concluída/testada |
| `extrair_conteudo` | ✅ PDF textual/TXT/Markdown |
| `normalizar_conteudo` | ✅ concluída/testada |
| `identificar_estrutura` | ✅ concluída/testada |
| `criar_hierarquia` | ✅ concluída/testada |
| `criar_fragmentos` | ✅ concluída/testada/auditada |
| `criar_sinteses` | ✅ implementada/auditada, sem chamada real |
| `extrair_elementos` | ✅ implementada/auditada, sem chamada real |
| `normalizar_taxonomia` | ⬜ próxima etapa |
| `criar_relacoes` | ⬜ não iniciada |
| `gerar_embeddings` | ⬜ não iniciada |
| `criar_indices` | ⬜ não iniciada |
| `realizar_analise_autoral_local` | ⬜ não iniciada |
| `validar_processamento` | ⬜ não iniciada |
| `publicar_documento_processado` | ⬜ não iniciada |
| `avaliar_participacao_cerebro` | ⬜ não iniciada |
| `atualizar_cerebro` | ⬜ não iniciada |

Depois ainda faltam Cérebro Autoral consolidado, Influências Externas deliberadas, Recuperação Contextual, Motor de Reflexões e Aprendizado por Revisão.

## 5. Parte determinística consolidada

- `identificar_estrutura` preserva incerteza e só materializa sinais de alta confiança;
- `criar_hierarquia` constrói Documento Processado em estado `candidato`;
- `criar_fragmentos` usa texto próprio de cada seção;
- PDF usa `offset_pagina_inicio` para fronteiras intrapágina (`0028`);
- replay de fragmentos revalida artefato e resultado persistido (`0029`);
- Documento Processado parcial nunca alimenta o Cérebro Autoral.

## 6. `criar_sinteses` — arquitetura v1

Essa foi a primeira etapa realmente cognitiva incorporada ao Pipeline.

### Hierarquia

Sínteses são produzidas de baixo para cima:

```text
seções/subseções/folhas
      ↓
capítulos
      ↓
partes
      ↓
obra
```

Cada pai recebe seu texto próprio, quando houver, e sínteses auditadas dos filhos diretos. Replay só é aceito quando modelo, prompt e hash exato da entrada coincidem.

### Segurança e retries

- conteúdo-fonte é **DADO NÃO CONFIÁVEL**;
- Structured Output + Zod antes da persistência;
- contrato de schema persistido validado exatamente;
- limite conservador de 400.000 caracteres por entrada;
- HTTP `408/409/425/429/5xx` pode permitir retry controlado;
- HTTP permanente não é repetido automaticamente;
- transporte ambíguo após início vira `incerta`;
- persistência pós-resposta pode ser repetida sem refazer a chamada externa.

## 7. `extrair_elementos` — arquitetura v1

### Unidade de processamento

A extração trabalha com **um fragmento por chamada**. Isso limita contexto, reduz custo e torna a evidência local/auditável.

A síntese global da obra pode ser enviada apenas como contexto. Ela **não** é evidência primária.

### Planos analíticos obrigatórios

Cada elemento é classificado em exatamente um plano:

```text
conteudo   → sobre o que o texto pensa/fala
metodo     → como o pensamento é desenvolvido
expressao  → como aparece linguisticamente
```

Essa separação evita confundir tema recorrente com metodologia autoral.

### Elementos

O contrato v1 aceita 26 tipos canônicos, incluindo temas, conceitos, ideias, teses, argumentos, valores, perguntas, tensões, contradições, histórias, experiências, metáforas, padrões linguísticos, recursos narrativos, estruturas argumentativas e mudanças de pensamento.

### Evidência determinística

O modelo **não escolhe `fragmento_id`**. A associação ao fragmento corrente é feita pelo sistema.

Cada elemento exige de 1 a 5 evidências. `trecho_referencia` precisa existir literalmente no conteúdo-fonte do fragmento antes de persistir.

A validação ocorre duas vezes:

1. na aplicação, depois do Structured Output/Zod;
2. no RPC transacional do PostgreSQL, antes da persistência definitiva.

Se uma evidência falhar, a transação é revertida; elemento parcial não fica gravado.

### Idempotência e cobrança

A chave inclui:

```text
operação
+ execução
+ fragmento
+ modelo
+ prompt
+ hash da entrada
```

Estados operacionais:

- `reservada`: ainda não houve chamada externa;
- `em_execucao`: chamada externa iniciada;
- `concluida`: resultado persistido e reutilizável;
- `falhou`: falha conhecida que pode ser elegível a retry;
- `incerta`: não repetir automaticamente;
- `cancelada`: resposta/erro permanente conhecido; não repetir automaticamente.

Saída que viola evidência/schema depois de uma resposta do provedor vira `cancelada`, evitando cobrança automática repetida por uma saída semanticamente inválida.

### Workflow composto

O pipeline anterior permanece encapsulado em `processarObraWorkflow`. O novo `processarObraCompletaWorkflow` inicia o pipeline estabilizado como workflow filho e, após sua conclusão, encadeia `extrair_elementos` por fragmento.

O Preview Vercel compilou essa composição como **21 steps e 2 workflows**.

## 8. Auditoria de IA

`auditoria.execucoes_ia` registra:

- usuário/operação;
- modelo/prompt;
- versões de Taxonomia/Pipeline;
- estado;
- tokens de entrada/saída;
- duração;
- custo estimado;
- referências de entrada/saída;
- erro;
- chave de idempotência;
- tentativa e timestamps.

O texto integral privado não é duplicado na tabela de auditoria; referências e hashes são preferidos.

As RPCs de IA são `SECURITY DEFINER`, `search_path=''`, sem `EXECUTE` para `anon/authenticated` e executáveis apenas por `service_role`.

## 9. Migrations cognitivas oficiais

A sequência anterior `0001–0029` cobre Fundação, Biblioteca e pipeline determinístico. A camada cognitiva atualmente versionada é:

| Versão | Migration | Finalidade |
|---|---|---|
| `20260917020401` | `0030_fundacao_ia_sinteses` | auditoria IA, modelo/prompt e RPCs de síntese |
| `20260917021001` | `0031_recuperacao_reserva_ia` | separa reserva de chamada iniciada |
| `20260917021151` | `0032_listagem_sinteses_auditadas` | replay de síntese por modelo/prompt/hash |
| `20260917021601` | `0033_hardening_auditoria_ia` | hardening RLS/índices |
| `20260917022624` | `0034_corrige_ambiguidade_tentativa_ia` | correção SQL de retry |
| `20260917023206` | `0035_contrato_schema_sintese` | contrato exato de Structured Output |
| `20260917030126` | `0036_plano_analitico_elementos` | materializa conteúdo/método/expressão |
| `20260917032107` | `0037_fundacao_extracao_elementos_ia` | catálogo, prompt, reserva e persistência atômica |
| `20260917032115` | `0038_estado_terminal_saida_ia_invalida` | estado terminal `cancelada` sem retry cego |
| `20260917032125` | `0039_replay_extracao_elementos` | replay auditado sem nova reserva |

Os nomes/timestamps `0037–0039` no GitHub foram alinhados aos IDs reais atribuídos pelo Supabase, reutilizando os mesmos blobs SQL.

## 10. Testes

A suíte sem chave real cobre, entre outros:

### Sínteses

- input determinístico + SHA-256;
- `store:false`;
- Structured Output/Zod;
- tokens/custo estimado;
- defesa contra prompt injection;
- contrato exato do schema;
- classificação de status HTTP;
- ordem bottom-up e composição hierárquica.

### Extração de elementos

- input/hash determinísticos;
- chamada por fragmento;
- `fragmento_id` proibido na saída do modelo;
- conteúdo/método/expressão como enum fechado;
- evidência literal obrigatória;
- schema persistido igual ao contrato v1;
- cliente OpenAI falso com `store:false`;
- contabilização de tokens/cache/custo sem API real;
- migrations `0036–0039` reconstruindo o banco local do zero;
- Workflow composto compilando em Vercel.

Gates usados na PR #19:

```text
npm ci                                      ✅
npm audit --omit=dev --audit-level=high     ✅
npm run lint                                ✅
npm run typecheck                           ✅
npm test                                    ✅
npm run build                               ✅
Supabase local + migrations 0001–0039       ✅
supabase db reset                           ✅
Preview Vercel                              ✅ READY
```

Qualquer commit documental final ainda precisa passar pelo mesmo CI antes do merge.

## 11. Supabase oficial após `0039`

Validado diretamente no projeto oficial:

- `gpt-5.6-terra` catalogado e ativo para finalidade `extracao`;
- prompt `extracao_elementos_documentais` v1 ativo;
- JSON Schema da extração presente;
- RPCs de extração com `SECURITY DEFINER` e `search_path=''`;
- `anon`/`authenticated` sem execução nas RPCs backend-only;
- `service_role` com execução;
- 0 execuções de processamento;
- 0 Documentos Processados;
- 0 elementos;
- 0 evidências;
- 0 execuções de IA.

Portanto, a estrutura está implantada, mas **nenhum custo de IA foi gerado**.

## 12. Segurança atual

Confirmado até `0039`:

- RLS nas superfícies pessoais/sensíveis;
- Storage privado;
- schemas internos fechados;
- RPCs backend-only;
- conteúdo do usuário tratado como dado;
- OpenAI server-only;
- `store:false`;
- audit trail de modelo/prompt/hash/tokens/custo;
- evidência literal validada antes de persistência;
- retry controlado para evitar cobrança duplicada;
- `PROCESSAMENTO_WORKFLOW_ATIVO=false` bloqueando início do Pipeline.

Advisor Supabase:

- segurança: permanece a pendência externa **Leaked Password Protection Disabled**;
- performance: somente `unused_index` informativo enquanto o banco está sem corpus; não remover índices planejados antes de observar carga real.

## 13. O que ainda NÃO foi feito

- nenhuma chamada real paga à OpenAI;
- nenhum documento real processado ponta a ponta;
- `PROCESSAMENTO_WORKFLOW_ATIVO` não foi ativado;
- nenhum resultado parcial foi publicado como Documento Processado ativo;
- `normalizar_taxonomia` e as etapas posteriores ainda não foram implementadas.

## 14. Próximo marco

1. concluir e incorporar a PR #19 mantendo a feature flag desligada;
2. manter a primeira chamada real paga bloqueada até autorização explícita do proprietário;
3. quando autorizado, executar um E2E controlado com documento pequeno e custo mínimo, registrando tokens/custo/qualidade;
4. comparar Luna × Terra apenas com avaliações reais do projeto antes de deslocar operações para o modelo mais barato;
5. iniciar `normalizar_taxonomia`, reutilizando conceitos existentes antes de propor novos;
6. manter Documento Processado como `candidato` até `validar_processamento` e `publicar_documento_processado`.

## 15. Regra permanente

O README deve dizer claramente o que existe, o que foi testado, o que está ativo, quanto pode custar, quais migrations estão aplicadas, quais alertas permanecem e qual é o próximo passo — sem tratar intenção futura como funcionalidade pronta.
