# Plano de Ação Canônico — Relato de Navegação

Atualizado em 18/09/2026.

Este plano deriva diretamente do relato de navegação do autor. A regra é:

> preservar o que foi aprovado + corrigir o que não corresponde à intenção + expandir apenas os pontos identificados como incompletos.

A fonte de verdade operacional é o estado real do repositório, Supabase e produção. Este documento registra o checklist funcional para impedir perda de contexto.

## Estado reconciliado

Base atual de produção: `5a21aea3134507e3aa8460b21b1a3cebbcd05449`.

A implementação `89bdf1f3fc859d3039daa060b808e09a3a38867d` consolidou integridade/proveniência de fontes, curadoria em massa de memórias, ordem Auditor → Texto, edição autoral com preservação da versão da IA e remoção de fallbacks reais de configuração do Supabase. A migration `0024_versionamento_edicao_autoral_reflexoes` já está aplicada no Supabase.

A implementação `72d909943bcb3dbdc0b28ac345c1f79f9ad730c0` fechou a curadoria de conflitos sem apagar histórico e tornou os cards de Reflexão integralmente navegáveis. A implementação `5a21aea3134507e3aa8460b21b1a3cebbcd05449` adicionou o diff estruturado IA × autor e está em produção com CI verde.

## Checklist do relato

| Área | Estado | Observação atual |
|---|---|---|
| Tipografia de leitura | Concluído | Escala global e fontes de leitura revisadas. |
| Home / slogan | Concluído | Mantém saudação e usa “Transforme memórias em reflexões.” |
| Biblioteca / áudio | Concluído | Gravação, transcrição revisável e fonte original preservada. |
| Tags inteligentes | Aberto | Campo ainda é texto livre; precisa consumir Taxonomia real. |
| Card da Biblioteca | Concluído | Superfície principal clicável; ações internas preservadas. |
| Modal/fragmentos | Concluído parcialmente | Fluxo funcional; manter revisão visual no QA geral. |
| Download | Concluído | Nome de download passou a respeitar a obra/arquivo. |
| Sínteses cognitivas | Aberto | `processamento.sinteses` ainda não possui etapa real no pipeline. |
| Data de entrada | Concluído | Terminologia alinhada ao significado real. |
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
| Aprendizado autoral | Concluído nesta branch | O diff gera apenas propostas sustentadas; o autor confirma/rejeita no Cérebro e somente aprendizados confirmados entram nos dossiês futuros. |
| Aprovação soberana | Concluído | Bloco de aprovação ganhou destaque e conclui a reflexão. |
| Pós-aprovação | Concluído | Redireciona para Minhas Reflexões. |
| Card de Reflexão | Concluído em produção | Toda a superfície do card navega para o Estúdio, com foco acessível. |
| Cérebro / métricas | Concluído | View/resumo corrigidos para refletir dados reais. |
| Taxonomia automática | Aberto | UI ainda depende de cadastro manual; conceitos/relações continuam sem motor automático. |
| Segurança Taxonomia/RLS | Aberto controlado | Não habilitar RLS cegamente; desenhar políticas coerentes antes da migration. |

## Ordem de execução a partir daqui

1. Concluir e validar o aprendizado autoral revisável desta branch.
2. Criar etapa real de sínteses cognitivas no pipeline.
3. Construir motor taxonômico automático integrado a documentos e reflexões.
4. Usar a Taxonomia como fonte das sugestões de tags na Biblioteca.
5. Revisar RLS da Taxonomia com políticas explícitas e testes negativos.
6. QA transversal: responsividade, acessibilidade, regressão visual, performance e E2E dos fluxos críticos.

## Guardrails

- Não reconstruir o aplicativo.
- Não trocar Next.js, Supabase, Vercel ou arquitetura existente sem evidência concreta.
- Não criar métricas, conceitos, sínteses ou regras fictícias.
- Não promover automaticamente uma edição do autor a “regra metodológica”; primeiro registrar evidência, depois propor e exigir validação.
- Não habilitar RLS sem políticas adequadas.
- Não considerar uma mudança concluída sem CI e verificação do estado real de produção.
