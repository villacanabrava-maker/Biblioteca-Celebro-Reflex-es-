# Plano de Ação Canônico — Relato de Navegação

Atualizado em 18/09/2026.

Este plano deriva diretamente do relato de navegação do autor. A regra é:

> preservar o que foi aprovado + corrigir o que não corresponde à intenção + expandir apenas os pontos identificados como incompletos.

A fonte de verdade operacional é o estado real do repositório, Supabase e produção. Este documento registra o checklist funcional para impedir perda de contexto.

## Estado reconciliado

Base atual de produção: `b29d5ef6edc252035dc6a6610691c7517df5a261`.

A implementação `89bdf1f3fc859d3039daa060b808e09a3a38867d` consolidou integridade/proveniência de fontes, curadoria em massa de memórias, ordem Auditor → Texto, edição autoral com preservação da versão da IA e remoção de fallbacks reais de configuração do Supabase. A migration `0024_versionamento_edicao_autoral_reflexoes` já está aplicada no Supabase.

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
| Conflitos | Concluído nesta branch | O autor pode considerar/ignorar tensões no plano; o histórico completo permanece salvo. |
| Ordem Auditoria → Texto | Concluído | Estúdio prioriza auditoria antes da edição final. |
| Edição da reflexão | Concluído parcialmente | IA e edição humana são versões distintas; falta diff estruturado. |
| Aprendizado autoral | Aberto | Falta transformar diferenças de edição em sinais/regras verificáveis. |
| Aprovação soberana | Concluído | Bloco de aprovação ganhou destaque e conclui a reflexão. |
| Pós-aprovação | Concluído | Redireciona para Minhas Reflexões. |
| Card de Reflexão | Concluído nesta branch | Toda a superfície do card navega para o Estúdio, com foco acessível. |
| Cérebro / métricas | Concluído | View/resumo corrigidos para refletir dados reais. |
| Taxonomia automática | Aberto | UI ainda depende de cadastro manual; conceitos/relações continuam sem motor automático. |
| Segurança Taxonomia/RLS | Aberto controlado | Não habilitar RLS cegamente; desenhar políticas coerentes antes da migration. |

## Ordem de execução a partir daqui

1. Fechar curadoria de conflitos sem apagar o histórico detectado.
2. Tornar o card de Reflexão integralmente navegável.
3. Criar diff estruturado entre versão IA e versão editada pelo autor.
4. Definir sinais de aprendizado autoral derivados do diff, sem promover regras automaticamente.
5. Criar etapa real de sínteses cognitivas no pipeline.
6. Construir motor taxonômico automático integrado a documentos e reflexões.
7. Usar a Taxonomia como fonte das sugestões de tags na Biblioteca.
8. Revisar RLS da Taxonomia com políticas explícitas e testes negativos.
9. QA transversal: responsividade, acessibilidade, regressão visual, performance e E2E dos fluxos críticos.

## Guardrails

- Não reconstruir o aplicativo.
- Não trocar Next.js, Supabase, Vercel ou arquitetura existente sem evidência concreta.
- Não criar métricas, conceitos, sínteses ou regras fictícias.
- Não promover automaticamente uma edição do autor a “regra metodológica”; primeiro registrar evidência, depois propor e exigir validação.
- Não habilitar RLS sem políticas adequadas.
- Não considerar uma mudança concluída sem CI e verificação do estado real de produção.
