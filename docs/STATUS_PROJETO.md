# Estado Canônico do Projeto — Rflex01

**Atualizado em:** 18 de setembro de 2026  
**Produto:** Rflex01 — Memória Reflexiva / Cérebro Autoral  
**Fonte operacional:** `main` + Supabase canônico + produção Vercel.

## 1. Infraestrutura canônica

- GitHub: `villacanabrava-maker/reflex-01`
- Branch de produção: `main`
- Vercel project: `rflex01`
- Produção: `https://reflex-01.vercel.app`
- Supabase: `reflex-01`
- Supabase project ref: `cqavdefyelarhyjqmahi`
- Stack: Next.js 15, React 19, TypeScript, Tailwind, Supabase/PostgreSQL 17, OpenAI, Vercel e GitHub Actions.
- Baseline de produção reconciliada: `85b331c9f80194c508cbb8a33936bd29482f7a9a`.
- CI da baseline: concluído com sucesso.
- Deploy Vercel da mesma baseline: READY.

Projetos, repositórios e branches antigos são históricos e não prevalecem sobre este estado.

## 2. Arquitetura conceitual

A cadeia canônica é:

**Biblioteca → Processamento → Taxonomia → Cérebro Autoral → Reflexões → Auditoria**

Princípios:

1. Conteúdo, Método e Expressão são planos distintos.
2. Cérebro Ativo = Núcleo Autoral + Influências Externas Deliberadas.
3. Conteúdo externo não entra automaticamente no Núcleo Autoral.
4. IA interpreta/redige; PostgreSQL governa identidade, integridade, RLS e proveniência.
5. Métricas, custos, etapas e conteúdos simulados não podem ser apresentados como reais.
6. Material incorporado preserva origem e evidência.
7. Uploads grandes usam browser → Supabase Storage, não body da Vercel.
8. Sugestões de IA que alterem Taxonomia ou aprendizado autoral exigem decisão humana quando o domínio assim exige.

## 3. Estado funcional consolidado

### Biblioteca

Concluído:
- cadastro e visualização de obras;
- upload TUS direto para bucket privado;
- suporte documental/textual e gravação de áudio;
- transcrição revisável;
- áudio original preservado com hash, MIME, tamanho e proveniência;
- classificação autoral/externa e participação no Cérebro;
- cards navegáveis;
- download com nome da obra/arquivo;
- “Refletir com esta obra” integrado às Reflexões;
- tags livres opcionais;
- conceitos **confirmados** da Taxonomia oferecidos como tags inteligentes;
- IDs/códigos taxonômicos preservados em metadados;
- busca e exibição compacta de tags.

### Processamento

Concluído:
- extração de texto;
- estrutura/seções;
- chunking semântico;
- unidades de conhecimento;
- embeddings 1536d;
- busca híbrida FTS + vetorial;
- retries/compensações principais;
- persistência endurecida contra publicação parcial;
- sínteses cognitivas hierárquicas por seção e documento;
- tese central apenas quando sustentada;
- proveniência física das sínteses;
- isolamento das sínteses pelo documento correto;
- telemetria simulada removida;
- “Data de entrada na Biblioteca” usa a data real da obra.

### Taxonomia

Concluído:
- ownership por usuário;
- RLS nas tabelas fundacionais;
- conceitos, termos e relações isolados por usuário;
- motor automático integrado a documentos e Reflexões;
- conceitos propostos com evidência verificável;
- relações automáticas em estado de revisão;
- decisão humana antes de promoção ao mapa canônico;
- vínculo conceito ↔ fragmento e conceito ↔ Reflexão;
- análises idempotentes/auditáveis;
- integração com tags da Biblioteca.

Migrations aplicadas:
- `0025_taxonomia_isolamento_rls`;
- `0026_motor_taxonomia_automatica`;
- `0027_grants_propostas_atualizacao` (corrige permissão backend da fila de aprendizado autoral);
- `0028_dimensoes_canonicas_readonly` (protege o catálogo das 18 dimensões como leitura autenticada e escrita administrativa).

### Cérebro Autoral

Concluído:
- 18 dimensões canônicas e três Planos;
- características e regras derivadas de evidências reais;
- resumo com métricas do banco;
- versionamento;
- propostas de aprendizado derivadas de edição autoral;
- diff IA × autor;
- evidências “antes/depois”;
- confirmação/rejeição humana;
- somente aprendizados confirmados entram em dossiês futuros.

