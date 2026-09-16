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
- nunca reescrever migration já aplicada para esconder uma correção posterior;
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
- Supabase — banco, autenticação e Storage

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

Inclui aplicação Next.js, TypeScript, CI, sistema visual inicial, páginas principais, schemas canônicos, extensões PostgreSQL e documentação arquitetural.

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

### Biblioteca — banco

**Status: concluída e incorporada à `main`.**

Inclui:

- `biblioteca.obras`;
- `biblioteca.versoes_obras`;
- separação obrigatória entre autoria e participação no Cérebro;
- vocabulário completo de tipos de obra;
- preservação de versões físicas;
- hash SHA-256 para integridade/deduplicação;
- integridade multiusuário por FK composta `(obra_id, usuario_id)`;
- Full Text Search inicial em título/descrição;
- RLS nas duas tabelas;
- oito policies por `auth.uid()`;
- schema `biblioteca` fechado a `anon` e `authenticated`.

O advisor de performance identificou que a FK composta precisava de índice próprio. Em vez de reescrever a migration já aplicada, foi criada e aplicada `0005_indice_fk_biblioteca`. O alerta específico desapareceu depois da correção.

O PR #4 passou pelo CI e foi incorporado à `main` por squash merge.

### Storage privado da Biblioteca

**Status: implementado no Supabase e na branch `feature/storage-biblioteca`, aguardando PR + CI para incorporação à `main`.**

Entregue:

- bucket `originais-biblioteca`;
- bucket confirmado com `public = false`;
- policy de SELECT para o próprio usuário;
- policy de INSERT para o próprio usuário;
- policy de UPDATE para o próprio usuário;
- policy de DELETE para o próprio usuário;
- isolamento pelo primeiro segmento do caminho do objeto;
- migration testada transacionalmente antes da aplicação;
- migration aplicada com sucesso;
- advisor de segurança sem alertas.

Formato efetivo do nome do objeto:

```text
{usuario_id}/{obra_id}/{versao_id}/original.ext
```

A forma com `/` inicial usada nos documentos é apenas uma representação visual do caminho. No Storage o nome do objeto será gerado sem barra inicial.

O bucket ainda não possui limite global de tamanho nem lista fixa de MIME types porque o Dicionário Mestre deixou deliberadamente abertos os formatos finais suportados e a estratégia de OCR. Essas restrições serão endurecidas quando o pipeline de upload/processamento formalizar os formatos aceitos.

---

## 7. Migrations aplicadas

| Ordem | Migration | Estado | Finalidade |
|---|---|---|---|
| 0001 | `0001_fundacao` | aplicada | extensões e schemas canônicos |
| 0002 | `0002_sistema` | aplicada | modelos, prompts, pipeline e configurações |
| 0003 | `0003_taxonomia` | aplicada | Taxonomia Mestre versionada |
| 0004 | `0004_biblioteca` | aplicada | obras e versões físicas |
| 0005 | `0005_indice_fk_biblioteca` | aplicada | índice de suporte à FK composta da Biblioteca |
| 0006 | `0006_storage_biblioteca` | aplicada | bucket privado e RLS de objetos da Biblioteca |

Os avisos atuais do advisor de performance são apenas `unused_index`. Eles são informativos neste estágio, pois as tabelas foram recém-criadas e ainda não receberam carga ou consultas reais. Os índices não serão removidos antes de termos dados de uso e avaliações de retrieval.

Referência do linter para `unused_index`:

```text
https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index
```

---

## 8. Schemas e extensões

### Schemas canônicos

- `biblioteca`
- `processamento`
- `taxonomia`
- `cerebro_autoral`
- `reflexoes`
- `auditoria`
- `sistema`
- `aplicacao`

Schemas nativos do Supabase como `auth` e `storage` permanecem nativos.

### Extensões confirmadas

- `vector`
- `unaccent`
- `pg_trgm`

---

## 9. Taxonomia Mestre

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

O Dicionário ainda não enumera os valores de `taxonomia.conceitos.estado`; por isso não foi inventado um CHECK. A FK entre `taxonomia.classificacoes_elementos.elemento_id` e `processamento.elementos` permanece adiada até a criação do Processamento.

---

## 10. Biblioteca

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

`autoral_prioritaria` exige autoria autoral. `externa_influencia` já exige autoria externa; a validação adicional de influência ativa será criada quando `cerebro_autoral.influencias_externas` existir.

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

## 11. Storage privado

Bucket canônico:

```text
originais-biblioteca
```

O bucket é privado. Downloads comuns exigirão sessão autenticada e política RLS; quando necessário, o servidor poderá fornecer URLs assinadas temporárias.

Caminho canônico efetivo:

```text
{usuario_id}/{obra_id}/{versao_id}/original.ext
```

As policies de `storage.objects` exigem simultaneamente:

