# Estado Atual do Projeto

Atualizado em **17/09/2026** após a implementação, integração e auditoria da etapa `normalizar_taxonomia`, ainda com `PROCESSAMENTO_WORKFLOW_ATIVO=false` e sem chamada real paga à OpenAI.

## Infraestrutura oficial

- GitHub: `villacanabrava-maker/Biblioteca-Celebro-Reflex-es-`
- desenvolvimento atual: PR #20 — `feature/normalizar-taxonomia`
- Supabase: `xzkzdaxxmizcgfkjgzoq` — `us-west-2`, PostgreSQL 17.6
- Vercel: `cerebro-autoral`
- produção: `https://cerebro-autoral.vercel.app`
- feature flag: `PROCESSAMENTO_WORKFLOW_ATIVO=false`

Outros projetos conectados não pertencem a este aplicativo.

## Marco atual do Pipeline

```text
validar_arquivo                  ✅
identificar_formato              ✅
extrair_conteudo                 ✅
normalizar_conteudo              ✅
identificar_estrutura            ✅
criar_hierarquia                 ✅
criar_fragmentos                 ✅
criar_sinteses                   ✅ implementada/auditada; sem chamada real
extrair_elementos                ✅ implementada/auditada; sem chamada real
normalizar_taxonomia             ✅ implementada/auditada; sem chamada real
criar_relacoes                   ⬜ próxima etapa
gerar_embeddings                 ⬜ não iniciada
criar_indices                    ⬜ não iniciada
realizar_analise_autoral_local   ⬜ não iniciada
validar_processamento            ⬜ não iniciada
publicar_documento_processado    ⬜ não iniciada
avaliar_participacao_cerebro     ⬜ não iniciada
atualizar_cerebro                ⬜ não iniciada
```

A criação de novas execuções foi alinhada ao workflow canônico de 18 etapas. Em especial:

```text
extrair_elementos
→ normalizar_taxonomia
→ criar_relacoes
→ gerar_embeddings
```

Nenhum resultado parcial alimenta o Cérebro Autoral.

## Estado real dos dados

Auditoria do Supabase oficial após `0040–0046`:

```text
execuções de processamento: 0
Documentos Processados:     0
elementos:                  0
classificações:             0
propostas taxonômicas:      0
conceitos canônicos:        0
termos taxonômicos:         0
execuções de IA:            0
```

Não existe corpus real processado e nenhum seed intelectual foi inventado.

## `normalizar_taxonomia` — objetivo

A etapa transforma elementos já extraídos em ligações taxonômicas controladas, sem permitir que similaridade textual ou uma resposta de IA crie silenciosamente verdade canônica.

Fluxo:

```text
elemento
→ normalização determinística
→ busca na Taxonomia Mestre ativa
→ shortlist
→ match exato único OU decisão estruturada por IA
→ classificação existente OU proposta revisável
→ proveniência
```

### Match exato

Quando o termo do elemento aponta exatamente para **um único conceito ativo** na versão de Taxonomia da execução:

- não há chamada à OpenAI;
- a classificação é determinística;
- replay é somente leitura;
- reexecução não cria uma nova classificação silenciosamente.

Se houver mais de um conceito exato, o caso é considerado ambíguo e segue para decisão estruturada.

### Shortlist

A recuperação consulta somente conceitos ativos da versão correta. `pg_trgm` e correspondências lexicais produzem candidatos, nunca confirmação automática.

A shortlist é limitada a 20 conceitos e, antes de uma chamada de IA, é congelada em `auditoria.execucoes_ia`.

O PostgreSQL rejeita:

- shortlist com duplicatas;
- ID fora da Taxonomia/versão ativa;
- shortlist divergente da reserva original;
- `conceito_id` retornado pela IA que não estava na shortlist congelada.

### Decisão por IA

Contrato fechado:

```text
decisao = reutilizar_conceito | propor_conceito
papel = principal | secundario | contextual | oposicao
```

A saída passa por Responses API + Structured Outputs + JSON Schema + Zod e por validações determinísticas antes da persistência.

`propor_conceito` nunca grava diretamente em `taxonomia.conceitos`. A sugestão fica em `taxonomia.propostas_conceitos`, com proveniência em `taxonomia.fontes_propostas_conceitos`, para futura revisão humana.

### Auditoria, replay e cobrança

A operação de IA é `normalizacao_taxonomica_elemento`.

- reserva local antes da chamada;
- chamada externa explicitamente marcada como iniciada;
- chave idempotente inclui execução, elemento, modelo, prompt e hash da entrada;
- replay exige modelo + prompt + hash exatos;
- HTTP transitório conhecido (`408`, `409`, `425`, `429`, `5xx`) pode ser repetido de forma controlada;
- HTTP permanente não é repetido automaticamente;
- transporte ambíguo após início vira `incerta`;
- resposta inválida vira estado terminal sem nova cobrança automática;
- persistência pós-resposta pode ser repetida localmente sem nova chamada externa.