### Reflexões

Concluído:
- Wizard metodológico;
- fontes por texto, documento, link, Biblioteca e áudio;
- SSRF protection para links;
- buckets privados para fontes;
- comentário autoral por áudio;
- tema central derivado internamente;
- curadoria individual e “Incluir todas” para memórias;
- curadoria de conflitos sem apagar histórico;
- ausência de conflito sem conteúdo inventado;
- plano usa somente conflitos considerados;
- Auditoria antes da edição final;
- versionamento separado IA/autor;
- diff estruturado;
- aprovação soberana;
- redirecionamento pós-aprovação;
- cards integralmente navegáveis;
- Reflexões aprovadas podem alimentar a Taxonomia com revisão humana.

### Auditoria

Concluído:
- papel lógico independente da redação;
- dossiê de integridade;
- citações/evidências preservadas;
- origem das fontes verificável.

## 4. Estado do banco em 18/09/2026

Dados reais observados:
- 2 documentos processados;
- 12 seções;
- 38 fragmentos;
- 38 vetores;
- 87 evidências de dimensão;
- 3 execuções de processamento;
- 2 entradas de Reflexão;
- 2 versões de Reflexão;
- 65 características do Cérebro;
- 116 regras;
- Taxonomia automática disponível, porém ainda sem conceitos persistidos no corpus atual no momento da checagem;
- sínteses disponíveis no pipeline, porém a tabela ainda estava sem linhas no corpus já processado no momento da checagem — documentos antigos precisam ser reprocessados para materializar a nova etapa.

## 5. Segurança: estado reconciliado

### Resolvido

- `cerebro_autoral.dimensoes`: migration `0028_dimensoes_canonicas_readonly` aplicada; RLS ativo, leitura permitida a `authenticated`, escrita revogada de clientes e preservada para `service_role`.
- `cerebro_autoral.propostas_atualizacao`: migration `0027_grants_propostas_atualizacao` aplicada; `service_role` recuperou SELECT/INSERT/UPDATE/DELETE e `authenticated` permanece sem acesso direto.
- Taxonomia deixou de ter RLS desabilitado.
- Ownership e políticas foram aplicados antes da automação.
- Views taxonômicas usam `security_invoker`.
- Escrita de análises taxonômicas permanece backend-only.

### Pendente e deliberado

1. **Tabelas internas de Processamento com RLS ligado e sem policies diretas**
   - `processamento.elementos`;
   - `processamento.etapas_execucao`;
   - `processamento.evidencias`;
   - `processamento.sinteses`.
   - o modelo atual usa backend/service role para essas operações; sem policy, acesso direto do cliente autenticado é bloqueado.
   - não criar policies amplas apenas para eliminar o lint.

2. **Supabase Auth**
   - Leaked Password Protection continua desabilitado;
   - requer alteração de configuração do Auth; o conector atual não expõe ação para essa configuração.

3. **Performance**
   - advisor ainda aponta FKs sem índice e índices ainda não utilizados;
   - não remover/adicionar índices cegamente: priorizar queries reais e `EXPLAIN`/telemetria.

## 6. Frente atual: qualidade transversal

Próxima sequência:

1. reconciliar documentação canônica;
2. fechar decisão de RLS/read-only para `cerebro_autoral.dimensoes`;
3. habilitar proteção contra senhas vazadas no Supabase Auth por configuração apropriada;
4. E2E autenticado dos fluxos críticos;
5. acessibilidade e navegação por teclado;
6. responsividade;
7. regressão visual;
8. performance baseada em medições;
9. observabilidade;
10. proteção formal da `main`.

## 7. Regras de execução

- uma frente por vez;
- branches curtas;
- nenhuma migration aplicada sem entender ownership, políticas e impacto;
- todo PR precisa passar TypeScript, lint, testes e build;
- Preview Vercel deve estar READY;
- produção só é concluída com SHA reconciliado entre GitHub e Vercel;
- migrations aplicadas devem aparecer no histórico oficial do Supabase;
- não duplicar serviços já existentes;
- não transformar lints informativos em migrations automáticas sem entender o modelo de acesso;
- documentação precisa acompanhar o estado real da produção.
