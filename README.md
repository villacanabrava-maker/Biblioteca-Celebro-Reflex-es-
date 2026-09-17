# Cérebro Autoral

Plataforma de **Inteligência Autoral Personalizada** para preservar a produção intelectual do usuário, transformá-la em conhecimento estruturado, inferir padrões de pensamento com evidências/proveniência e usar esse Cérebro Autoral para apoiar novas reflexões com revisão humana.

> **Este README é o painel mestre operacional do projeto.** Os documentos canônicos fornecidos pelo proprietário continuam sendo a fonte de verdade do produto.

## Regra central

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

Conteúdo do usuário é **dado não confiável**, nunca instrução para o sistema ou para os modelos de IA. Preservar incerteza é melhor do que inventar estrutura, autoria, relação ou fato sem evidência.

## Infraestrutura oficial — somente esta

### GitHub

```text
villacanabrava-maker/Biblioteca-Celebro-Reflex-es-
branch principal: main
PR atual: #20 — feature/normalizar-taxonomia
```

O repositório continua público por decisão explícita do proprietário. Não alterar visibilidade sem autorização.

### Supabase

```text
Projeto: Biblioteca-Celebro-Reflex-es-
Project ref: xzkzdaxxmizcgfkjgzoq
Região: us-west-2
PostgreSQL: 17.6
Estado esperado: ACTIVE_HEALTHY
```

Estado auditado após as migrations `0040–0046`:

```text
0 execuções de processamento
0 Documentos Processados
0 elementos
0 classificações taxonômicas
0 propostas taxonômicas
0 conceitos canônicos
0 termos taxonômicos
0 execuções de IA
```

As migrations criam infraestrutura, configuração, auditoria e persistência, mas não processam obras nem executam chamadas externas.

### Vercel

```text
Projeto: cerebro-autoral
Produção: https://cerebro-autoral.vercel.app
Git: villacanabrava-maker/Biblioteca-Celebro-Reflex-es-
```

`PROCESSAMENTO_WORKFLOW_ATIVO=false` continua impedindo o início do Pipeline para usuários. Portanto o código de IA pode ser implantado sem autorizar chamadas pagas.

O Dashboard ainda pode reportar Node `24.x`, enquanto `package.json` exige Node `22.x`; CI e Vercel usam Node 22.x por causa de `engines`. Esse ajuste visual do painel permanece pendência externa.

Outros projetos GitHub/Supabase/Vercel da conta não pertencem ao Cérebro Autoral e não devem ser tocados.

## Stack atual

- Next.js `16.3.5`
- React `19.3.0`
- TypeScript `6.0.3`
- Node `22.x`
- npm `11.19.1`
- ESLint `9.39.5`
- Supabase JS `2.116.0`
- Supabase SSR `0.12.7`
- Supabase CLI `2.117.0` no CI
- Vercel Workflow SDK `4.8.9`
- OpenAI SDK `7.15.0`
- Zod `4.6.5`
- `unpdf` `1.8.1`
- PostgreSQL + pgvector/HNSW + Full Text Search + pg_trgm
- Storage privado + RLS

Supply chain:

```json
"overrides": {
  "nanoid": "5.1.16",
  "undici": "7.29.0"
}
```

`npm audit --omit=dev --audit-level=high` é gate obrigatório.

## Pipeline documental

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
| `normalizar_taxonomia` | ✅ implementada/auditada, sem chamada real |
| `criar_relacoes` | ⬜ próxima etapa |
| `gerar_embeddings` | ⬜ não iniciada |
| `criar_indices` | ⬜ não iniciada |
| `realizar_analise_autoral_local` | ⬜ não iniciada |
| `validar_processamento` | ⬜ não iniciada |
| `publicar_documento_processado` | ⬜ não iniciada |
| `avaliar_participacao_cerebro` | ⬜ não iniciada |
| `atualizar_cerebro` | ⬜ não iniciada |

A ordem canônica está gravada em novas execuções como:

```text
...
extrair_elementos
→ normalizar_taxonomia
→ criar_relacoes
→ gerar_embeddings
→ criar_indices
→ realizar_analise_autoral_local
→ validar_processamento
→ publicar_documento_processado
→ avaliar_participacao_cerebro
→ atualizar_cerebro
```

Nenhum processamento parcial alimenta o Cérebro Autoral.

## `criar_sinteses` — arquitetura v1

Sínteses são produzidas de baixo para cima e o replay só é aceito quando modelo, prompt e hash exato da entrada coincidem.

Segurança operacional:

- conteúdo-fonte tratado como dado não confiável;
- Responses API + Structured Outputs + Zod;
- `store:false`;
- limite conservador de entrada;
- HTTP `408/409/425/429/5xx` pode permitir retry controlado;
- HTTP permanente não é repetido automaticamente;
- transporte ambíguo após início vira `incerta`;
- persistência pós-resposta pode ser repetida sem refazer a chamada externa.

## `extrair_elementos` — arquitetura v1

A extração trabalha com um fragmento por chamada. Cada elemento pertence a exatamente um dos três planos:

