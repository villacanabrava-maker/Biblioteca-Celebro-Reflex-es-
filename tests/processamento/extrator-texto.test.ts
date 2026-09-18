import { describe, expect, it } from "vitest";
import { extrairTextoDeBuffer } from "../../src/dominios/processamento/extrator-texto";

const MIME_DOCX =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

describe("Extração DOCX resiliente", () => {
  it("não lança RangeError para cabeçalho ZIP truncado", async () => {
    const bufferTruncado = Buffer.from([
      0x50, 0x4b, 0x03, 0x04,
      0x14, 0x00, 0x00, 0x00,
      0x08, 0x00,
    ]);

    await expect(
      extrairTextoDeBuffer(bufferTruncado, MIME_DOCX, "truncado.docx")
    ).resolves.toMatchObject({
      textoCompleto: "",
      totalPalavras: 0,
    });
  });

  it("ignora entrada ZIP cujo nome ou conteúdo extrapola o tamanho do buffer", async () => {
    const bufferMalformado = Buffer.alloc(30);
    bufferMalformado.writeUInt32LE(0x04034b50, 0);
    bufferMalformado.writeUInt16LE(8, 8);
    bufferMalformado.writeUInt32LE(1024, 18);
    bufferMalformado.writeUInt16LE(500, 26);
    bufferMalformado.writeUInt16LE(0, 28);

    await expect(
      extrairTextoDeBuffer(bufferMalformado, MIME_DOCX, "malformado.docx")
    ).resolves.toMatchObject({
      textoCompleto: "",
      totalPalavras: 0,
    });
  });
});
