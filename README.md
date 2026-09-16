# Cérebro Autoral

Plataforma de **Inteligência Autoral Personalizada** para transformar a produção intelectual de uma pessoa em conhecimento estruturado, inferir padrões de pensamento com evidências e proveniência, construir um Cérebro Autoral versionado e utilizá-lo para apoiar novas reflexões com revisão humana.

> Este README é o painel mestre do projeto. Ele deve ser atualizado em toda etapa relevante de implementação, migration, integração, decisão arquitetural ou mudança de status.

---

## 1. Objetivo do produto

O principal ativo do sistema é o **Cérebro Autoral**.

Ele será construído a partir das obras e produções do usuário para representar, de forma verificável e versionada:

- metodologia de pensamento;
- metodologia de interpretação;
- metodologia de associação;
- metodologia argumentativa;
- metodologia de escrita;
- metodologia de revisão;
- arquitetura narrativa;
- arquitetura de parágrafo;
- formas de abertura, transição e conclusão;
- recursos retóricos;
- identidade linguística;
- relação entre experiência e conceito;
- padrões de tensão e síntese;
- universo conceitual;
- evolução autoral.

A IA não será tratada como fonte de verdade. Ela poderá interpretar, organizar, propor, relacionar, recuperar contexto e redigir, mas a identidade autoral, a proveniência, as permissões, os estados, as versões e a publicação serão controlados pelo sistema e pelo usuário.

---

## 2. Macrofluxo canônico

```text
BIBLIOTECA
   ↓
PROCESSAMENTO INTELIGENTE
   ↓
DOCUMENTOS PROCESSADOS
   ↓
ANÁLISE TRANSVERSAL
   ↓
CÉREBRO AUTORAL
   ↓
RECUPERAÇÃO CONTEXTUAL
   ↓
MOTOR DE REFLEXÕES
   ↓
NOVA REFLEXÃO
   ↓
REVISÃO HUMANA
   ↓
APRENDIZADO CONTROLADO
```

Uma reflexão aprovada **não entra automaticamente no Cérebro**. Para virar nova evidência autoral, deverá ser incorporada explicitamente e percorrer novamente Biblioteca → Processamento → Documento Processado → Cérebro.

---

## 3. Princípios de engenharia

- pesquisar antes de supor;
- validar antes de persistir;
- testar antes de publicar;
- versionar antes de substituir;
- preservar arquivos originais;
- preservar proveniência;
- proteger a autoria;
- separar conteúdo autoral de referências externas;
- nunca transformar fonte externa silenciosamente em evidência autoral;
- manter IA estruturada e validada antes da persistência;
- manter segredos somente no servidor;
- manter RLS e privilégio mínimo desde o início;
- construir etapas caras como processos idempotentes e reexecutáveis;
- registrar decisões arquiteturais importantes;
- manter o README atualizado junto com o código.

---

## 4. Stack oficial

### Aplicação

- Next.js
- React
- TypeScript
- App Router

### Banco, autenticação e arquivos

- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage privado
- PostgreSQL Full Text Search
- pgvector

### Inteligência artificial

- OpenAI API
- respostas estruturadas e validadas antes da persistência
- modelos centralizados por configuração, nunca espalhados pelo código

### Infraestrutura

- GitHub — código, branches, PRs e CI
- Vercel — aplicação e ambientes de deploy
- Supabase — banco, autenticação e storage

---

## 5. Infraestrutura canônica

O projeto novo utiliza uma única cadeia oficial:

```text
GitHub
   ↓
Vercel
   ↓
Aplicação Next.js
   ↓
Supabase
```

Repositório canônico atual:

```text
villacanabrava-maker/Biblioteca-Celebro-Reflex-es-
```

Projeto Supabase oficial identificado pelo projeto da aplicação atual. O banco novo começou vazio e está sendo construído exclusivamente por migrations versionadas.

Projetos, tabelas, migrations, funções ou deploys do aplicativo anterior não são considerados parte desta arquitetura.

---

## 6. Estado atual — 16/09/2026

### Fundação

**Status: concluída e incorporada à `main`.**

Entregue:

- aplicação Next.js inicial;
- TypeScript;
- estrutura de navegação;
- sistema visual inicial;
- páginas principais do produto;
- GitHub Actions CI;
- primeira migration de fundação;
- schemas canônicos no Supabase;
- extensões necessárias;
- documentação de design;
- documentação de decisões arquiteturais.

### Schema `sistema`

**Status: implementado no Supabase e em PR para incorporação à `main`.**

Entregue:

- `sistema.modelos_ia`;
- `sistema.prompts`;
- `sistema.versoes_prompts`;
- `sistema.versoes_pipeline`;
- `sistema.configuracoes_usuario`;
- constraints;
- comentários SQL;
- RLS em dados pessoais;
- quatro policies de isolamento da configuração do usuário;
- schemas internos fechados para acesso direto de `anon` e `authenticated`.

