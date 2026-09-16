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

```text
GitHub
   ↓
Vercel
   ↓
Aplicação Next.js
   ↓
Supabase
```

Repositório canônico:

```text
villacanabrava-maker/Biblioteca-Celebro-Reflex-es-
```

Projeto Supabase oficial:

```text
xzkzdaxxmizcgfkjgzoq
```

O banco novo começou vazio e está sendo construído exclusivamente por migrations versionadas. Projetos, tabelas, funções, migrations ou deploys do aplicativo anterior não são considerados parte desta arquitetura.

---

## 6. Estado atual — 16/09/2026

### Fundação técnica

**Status: concluída e incorporada à `main`.**

Inclui aplicação Next.js, TypeScript, CI, estrutura visual inicial, páginas principais, schemas canônicos, extensões PostgreSQL e documentação arquitetural.

### Schema `sistema`

**Status: concluído e incorporado à `main`.**

Inclui:

- `sistema.modelos_ia`;
- `sistema.prompts`;
- `sistema.versoes_prompts`;
- `sistema.versoes_pipeline`;
- `sistema.configuracoes_usuario`;
- RLS e policies para configurações pessoais;
- schema interno fechado por padrão.

### Taxonomia Mestre

**Status: concluída e incorporada à `main`.**

Inclui:

- `taxonomia.versoes`;
- `taxonomia.conceitos`;
- `taxonomia.termos`;
- `taxonomia.relacoes`;
- `taxonomia.classificacoes_elementos`;
- vocabulários controlados;
- constraints de confiança;
- índices taxonômicos;
- RLS nas classificações pessoais;
- schema interno fechado.

O PR #3 passou pelo CI e foi incorporado por squash merge.

### Biblioteca

**Status: implementada no Supabase e na branch `feature/biblioteca`, aguardando PR + CI para incorporação à `main`.**

Inclui:

- `biblioteca.obras`;
- `biblioteca.versoes_obras`;
- separação obrigatória entre autoria e participação no Cérebro;
- vocabulário completo de tipos de obra;
- estados de obra e processamento;
- precisão de data e importância;
- metadados auxiliares controlados;
- preservação de versões físicas;
- hash SHA-256 para integridade/deduplicação;
- integridade multiusuário por FK composta `(obra_id, usuario_id)`;
- Full Text Search inicial em título/descrição;
- RLS nas duas tabelas;
- oito policies por `auth.uid()`;
- schema `biblioteca` fechado a `anon` e `authenticated`.

Validações concluídas:

- `0004_biblioteca` testada integralmente em transação com `ROLLBACK`;
- `0004_biblioteca` aplicada com sucesso;
- duas tabelas confirmadas;
- RLS confirmado nas duas tabelas;
- oito policies confirmadas;
- FK composta confirmada;
- índice FTS confirmado;
- schema fechado para `authenticated`;
- advisor de segurança sem alertas.

O advisor de performance detectou que a FK composta ainda não possuía índice de suporte. Como `0004` já estava aplicada, ela não foi alterada retroativamente. Foi criada a migration incremental `0005_indice_fk_biblioteca`, testada em transação e aplicada. Após isso, o alerta de FK sem índice desapareceu.

Os avisos restantes são apenas `unused_index`, esperados neste momento porque as tabelas são novas e ainda não receberam carga/consultas reais.

---

## 7. Migrations aplicadas

| Ordem | Migration | Estado | Finalidade |
|---|---|---|---|
| 0001 | `0001_fundacao` | aplicada | extensões e schemas canônicos |
| 0002 | `0002_sistema` | aplicada | modelos, prompts, pipeline e configurações |
| 0003 | `0003_taxonomia` | aplicada | Taxonomia Mestre versionada |
| 0004 | `0004_biblioteca` | aplicada | obras e versões físicas |
| 0005 | `0005_indice_fk_biblioteca` | aplicada | índice de suporte à FK composta da Biblioteca |
| 0006 | Storage privado da Biblioteca | próxima | bucket privado e políticas de objetos |

### Schemas canônicos existentes

- `biblioteca`
- `processamento`
- `taxonomia`
- `cerebro_autoral`
- `reflexoes`
- `auditoria`
- `sistema`
- `aplicacao`

### Extensões confirmadas

- `vector`
- `unaccent`
- `pg_trgm`

---

## 8. Taxonomia Mestre

A Taxonomia impede a proliferação descontrolada de tags e conceitos desconectados.