## Migrations oficiais da etapa

Os arquivos do GitHub foram alinhados às versões reais registradas pelo Supabase:

```text
20260917040851_0040_fundacao_normalizacao_taxonomia.sql
20260917040918_0041_catalogo_normalizacao_taxonomia.sql
20260917040937_0042_hardening_taxonomia_ativa.sql
20260917041025_0043_auditoria_normalizacao_taxonomia.sql
20260917041039_0044_replay_match_exato_taxonomia.sql
20260917041057_0045_alinha_etapas_pipeline_canonico.sql
20260917041526_0046_hardening_propostas_taxonomia.sql
```

Resumo:

- `0040`: normalização de termos, pg_trgm, staging de propostas, proveniência e RPCs de recuperação;
- `0041`: catálogo do modelo/prompt/schema e classificação determinística exata;
- `0042`: somente conceitos ativos + preservação de `papel_proposto`;
- `0043`: auditoria/idempotência da IA, shortlist congelada e persistência atômica;
- `0044`: replay somente leitura do match exato;
- `0045`: alinhamento das 18 etapas do pipeline canônico;
- `0046`: policies explícitas de negação e índices completos das novas FKs.

Nenhuma migration aplicada é reescrita.

## Segurança auditada

As RPCs taxonômicas sensíveis foram verificadas no Supabase oficial:

- `SECURITY DEFINER=true`;
- `search_path=''`;
- `anon`: sem `EXECUTE`;
- `authenticated`: sem `EXECUTE`;
- `service_role`: permitido somente pelas RPCs previstas.

As duas tabelas de propostas possuem RLS ativo, acesso direto revogado e policies explícitas de negação ao cliente.

Advisor de segurança após `0046`:

- único aviso restante: `Leaked Password Protection Disabled` no Supabase Auth.

Advisor de performance após `0046`:

- somente `unused_index`;
- não há mais FKs novas sem índice;
- o banco está vazio, portanto índices ainda não usados são esperados e não devem ser removidos especulativamente.

## OpenAI

Configuração server-only e centralizada:

```text
MODELO_IA_ANALISE
MODELO_IA_EXTRACAO
MODELO_IA_TAXONOMIA
```

Padrão atual da Taxonomia: `gpt-5.6-terra`.

Política permanente:

- `store:false`;
- `maxRetries:0` no SDK;
- retry e idempotência controlados pela aplicação;
- conteúdo intelectual tratado como dado não confiável;
- nenhuma chave versionada;
- nenhuma chamada real paga sem autorização explícita do proprietário.

Até este estado, **0 execuções de IA existem no banco oficial**.

## Gates de validação

Os heads de implementação da PR #20 passaram progressivamente por:

```text
npm ci
npm audit --omit=dev --audit-level=high
npm run lint
npm run typecheck
npm test
npm run build
Supabase local + aplicação das migrations
supabase db reset
supabase status / stop
Vercel Preview
```

O head final da PR só poderá ser incorporado depois de repetir esses gates sobre a versão documental consolidada.

## Vercel

Os Previews da implementação integrada, inclusive o hardening `0046`, chegaram a `READY`.

O projeto continua usando Node 22.x por causa de `package.json#engines`, mesmo que o Dashboard ainda mostre configuração 24.x. Isso é uma pendência externa de configuração, não um desvio do runtime efetivamente usado no build.

## O que ainda NÃO ocorreu

- chamada real à OpenAI;
- cobrança de API gerada por este Pipeline;
- ativação de `PROCESSAMENTO_WORKFLOW_ATIVO`;
- E2E positivo com documento real;
- criação de relações intelectuais (`criar_relacoes`);
- embeddings e etapas posteriores;
- publicação de Documento Processado ativo;
- alimentação do Cérebro Autoral por corpus real.

## Próximo marco

1. concluir o CI/Preview do head final da PR #20;
2. incorporar a PR mantendo a feature flag OFF;
3. verificar deployment de produção e ausência de regressões;
4. iniciar `criar_relacoes` conforme o grafo intelectual canônico;
5. manter a primeira chamada real paga bloqueada até autorização explícita do proprietário.

## Regra permanente

Nenhum segredo é commitido. Nenhuma migration aplicada é alterada retrospectivamente. Saída de IA só pode ser persistida depois de validação estrutural e sempre carrega proveniência suficiente para auditoria/replay. O proprietário permanece autoridade final sobre autoria e incorporação ao Cérebro Autoral.
