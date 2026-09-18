# Plano de Ação Canônico — Relato de Navegação

Atualizado em 18/09/2026.

Este plano deriva diretamente do relato de navegação do autor. A regra é:

> preservar o que foi aprovado + corrigir o que não corresponde à intenção + expandir apenas os pontos identificados como incompletos.

A fonte de verdade operacional é o estado real do repositório, Supabase e produção. Este documento registra o checklist funcional para impedir perda de contexto.

## Estado reconciliado

A produção canônica acompanha `main`; cada frente só é considerada concluída quando GitHub Actions e Vercel confirmam o mesmo código com gates verdes. O plano não fixa mais um SHA antigo como “base atual”, pois isso ficava obsoleto no merge seguinte.

A implementação `89bdf1f3fc859d3039daa060b808e09a3a38867d` consolidou integridade/proveniência de fontes, curadoria em massa de memórias, ordem Auditor → Texto, edição autoral com preservação da versão da IA e remoção de fallbacks reais de configuração do Supabase. A migration `0024_versionamento_edicao_autoral_reflexoes` já está aplicada no Supabase.

A implementação `72d909943bcb3dbdc0b28ac345c1f79f9ad730c0` fechou a curadoria de conflitos sem apagar histórico e tornou os cards de Reflexão integralmente navegáveis. A implementação `5a21aea3134507e3aa8460b21b1a3cebbcd05449` adicionou o diff estruturado IA × autor e está em produção com CI verde.

## Checklist do relato

| Área | Estado | Observação atual |
|---|---|---|
| Tipografia de leitura | Concluído | Escala global e fontes de leitura revisadas. |
| Home / slogan | Concluído | Mantém saudação e usa “Transforme memórias em reflexões.” |
| Biblioteca / áudio | Concluído | Gravação, transcrição revisável e fonte original preservada. |
| Tags inteligentes | Concluído em produção | Biblioteca recebe apenas conceitos confirmados da Taxonomia como sugestões, preserva IDs/códigos no metadado, mantém tags livres opcionais e permite busca pelas tags. |
| Card da Biblioteca | Em validação nesta branch | Mantém a superfície inteira clicável com link HTML nativo, elimina o `div role="link"` com interações aninhadas, preserva ações internas e melhora reflow/alvos de toque. |
| Modal/fragmentos | Concluído parcialmente | Modais principais já receberam semântica ARIA, foco/teclado, retorno de foco e reflow; a revisão visual específica de fragmentos permanece no QA geral. |
| Download | Concluído | Nome de download passou a respeitar a obra/arquivo. |
| Sínteses cognitivas | Concluído em produção | Pipeline gera sínteses hierárquicas por seção e documento, com proveniência física, tese central somente quando sustentada e leitura isolada por documento. |
| Data de entrada | Concluído em produção | Dossiê de Auditoria usa a data real de criação da obra na Biblioteca, não a data técnica de publicação do processamento. |
| “Refletir com esta obra” | Concluído | `fonteId` é consumido e a obra entra como fonte canônica. |
| Reflexão por documento | Concluído | Upload privado, extração e conteúdo revisável. |
| Reflexão por link | Concluído | Extração segura, proveniência e fallback textual. |
| Reflexão por áudio | Concluído | Upload privado, transcrição e original preservado. |
| Texto colado: título/autor | Concluído | Metadados opcionais disponíveis. |
| Comentário por áudio | Concluído | Áudio e transcrição preservados. |
| Tema central no formulário | Concluído | Derivado internamente; não é exigido do usuário. |
| Memórias / “Incluir todas” | Concluído | Curadoria individual + seleção em massa. |
| Conflitos | Concluído em produção | O autor pode considerar/ignorar tensões no plano; o histórico completo permanece salvo. |
| Ordem Auditoria → Texto | Concluído | Estúdio prioriza auditoria antes da edição final. |
| Edição da reflexão | Concluído em produção | IA e edição humana permanecem versões distintas e a edição autoral possui diff estruturado, métricas e comparação com a versão-base. |
| Aprendizado autoral | Concluído em produção | O diff gera apenas propostas sustentadas; o autor confirma/rejeita no Cérebro e somente aprendizados confirmados entram nos dossiês futuros. |
| Aprovação soberana | Concluído | Bloco de aprovação ganhou destaque e conclui a reflexão. |
| Pós-aprovação | Concluído | Redireciona para Minhas Reflexões. |
| Card de Reflexão | Concluído em produção | Toda a superfície do card navega para o Estúdio, com foco acessível. |
| Cérebro / métricas | Concluído | View/resumo corrigidos para refletir dados reais. |
| Taxonomia automática | Concluído em produção | Documentos e reflexões aprovadas geram conceitos com evidência verificável; nós e relações de IA exigem confirmação humana antes de entrar no mapa canônico. |
| Segurança Taxonomia/RLS | Concluído em produção | Migration 0025 aplicada: ownership por usuário, RLS coerente e vínculos protegidos. |

## Correção de produção descoberta no QA

- `cerebro_autoral.propostas_atualizacao` estava sem privilégios de tabela para `service_role`, causando `permission denied` ao abrir o Cérebro.
- Migration `0027_grants_propostas_atualizacao` aplicada e verificada.
- O acesso direto de `authenticated` permaneceu revogado.

## Segurança do catálogo canônico do Cérebro

- Migration `0028_dimensoes_canonicas_readonly` aplicada e verificada.
- As 18 dimensões permanecem globais e imutáveis para clientes.
- `authenticated` possui somente SELECT.
- `anon` não possui acesso.
- `service_role` mantém escrita administrativa para backend/migrations.
- Views do Cérebro permanecem com `security_invoker=true`.

## Auth no plano atual

- A documentação atual do Supabase informa que Leaked Password Protection exige Pro+.
- Enquanto o projeto permanecer no Supabase Free, esse alerta do advisor é uma limitação conhecida.
- O cadastro do Rflex01 passa a impor validação também no servidor, com e-mail válido, nome não vazio e senha mínima de 8 caracteres.
- Usuários existentes não têm o login afetado pela nova regra de cadastro.

## QA transversal já executado

- cadastro endurecido no servidor sem quebrar login existente;
- middleware sem bypass amplo de rotas públicas;
- testes automatizados de sessão e proteção de rotas;
- diálogos principais com padrão modal acessível;
- labels/campos principais associados programaticamente;
- navegação com página atual e foco visível;
- reflow dos modais em telas pequenas.

## Ordem de execução a partir daqui

1. concluir semântica/responsividade do card da Biblioteca;
2. revisar responsividade e regressão visual das páginas/cards restantes;
3. preparar E2E autenticado sem credenciais no código;
4. medir performance e observabilidade antes de alterações estruturais;
5. proteção formal da branch `main` quando houver acesso administrativo compatível.

## Guardrails

- Não reconstruir o aplicativo.
- Não trocar Next.js, Supabase, Vercel ou arquitetura existente sem evidência concreta.
- Não criar métricas, conceitos, sínteses ou regras fictícias.
- Não promover automaticamente uma edição do autor a “regra metodológica”; primeiro registrar evidência, depois propor e exigir validação.
- Não promover conceito ou relação sugeridos por IA ao mapa canônico sem decisão explícita do autor.
- Não habilitar RLS sem políticas adequadas.
- Não considerar uma mudança concluída sem CI e verificação do estado real de produção.
- Não apresentar percentuais, custos ou etapas intermediárias simuladas como se fossem telemetria real.