Domínios iniciais:

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

A IA deverá procurar, comparar e normalizar conceitos existentes antes de propor novos conceitos.

O Dicionário ainda não enumera os valores de `taxonomia.conceitos.estado`; por isso não foi inventado um CHECK. A FK entre `taxonomia.classificacoes_elementos.elemento_id` e `processamento.elementos` também permanece adiada até a criação do Processamento.

---

## 9. Biblioteca

### `biblioteca.obras`

Representa a obra intelectual lógica, independentemente do arquivo físico.

Principais dados:

- proprietário;
- código humano;
- títulos original/exibição/normalizado;
- tipo de obra;
- autoria;
- participação no Cérebro;
- autor original externo;
- idioma;
- categoria e descrição;
- datas/período autoral;
- precisão da data;
- importância;
- estado;
- metadados auxiliares.

### Autoria

- `autoral`
- `externa`

### Participação no Cérebro

- `autoral_prioritaria`
- `externa_referencia`
- `externa_influencia`
- `excluida_cerebro`

`autoral_prioritaria` exige autoria autoral. `externa_influencia` já exige autoria externa; a validação adicional de que existe influência externa ativa será criada quando `cerebro_autoral.influencias_externas` existir.

### Tipos de obra

- `livro`
- `capitulo`
- `artigo`
- `carta`
- `reflexao`
- `ensaio`
- `relato`
- `mensagem`
- `anotacao`
- `transcricao`
- `documento_profissional`
- `material_metodologico`
- `referencia_externa`
- `outro`

### `biblioteca.versoes_obras`

Preserva cada arquivo físico e cada versão sem destruir versões anteriores.

Armazena nome original, caminho no Storage, MIME, extensão, tamanho, hash SHA-256, páginas, palavras, estado de processamento e número da versão.

A FK composta garante que uma versão de um usuário nunca consiga apontar para obra pertencente a outro usuário.

---

## 10. Próxima etapa — Storage privado da Biblioteca

O documento canônico define o bucket privado:

```text
originais-biblioteca
```

Estrutura de caminho prevista:

```text
/{usuario_id}/{obra_id}/{versao_id}/original.ext
```

A próxima etapa criará o bucket privado e as políticas que impedem acesso cruzado entre usuários. Depois disso, o frontend poderá começar a fazer upload real e criar registros em `biblioteca.obras` e `biblioteca.versoes_obras`.

---

## 11. Frontend implementado

Rotas/telas já preparadas visualmente:

- `/` — início/dashboard;
- `/biblioteca` — Biblioteca;
- fluxo de adicionar conteúdo;
- `/cerebro-autoral` — visão do Cérebro Autoral;
- `/criar-reflexao` — criação de nova reflexão;
- `/reflexoes` — histórico de reflexões;
- `/configuracoes` — configurações;
- login.

Os indicadores permanecem em zero enquanto não existe corpus real. A interface não apresenta dados fictícios como se fossem dados do usuário.

---

## 12. Design visual

Diretrizes atuais:

- azul-marinho profundo como cor estrutural;
- azul luminoso para ações;
- fundos claros;
- cartões brancos;
- hierarquia editorial;
- títulos com presença serifada;
- corpo moderno e legível;
- navegação lateral no desktop;
- navegação inferior no mobile;
- sensação de biblioteca pessoal, pensamento e reflexão.

Documento dedicado:

```text
docs/DESIGN_VISUAL.md
```

---

## 13. Segurança

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
- documentos externos tratados como **DADO**, nunca como instrução;
- defesa contra prompt injection;
- usuário A nunca acessa dados do usuário B.

### OpenAI

A aplicação utilizará a variável servidor-side:

```text
OPENAI_API_KEY
```

Nenhum valor de chave será salvo neste repositório.

Em 16/09/2026 uma chave de projeto foi fornecida diretamente na conversa de desenvolvimento. Por segurança, ela **não foi persistida nem ativada**. Antes da integração real, deverá ser usada uma chave nova/rotacionada, armazenada exclusivamente como secret do ambiente servidor.

---

## 14. Arquitetura da IA

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

Dados estruturados de IA deverão seguir:

```text
OpenAI
  ↓
Structured Output
  ↓
JSON Schema
  ↓
validação
  ↓
normalização
  ↓
validação de referências
  ↓
persistência
```

Nunca será permitido:

```text
texto livre do modelo → verdade canônica no banco
```

---

## 15. Regra de autoria

