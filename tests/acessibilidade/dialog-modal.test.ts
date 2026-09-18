/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { obterElementosFocaveis } from "@/componentes/comum/use-dialog-modal-acessivel";

describe("infraestrutura de dialogos acessiveis", () => {
  it("mantem apenas controles realmente focaveis na ordem do dialogo", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <button id="primeiro">Primeiro</button>
      <button id="desabilitado" disabled>Desabilitado</button>
      <a id="link" href="/destino">Destino</a>
      <input id="oculto" style="display:none" />
      <button id="aria-oculto" aria-hidden="true">Oculto</button>
      <div id="tab-negativo" tabindex="-1">Título</div>
      <textarea id="ultimo"></textarea>
    `;
    document.body.appendChild(container);

    const ids = obterElementosFocaveis(container).map((elemento) => elemento.id);

    expect(ids).toEqual(["primeiro", "link", "ultimo"]);
    container.remove();
  });

  it("ignora controles escondidos por visibility", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <button id="visivel">Visível</button>
      <button id="invisivel" style="visibility:hidden">Invisível</button>
    `;
    document.body.appendChild(container);

    const ids = obterElementosFocaveis(container).map((elemento) => elemento.id);

    expect(ids).toEqual(["visivel"]);
    container.remove();
  });
});