Validações concluídas:

- teste transacional com `ROLLBACK` antes da aplicação real;
- migration aplicada com sucesso;
- cinco tabelas confirmadas;
- RLS confirmado;
- quatro policies confirmadas;
- `authenticated` sem acesso direto ao schema interno;
- advisors de segurança sem alertas;
- advisors de performance sem alertas;
- CI do PR #2 aprovado.

---

## 7. Migrations aplicadas

| Ordem | Migration | Estado | Finalidade |
|---|---|---|---|
| 0001 | `0001_fundacao` | aplicada | extensões e schemas canônicos |
| 0002 | `0002_sistema` | aplicada | modelos, prompts, pipeline e configurações do usuário |
| 0003 | `0003_taxonomia` | próxima | Taxonomia Mestre versionada |

### Schemas canônicos existentes

- `biblioteca`
- `processamento`
- `taxonomia`
- `cerebro_autoral`
- `reflexoes`
- `auditoria`
- `sistema`
- `aplicacao`

Schemas nativos do Supabase, como `auth` e `storage`, permanecem nativos.

### Extensões confirmadas

- `vector`
- `unaccent`
- `pg_trgm`

---

## 8. Próxima migration — `0003_taxonomia`

A Taxonomia Mestre será a camada responsável por impedir proliferação descontrolada de tags e conceitos desconectados.

Estruturas previstas:

- `taxonomia.versoes`;
- `taxonomia.conceitos`;
- `taxonomia.termos`;
- `taxonomia.relacoes`;
- `taxonomia.classificacoes_elementos`.

Domínios intelectuais iniciais:

1. `intelectual`
2. `axiologico`
3. `reflexivo`
4. `narrativo`
5. `entidades`
6. `temporal`
7. `retorico`
8. `linguistico`
9. `estrutural`
10. `autoral`

A IA deverá primeiro procurar e normalizar conceitos existentes antes de propor novos conceitos.

---

## 9. Frontend implementado

Rotas/telas já preparadas visualmente:

- `/` — início/dashboard;
- `/biblioteca` — Biblioteca;
- fluxo de adicionar conteúdo;
- `/cerebro-autoral` — visão do Cérebro Autoral;
- `/criar-reflexao` — criação de nova reflexão;
- `/reflexoes` — histórico de reflexões;
- `/configuracoes` — configurações;
- login.

Os números e indicadores permanecem em zero enquanto não existe corpus real. A interface não deve apresentar dados fictícios como se fossem dados do usuário.

---

## 10. Design visual

A identidade visual inicial foi construída a partir das referências fornecidas pelo proprietário do produto.

Diretrizes atuais:

- azul-marinho profundo como cor estrutural;
- azul luminoso para ações e destaques;
- fundos claros;
- cartões brancos;
- hierarquia editorial;
- títulos com presença serifada;
- corpo de texto moderno e legível;
- espaçamento generoso;
- navegação lateral no desktop;
- navegação inferior no mobile;
- sensação visual de biblioteca pessoal, pensamento e reflexão.

Documento dedicado:

```text
docs/DESIGN_VISUAL.md
```

---

## 11. Segurança

Regras obrigatórias:

- RLS para informações pessoais;
- isolamento por `usuario_id`;
- Storage privado;
- menor privilégio possível;
- `service_role` nunca no navegador;
- chaves de IA nunca no frontend;
- segredos nunca no GitHub ou README;
- URLs temporárias para arquivos privados;
- logs sem conteúdo sensível desnecessário;
- conteúdo de documentos tratado como **DADO**, nunca como instrução de sistema;
- defesa contra prompt injection;
- usuário A nunca pode consultar ou modificar dados do usuário B.

### Chave da OpenAI

A aplicação utilizará uma variável de ambiente servidor-side chamada:

```text
OPENAI_API_KEY
```

**Nenhum valor de chave será salvo neste repositório.**

Em 16/09/2026 uma chave de projeto foi fornecida diretamente na conversa de desenvolvimento. Por segurança, ela **não foi persistida nem ativada no código**. Antes da integração real com a OpenAI, deve ser utilizada uma chave nova/rotacionada e armazenada exclusivamente como secret do ambiente de servidor.

---

## 12. Arquitetura da camada de IA

Estrutura lógica planejada:

```text
src/ia/
  documental/
  taxonomica/
  autoral/
  recuperacao/
  planejamento/
  redacao/
  auditoria/
  aprendizado/
```

Motores previstos:

- motor documental;
- motor taxonômico;
- motor autoral;
- motor de recuperação;
- motor de planejamento;
- motor de redação;
- motor de auditoria;
- motor de aprendizado.