```text
NÚCLEO AUTORAL
+
INFLUÊNCIAS EXTERNAS DELIBERADAMENTE AUTORIZADAS
=
CÉREBRO ATIVO
```

Uma fonte externa nunca poderá se transformar silenciosamente em evidência de autoria.

---

## 16. Pipeline documental planejado

```text
arquivo recebido
  ↓
validar
  ↓
hash / deduplicação
  ↓
preservar original
  ↓
registrar obra e versão
  ↓
extrair conteúdo
  ↓
normalizar
  ↓
construir hierarquia
  ↓
fragmentar
  ↓
sintetizar
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
```

Cada etapa cara deverá ser idempotente, versionada, observável e recuperável.

---

## 17. Testes e CI

GitHub Actions atualmente valida:

- instalação de dependências;
- lint;
- TypeScript;
- build Next.js.

A cobertura será expandida para:

- unitários;
- integração;
- SQL;
- migrations;
- RLS;
- Storage;
- taxonomia;
- outputs de IA;
- retrieval;
- contaminação autoral;
- E2E.

Nenhum PR estrutural deve entrar na `main` com CI falhando.

---

## 18. Estratégia de branches

```text
main
  ↑
feature/<etapa>
```

Cada bloco significativo é desenvolvido em branch própria, validado em PR e incorporado à `main` somente depois dos checks.

Migrations aplicadas nunca devem ser reescritas para esconder correções posteriores. A correção do índice da FK da Biblioteca em `0005` é um exemplo desse princípio.

---

## 19. Documentação mantida

- `README.md` — painel mestre;
- `docs/DESIGN_VISUAL.md` — sistema visual;
- `docs/DECISOES.md` — ADRs e justificativas;
- `supabase/migrations/` — histórico executável do banco.

---

## 20. Ordem de construção atual

| Etapa | Status |
|---|---|
| Fundação técnica | concluída |
| Schema `sistema` | concluído |
| Taxonomia Mestre | concluída |
| Biblioteca — banco | implementada / aguardando PR + CI |
| Storage privado + upload | próxima |
| Pipeline documental | pendente |
| Documento Processado | pendente |
| Busca híbrida | pendente |
| Cérebro Autoral | pendente |
| Influências externas | pendente |
| Recuperação contextual | pendente |
| Motor de Reflexões | pendente |
| Aprendizado por revisão | pendente |
| Avaliações e otimização | pendente |

---

## 21. Próximas ações imediatas

1. abrir PR da Biblioteca;
2. validar CI;
3. incorporar `0004` e `0005` à `main`;
4. pesquisar/confirmar a configuração atual de Supabase Storage;
5. criar migration do bucket `originais-biblioteca` e políticas de acesso;
6. atualizar novamente este README;
7. conectar o frontend ao upload real;
8. iniciar pipeline documental;
9. preparar a camada OpenAI sem segredo no código;
10. ativar IA somente após rotação segura da chave.

---

## 22. Histórico de marcos

### 16/09/2026 — Fundação

- aplicação e sistema visual inicial;
- CI;
- `0001_fundacao`;
- oito schemas canônicos;
- extensões de busca/vetor.

### 16/09/2026 — Sistema

- `0002_sistema`;
- modelos/prompts/pipeline/configuração;
- RLS;
- PR #2 integrado;
- README transformado em painel mestre.

### 16/09/2026 — Taxonomia

- `0003_taxonomia`;
- cinco tabelas taxonômicas;
- vocabulários controlados;
- RLS;
- CI aprovado;
- PR #3 integrado.

### 16/09/2026 — Biblioteca

- `0004_biblioteca` testada e aplicada;
- obras e versões físicas criadas;
- autoria separada de participação no Cérebro;
- FK composta multiusuário;
- FTS inicial;
- RLS e oito policies;
- advisor detectou FK sem índice;
- `0005_indice_fk_biblioteca` criada e aplicada;
- alerta de FK sem índice resolvido;
- advisor de segurança limpo.

---

## 23. Regra de manutenção deste README

Toda mudança relevante deve atualizar este arquivo no mesmo ciclo de desenvolvimento.

O README deve sempre permitir responder:

- o que é o aplicativo;
- o que já foi construído;
- o que está funcionando;
- quais migrations existem;
- quais testes passaram;
- quais decisões foram tomadas;
- como segurança e autoria estão sendo protegidas;
- qual é a próxima etapa;
- o que ainda falta para o produto estar concluído.
