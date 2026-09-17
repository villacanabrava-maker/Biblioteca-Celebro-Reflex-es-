# Adendo de Decisões Arquiteturais — Fase 3

Este arquivo é continuação de `docs/DECISOES.md` e preserva integralmente os ADRs 001–067. Ele existe para registrar as decisões produzidas na auditoria de handoff sem reescrever retrospectivamente o histórico anterior. Em uma consolidação documental futura, estes ADRs podem ser incorporados ao arquivo principal preservando exatamente seu sentido e numeração.

---

## ADR-068 — Fragmentação PDF usa offset intrapágina como fronteira de conteúdo

**Contexto:** `identificar_estrutura` já registrava `indice_inicio` relativo à página PDF, mas `criar_hierarquia` descartava esse dado e persistia apenas `pagina_inicial`/`pagina_final`. A auditoria encontrou dois cenários incorretos: duas seções iniciadas na mesma página podiam reutilizar o mesmo texto, e uma seção que terminasse na página em que a próxima começava no meio podia perder o prefixo da página anterior ao novo título.

**Decisão:** a migration `0028_offsets_pdf_fragmentacao` adiciona `processamento.secoes.offset_pagina_inicio`, preserva o offset detectado dentro da página e o expõe na RPC server-only de listagem de seções. `criar_fragmentos` passa a recortar PDF por `(pagina, offset)`: começa no offset da seção atual e, na página-limite, termina exatamente no offset da próxima seção.

**Consequência:** o texto próprio da seção não é duplicado quando dois títulos coexistem na mesma página e não perde o conteúdo anterior ao próximo título quando ele aparece no meio da página seguinte. A decisão é protegida por testes de regressão específicos.

## ADR-069 — Replay de `criar_fragmentos` revalida artefato e resultado persistido

**Contexto:** a primeira implementação retornava sucesso imediatamente quando `backend_iniciar_etapa` informava `deve_executar = false`. Isso aceitava o estado da máquina como prova suficiente, sem revalidar os bytes de `conteudo_normalizado` nem confirmar que os fragmentos persistidos continuavam iguais ao resultado determinístico que a etapa produziria.

**Decisão:** todo replay de `criar_fragmentos` deve: (1) reobter contexto; (2) revalidar `conteudo_normalizado` por MIME, limite, SHA-256, tamanho, schema e proveniência; (3) reler seções; (4) recalcular deterministicamente os fragmentos esperados; (5) reler os fragmentos persistidos pela RPC `aplicacao.backend_listar_fragmentos_documento`, criada em `0029_listagem_fragmentos_replay`; e (6) comparar seção, código, ordem, páginas, conteúdo, conteúdo contextualizado e estimativa de tokens. A execução normal também relê/compara o resultado depois da gravação, antes de concluir a etapa.

**Consequência:** estado persistido deixa de ser tratado como prova de integridade. Corrupção, ausência ou divergência em replay vira falha determinística, em vez de sucesso falso. A RPC de leitura permanece `SECURITY DEFINER`, `search_path = ''`, sem `EXECUTE` para `public`/`anon`/`authenticated` e com grant apenas para `service_role`.

## ADR-070 — WIP de IA antigo não é migration oficial e deve ser reconstruído após `0029`

**Contexto:** a branch externa `claude/confident-cannon-ovdoev` contém um commit WIP (`0b9d739...`) com um arquivo local chamado `0028_ia_sinteses_secao`. Esse arquivo nunca foi validado com `BEGIN ... ROLLBACK`, nunca foi aplicado ao Supabase e não foi integrado ao workflow. Durante a auditoria, o número oficial `0028` foi legitimamente ocupado por `0028_offsets_pdf_fragmentacao`, e `0029` criou uma RPC `backend_listar_fragmentos_documento` cuja assinatura conflita com a redefinição existente no WIP. O WIP também usa `gpt-5.5` como placeholder não revalidado contra a documentação oficial atual.

**Decisão:** o WIP de IA não será cherry-picked, aplicado ou considerado etapa concluída. Ele pode servir apenas como referência conceitual. `criar_sinteses` será reconstruída em branch nova a partir da `main` consolidada, com migration numerada depois de `0029`, modelo reavaliado pela documentação oficial atual da OpenAI, testes com cliente falso/injetado, SQL validado no banco real em transação revertida e integração explícita ao Workflow.

**Consequência:** a camada cognitiva começa sobre uma base determinística coerente, sem colisão de migrations/RPCs e sem herdar uma escolha de modelo ou contrato de API não validado. A primeira chamada paga à OpenAI continua exigindo confirmação explícita do proprietário.