Dados estruturados produzidos por IA deverão seguir:

```text
OpenAI
  ↓
Structured Output
  ↓
JSON Schema
  ↓
validação da aplicação
  ↓
normalização
  ↓
validação de referências
  ↓
persistência
```

Nunca será permitido o fluxo direto:

```text
texto livre do modelo → verdade canônica no banco
```

---

## 13. Autoria e influências externas

Toda obra deverá distinguir duas dimensões independentes:

### Autoria

- `autoral`
- `externa`

### Participação no Cérebro

- `autoral_prioritaria`
- `externa_referencia`
- `externa_influencia`
- `excluida_cerebro`

Regra central:

```text
NÚCLEO AUTORAL
+
INFLUÊNCIAS EXTERNAS DELIBERADAMENTE AUTORIZADAS
=
CÉREBRO ATIVO
```

Uma fonte externa nunca poderá se transformar silenciosamente em evidência de autoria.

---

## 14. Pipeline documental planejado

Fluxo conceitual:

```text
arquivo recebido
  ↓
validar
  ↓
identificar formato
  ↓
extrair conteúdo
  ↓
normalizar
  ↓
identificar estrutura
  ↓
construir hierarquia
  ↓
criar fragmentos
  ↓
criar sínteses
  ↓
extrair elementos
  ↓
normalizar taxonomia
  ↓
criar relações
  ↓
gerar embeddings
  ↓
validar
  ↓
publicar Documento Processado
  ↓
avaliar participação no Cérebro
  ↓
atualizar Cérebro candidato
```

Cada etapa deverá ser idempotente, versionada, observável, recuperável e reexecutável.

---

## 15. Testes e CI

Workflow GitHub Actions atual valida:

- instalação de dependências;
- lint;
- TypeScript;
- build Next.js.

A cobertura será expandida ao longo do projeto para incluir:

- testes unitários;
- integração;
- SQL;
- migrations;
- RLS;
- taxonomia;
- validação de outputs de IA;
- retrieval;
- autoria/contaminação autoral;
- E2E.

Nenhum PR estrutural deve ser incorporado à `main` com CI falhando.

---

## 16. Estratégia de branches

Fluxo atual:

```text
main
  ↑
feature/<etapa>
```

Cada bloco significativo é desenvolvido em branch própria, validado em PR e só então incorporado à `main`.

Migrations devem permanecer pequenas, ordenadas, auditáveis e reproduzíveis.

---

## 17. Documentação do repositório

Documentos já utilizados/mantidos:

- `README.md` — painel mestre e status atual;
- `docs/DESIGN_VISUAL.md` — sistema visual;
- `docs/DECISOES.md` — decisões arquiteturais e justificativas;
- `supabase/migrations/` — histórico executável do banco.

Documentação prevista ao longo da construção:

- visão do produto;
- arquitetura técnica;
- Dicionário Mestre de Dados;
- Taxonomia;
- Cérebro Autoral;
- pipeline documental;
- motor de reflexões;
- segurança;
- estado atual;
- plano de implementação.

---

## 18. Ordem de construção atual

| Etapa | Status |
|---|---|
| Fundação técnica | concluída |
| Schema `sistema` | implementado / PR em validação final |
| Taxonomia Mestre | próxima |
| Biblioteca | pendente |
| Storage privado e upload | pendente |
| Pipeline documental | pendente |
| Documento Processado | pendente |
| Busca híbrida | pendente |
| Cérebro Autoral | pendente |
| Influências externas deliberadas | pendente |
| Recuperação contextual | pendente |
| Motor de Reflexões | pendente |
| Aprendizado por revisão | pendente |
| Avaliações e otimização | pendente |

---

## 19. Próximas ações imediatas

1. incorporar o PR #2 após CI verde;
2. criar branch `feature/taxonomia`;
3. implementar `0003_taxonomia`;
4. testar a migration transacionalmente antes de persistir;
5. aplicar no Supabase;
6. rodar advisors de segurança e performance;
7. atualizar este README com o resultado;
8. abrir PR da Taxonomia;
9. iniciar a Biblioteca somente depois da Taxonomia validada;
10. integrar a OpenAI apenas após a chave de projeto estar rotacionada e armazenada como secret servidor-side.

---

## 20. Regra de manutenção deste README

A partir de 16/09/2026, toda mudança relevante deve atualizar este arquivo no mesmo ciclo de desenvolvimento.

O README deve sempre permitir responder, sem conhecimento técnico prévio:

- o que é o aplicativo;
- o que já foi construído;
- o que está funcionando;
- quais migrations existem;
- quais testes passaram;
- quais decisões foram tomadas;
- como segurança e autoria estão sendo protegidas;
- qual é a próxima etapa;
- quais itens ainda faltam para o produto estar concluído.
