"use client";

import { useEffect, useRef } from "react";

const SELETOR_FOCAVEL = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function obterElementosFocaveis(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(SELETOR_FOCAVEL)
  ).filter((elemento) => {
    const estilo = window.getComputedStyle(elemento);
    return (
      !elemento.hasAttribute("disabled") &&
      elemento.getAttribute("aria-hidden") !== "true" &&
      estilo.display !== "none" &&
      estilo.visibility !== "hidden"
    );
  });
}

export function useDialogModalAcessivel({
  aberto,
  aoFechar,
  bloqueado = false,
}: {
  aberto: boolean;
  aoFechar: () => void | Promise<void>;
  bloqueado?: boolean;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const aoFecharRef = useRef(aoFechar);
  const bloqueadoRef = useRef(bloqueado);

  useEffect(() => {
    aoFecharRef.current = aoFechar;
  }, [aoFechar]);

  useEffect(() => {
    bloqueadoRef.current = bloqueado;
  }, [bloqueado]);

  useEffect(() => {
    if (!aberto) return;

    const focoAnterior =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const frame = window.requestAnimationFrame(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;

      const focoInicial =
        dialog.querySelector<HTMLElement>("[data-dialog-initial-focus]") ||
        obterElementosFocaveis(dialog)[0] ||
        dialog;

      focoInicial.focus();
    });

    function lidarTecla(evento: KeyboardEvent) {
      const dialog = dialogRef.current;
      if (!dialog) return;

      if (evento.key === "Escape" && !bloqueadoRef.current) {
        evento.preventDefault();
        void aoFecharRef.current();
        return;
      }

      if (evento.key !== "Tab") return;

      const focaveis = obterElementosFocaveis(dialog);
      if (focaveis.length === 0) {
        evento.preventDefault();
        dialog.focus();
        return;
      }

      const ativo =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      const indiceAtivo = ativo ? focaveis.indexOf(ativo) : -1;

      if (indiceAtivo === -1) {
        evento.preventDefault();
        (evento.shiftKey ? focaveis[focaveis.length - 1] : focaveis[0]).focus();
        return;
      }

      if (evento.shiftKey && indiceAtivo === 0) {
        evento.preventDefault();
        focaveis[focaveis.length - 1].focus();
      } else if (!evento.shiftKey && indiceAtivo === focaveis.length - 1) {
        evento.preventDefault();
        focaveis[0].focus();
      }
    }

    document.addEventListener("keydown", lidarTecla);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", lidarTecla);
      document.body.style.overflow = overflowAnterior;

      window.requestAnimationFrame(() => {
        if (focoAnterior?.isConnected) {
          focoAnterior.focus();
        }
      });
    };
  }, [aberto]);

  return dialogRef;
}
