# Decisões Arquiteturais — continuação ADR-068 a ADR-070

Este arquivo continua `docs/DECISOES.md` sem reescrever os ADRs 001–067. Ele foi criado durante a sincronização pós-merge da Fase 3 para registrar decisões já implementadas/auditadas no PR #14. Em futura consolidação documental, estes ADRs podem ser anexados ao arquivo mestre **sem alterar seu conteúdo ou numeração**.

## ADR-068 — Fragmentação PDF usa offset intrapágina; intervalo de páginas continua sendo metadado estrutural

**Contexto:** o ADR-062 definiu `pagina_inicial`/`pagina_final` como aproximação estrutural por página. Isso é suficiente para navegação, mas não para recortar o texto próprio de uma seção quando dois títulos começam na mesma página ou quando a próxima seção começa no meio da página seguinte. A implementação que usava apenas número de página podia duplicar o conteúdo da seção seguinte ou descartar o prefixo da página que ainda pertencia à seção anterior.

**Decisão:** a migration `0028_offsets_pdf_fragmentacao` adiciona `processamento.secoes.offset_pagina_inicio`. `identificar_estrutura` já mede o índice do título dentro do texto da página; `criar_hierarquia` preserva esse offset e `criar_fragmentos` usa a combinação `pagina_inicial + offset_pagina_inicio` da seção atual e da próxima seção para calcular o recorte determinístico. `pagina_final` permanece como metadado da extensão estrutural da subárvore e não volta a ser usado como fronteira textual exclusiva.

**Consequência:** duas seções podem começar na mesma página sem compartilhar o mesmo trecho; quando a seção seguinte começa no meio da página seguinte, o texto anterior ao título continua pertencendo corretamente à seção atual. Testes de regressão cobrem os dois cenários.

## ADR-069 — Replay de `criar_fragmentos` revalida o resultado determinístico completo

**Contexto:** uma etapa durável pode ser reexecutada depois de a máquina de estados já ter avançado. A primeira implementação de `criar_fragmentos` podia aceitar esse replay como sucesso somente porque `backend_iniciar_etapa` informava que a etapa não deveria executar novamente. Isso não provava que o artefato normalizado continuava íntegro nem que os fragmentos persistidos ainda correspondiam ao resultado determinístico esperado.

**Decisão:** o replay não retorna sucesso antecipadamente. O step revalida `conteudo_normalizado` por MIME, limite, SHA-256, tamanho, schema e proveniência; relê as seções; recalcula os fragmentos com a mesma função pura usada na execução normal; lê os fragmentos persistidos por `aplicacao.backend_listar_fragmentos_documento` (migration `0029_listagem_fragmentos_replay`, `SECURITY DEFINER`, `search_path=''`, executável apenas pelo backend); e compara deterministicamente seção, código, ordem, páginas, conteúdo, conteúdo contextualizado e estimativa de tokens. A execução normal também compara o que foi persistido antes de concluir a etapa.

**Consequência:** estado de workflow não é tratado como prova de integridade. Fragmento ausente, extra, alterado ou associado de modo divergente causa falha explícita em vez de um falso sucesso de replay.

## ADR-070 — O WIP antigo de sínteses não é base de merge; a IA será reconstruída após `0029`

**Contexto:** a branch externa `claude/confident-cannon-ovdoev` continha um rascunho `0028_ia_sinteses_secao` que nunca foi aplicado ao Supabase oficial, nunca passou pela validação completa do projeto e foi escrito antes das correções `0028/0029`. O rascunho usa o número `0028`, hoje oficialmente ocupado por `0028_offsets_pdf_fragmentacao`, redefine `backend_listar_fragmentos_documento` com assinatura incompatível com a RPC oficial `0029`, usa `gpt-5.5` como placeholder e não possui integração completa ao workflow nem suíte de testes suficiente.

**Decisão:** não fazer merge/cherry-pick desse WIP. A etapa `criar_sinteses` nascerá em uma branch nova criada a partir da `main` consolidada após o PR #14. Qualquer migration de IA será numerada depois de `0029`; o SQL será validado em transação revertida contra o Supabase oficial antes de `apply_migration`; modelos OpenAI serão escolhidos a partir da documentação oficial atual e centralizados por `MODELO_IA_*`, não congelados a partir de placeholders antigos; chamadas usarão Responses API, Structured Outputs/JSON Schema, validação Zod e `store:false` para o conteúdo privado do projeto.

**Consequência:** o primeiro componente cognitivo será construído sobre a base determinística já auditada, sem colisão de migration/RPC e sem transformar código experimental antigo em contrato de produção. A primeira chamada real paga à OpenAI permanece um marco separado de validação do proprietário.