```text
bucket_id = originais-biblioteca
primeira pasta = auth.uid()
```

Isso cria uma segunda camada de isolamento além das tabelas da Biblioteca. A aplicação também deverá validar obra, versão, MIME, hash e metadados antes de considerar um upload válido.

---

## 12. Próxima etapa — upload real e autenticação da Biblioteca

Com banco e Storage preparados, a próxima etapa passa da infraestrutura para o fluxo real da aplicação.

Objetivo do próximo bloco:

```text
usuário autenticado
   ↓
seleciona arquivo
   ↓
validação inicial
   ↓
hash SHA-256
   ↓
criação de obra
   ↓
criação de versão
   ↓
upload privado
   ↓
registro do caminho original
   ↓
estado recebido
   ↓
preparar disparo futuro do pipeline
```

O upload não deve destruir versões anteriores e não deve permitir que um arquivo externo seja classificado automaticamente como autoria do usuário.

---

## 13. Frontend implementado

Rotas/telas visualmente preparadas:

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

## 14. Design visual

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

## 15. Segurança

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
- usuário A nunca acessa dados ou objetos do usuário B.

### OpenAI

A aplicação utilizará a variável servidor-side:

```text
OPENAI_API_KEY
```

Nenhum valor de chave será salvo neste repositório.

Em 16/09/2026 uma chave de projeto foi fornecida diretamente na conversa de desenvolvimento. Por segurança, ela **não foi persistida nem ativada**. Antes da integração real, deverá ser utilizada uma chave nova/rotacionada e armazenada exclusivamente como secret do ambiente servidor.

---

## 16. Arquitetura da IA

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

## 17. Regra de autoria

```text
NÚCLEO AUTORAL
+
INFLUÊNCIAS EXTERNAS DELIBERADAMENTE AUTORIZADAS
=
CÉREBRO ATIVO
```

Uma fonte externa nunca poderá se transformar silenciosamente em evidência de autoria.

---

## 18. Pipeline documental planejado

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

## 19. Testes e CI

GitHub Actions atualmente valida:

- instalação de dependências;
- lint;
- TypeScript;
- build Next.js.

A cobertura será expandida para:

- testes unitários;
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

## 20. Estratégia de branches e migrations

```text
main
  ↑
feature/<etapa>
```

Cada bloco significativo é desenvolvido em branch própria, validado em PR e incorporado à `main` somente depois dos checks.

Migrations aplicadas nunca devem ser reescritas para esconder correções posteriores. A correção do índice da FK em `0005` é um exemplo desse princípio.

---

## 21. Documentação mantida

- `README.md` — painel mestre;
- `docs/DESIGN_VISUAL.md` — sistema visual;
- `docs/DECISOES.md` — ADRs e justificativas;
- `supabase/migrations/` — histórico executável do banco.

---

## 22. Ordem de construção atual

| Etapa | Status |
|---|---|
| Fundação técnica | concluída |
| Schema `sistema` | concluído |
| Taxonomia Mestre | concluída |
| Biblioteca — banco | concluída |
| Storage privado | implementado / aguardando PR + CI |
| Upload + Auth da Biblioteca | próxima |
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

## 23. Próximas ações imediatas

1. abrir PR do Storage privado;
2. validar CI e incorporar `0006` à `main`;
3. revisar a integração Supabase recomendada para Next.js App Router;
4. configurar cliente browser e cliente server sem expor chaves secretas;
5. conectar autenticação real;
6. implementar upload real para `originais-biblioteca`;
7. calcular hash SHA-256 e persistir obra/versão;
8. substituir estados fictícios da Biblioteca por dados reais;
9. adicionar testes de isolamento de Storage e RLS;
10. atualizar novamente este README;
11. depois iniciar o pipeline documental;
12. preparar a camada OpenAI sem inserir segredo no código;
13. ativar IA somente após rotação segura da chave.

---

## 24. Histórico de marcos

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
- PR #3 integrado.

### 16/09/2026 — Biblioteca

- `0004_biblioteca` testada e aplicada;
- obras e versões físicas;
- autoria separada de participação no Cérebro;
- FK composta multiusuário;
- FTS inicial;
- RLS e oito policies;
- `0005_indice_fk_biblioteca` corrigiu o índice da FK;
- advisor de segurança limpo;
- PR #4 aprovado no CI e integrado à `main`.

### 16/09/2026 — Storage privado

- documentação atual do Supabase revisada;
- branch `feature/storage-biblioteca` criada;
- `0006_storage_biblioteca` escrita;
- teste transacional com rollback aprovado;
- bucket `originais-biblioteca` criado como privado;
- policies SELECT/INSERT/UPDATE/DELETE aplicadas;
- isolamento por primeira pasta = `auth.uid()`;
- advisor de segurança limpo;
- README e ADRs atualizados.

---

## 25. Regra de manutenção deste README

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
