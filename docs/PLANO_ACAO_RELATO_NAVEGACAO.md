# Plano de Ação Canônico — Relato de Navegação

Atualizado em 18/09/2026.

Este plano deriva diretamente do relato de navegação do autor. A regra é:

> preservar o que foi aprovado + corrigir o que não corresponde à intenção + expandir apenas os pontos identificados como incompletos.

A fonte de verdade operacional é o estado real do repositório, Supabase e produção. Este documento registra o checklist funcional para impedir perda de contexto.

## Estado reconciliado

Base atual de produção: `13178edcd67ceca76425938962d3f723975b18c9`.

A implementação `89bdf1f3fc859d3039daa060b808e09a3a38867d` consolidou integridade/proveniência de fontes, curadoria em massa de memórias, ordem Auditor → Texto, edição autoral com preservação da versão da IA e remoção de fallbacks reais de configuração do Supabase. A migration `0024_versionamento_edicao_autoral_reflexoes` já está aplicada no Supabase.

A implementação `72d909943bcb3dbdc0b28ac345c1f79f9ad730c0` fechou a curadoria de conflitos sem apagar histórico e tornou os cards de Reflexão integralmente navegáveis. A implementação `5a21aea3134507e3aa8460b21b1a3cebbcd05449` adicionou o diff estruturado IA × autor e está em produção com CI verde.

## Checklist do relato

| Área | Estado | Observação atual |
|---|---|---|
| Tipografia de leitura | Concluído | Escala global e fontes de leitura revisadas. |
| Home / slogan | Concluído | Mantém saudação e usa “Transforme memórias em reflexões.” |
| Biblioteca / áudio | Concluído | Gravação, transcrição revisável e fonte original preservada. |
| Tags inteligentes | Em validação nesta branch | Biblioteca recebe apenas conceitos confirmados da Taxonomia como sugestões, preserva IDs/códigos no metadado e mantém tags livres opcionais. |
| Card da Biblioteca | Concluído | Superfície principal clicável; ações internas preservadas. |
| Modal/fragmentos | Concluído parcialmente | Fluxo funcional; manter revisão visual no QA geral. |
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

## Ordem de execução a partir daqui

1. Validar as tags inteligentes da Biblioteca desta branch.
2. Revisar segurança remanescente do Processamento e habilitar proteção de senhas vazadas no Supabase Auth.
3. QA transversal: responsividade, acessibilidade, regressão visual, performance e E2E dos fluxos críticos.

## Guardrails

- Não reconstruir o aplicativo.
- Não trocar Next.js, Supabase, Vercel ou arquitetura existente sem evidência concreta.
- Não criar métricas, conceitos, sínteses ou regras fictícias.
- Não promover automaticamente uma edição do autor a “regra metodológica”; primeiro registrar evidência, depois propor e exigir validação.
- Não promover conceito ou relação sugeridos por IA ao mapa canônico sem decisão explícita do autor.
- Não habilitar RLS sem políticas adequadas.
- Não considerar uma mudança concluída sem CI e verificação do estado real de produção.
- Não apresentar percentuais, custos ou etapas intermediárias simuladas como se fossem telemetria real.