```text
conteudo
metodo
expressao
```

Cada elemento exige evidência literal no fragmento. A associação ao `fragmento_id` é feita pelo sistema, nunca escolhida pelo modelo. Persistência é transacional e auditável.

## `normalizar_taxonomia` — arquitetura v1

### Taxonomia antes de novidade

A etapa segue esta ordem:

```text
elemento
→ normalização determinística do termo
→ busca na Taxonomia Mestre
→ match exato / sinônimos / termos alternativos / similaridade
→ shortlist de conceitos ativos
→ reutilizar conceito OU propor conceito novo
```

Um **único match exato ativo** é classificado de forma determinística e custa **0 chamadas de IA**. Match exato ambíguo não é decidido por heurística.

### Shortlist e IA

A similaridade textual serve apenas para recuperação de candidatos. Ela nunca confirma conceito automaticamente.

Nos casos que realmente exigem IA:

- a shortlist é limitada e congelada na auditoria;
- o modelo só pode escolher `conceito_id` presente nessa shortlist;
- o PostgreSQL repete essa validação antes de persistir;
- a decisão estruturada é `reutilizar_conceito` ou `propor_conceito`;
- `papel` é fechado em `principal`, `secundario`, `contextual`, `oposicao`;
- propostas novas ficam em `taxonomia.propostas_conceitos`, nunca em `taxonomia.conceitos`;
- proveniência elemento → proposta fica registrada em `taxonomia.fontes_propostas_conceitos`;
- proposta não é promovida automaticamente a conceito canônico.

### Idempotência e cobrança

- reserva local antes da chamada externa;
- início externo explicitamente marcado;
- replay usa modelo + prompt + hash exato;
- shortlist divergente da reserva é rejeitada;
- resposta inválida é terminal e não dispara nova cobrança automática;
- erro de transporte ambíguo vira `incerta`;
- persistência pós-resposta pode ser repetida localmente sem repetir a chamada;
- match exato em replay é somente leitura e nunca cria classificação nova.

### Migrations oficiais

```text
20260917040851_0040_fundacao_normalizacao_taxonomia.sql
20260917040918_0041_catalogo_normalizacao_taxonomia.sql
20260917040937_0042_hardening_taxonomia_ativa.sql
20260917041025_0043_auditoria_normalizacao_taxonomia.sql
20260917041039_0044_replay_match_exato_taxonomia.sql
20260917041057_0045_alinha_etapas_pipeline_canonico.sql
20260917041526_0046_hardening_propostas_taxonomia.sql
```

Os nomes/versões no GitHub acompanham o histórico real registrado no Supabase.

## OpenAI

Configuração de modelos é centralizada. Atualmente existem variáveis separadas por finalidade:

```text
MODELO_IA_ANALISE
MODELO_IA_EXTRACAO
MODELO_IA_TAXONOMIA
```

O padrão de taxonomia no código é `gpt-5.6-terra`. Nenhum ID de modelo é espalhado pelo Workflow.

Política permanente:

- chave apenas em ambiente servidor;
- `maxRetries:0` no SDK;
- `store:false` para conteúdo intelectual privado;
- Structured Outputs + JSON Schema + Zod;
- retry, idempotência e cobrança controlados pela camada auditável;
- nenhuma chamada real paga sem autorização explícita do proprietário.

**Nenhuma chamada real paga foi executada até este ponto.**

## Segurança

Mantido:

- schemas internos fechados;
- RLS;
- policies explícitas de negação nas tabelas internas sensíveis;
- Storage privado;
- `anon`/`authenticated` sem execução das RPCs backend de Taxonomia;
- RPCs sensíveis como `SECURITY DEFINER` com `search_path=''`;
- `service_role` somente no servidor;
- feature flag de processamento desligada.

Advisor de segurança após `0046`: resta apenas `Leaked Password Protection Disabled`, configuração externa do Supabase Auth.

Advisor de performance após `0046`: somente `unused_index`, esperado enquanto o banco permanece sem corpus. Não remover índices de forma especulativa antes de existir carga real.

## Gates obrigatórios

Antes de merge de qualquer etapa do Pipeline:

```text
npm ci
npm audit --omit=dev --audit-level=high
npm run lint
npm run typecheck
npm test
npm run build
Supabase local + migrations
supabase db reset
supabase status / stop
Vercel Preview READY
```

## Próximo marco

1. concluir e incorporar a PR #20 mantendo `PROCESSAMENTO_WORKFLOW_ATIVO=false`;
2. confirmar produção após merge;
3. manter a primeira chamada real paga bloqueada até autorização explícita;
4. iniciar `criar_relacoes` segundo o grafo intelectual canônico;
5. depois seguir para `gerar_embeddings` e as etapas restantes;
6. preparar E2E controlado somente quando houver autorização para custo real.

## Regra permanente

Nenhuma migration aplicada é reescrita. Nenhum segredo é commitido. Saída de IA só alimenta o banco depois de validação estrutural e com proveniência suficiente para auditoria/replay. O proprietário permanece autoridade final sobre autoria e incorporação ao Cérebro Autoral.
