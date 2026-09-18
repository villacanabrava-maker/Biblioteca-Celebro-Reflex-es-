"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Pause, Play, Square, RotateCcw, AlertCircle } from "lucide-react";

interface Props {
  onArquivoPronto: (arquivo: File | null) => void;
  desabilitado?: boolean;
}

type EstadoGravacao = "ocioso" | "gravando" | "pausado" | "pronto";

function escolherMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidatos = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ];
  return candidatos.find((tipo) => MediaRecorder.isTypeSupported(tipo)) || "";
}

function extensaoPorMime(mime: string): string {
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("wav")) return "wav";
  return "webm";
}

function formatarTempo(segundos: number): string {
  const minutos = Math.floor(segundos / 60).toString().padStart(2, "0");
  const resto = (segundos % 60).toString().padStart(2, "0");
  return `${minutos}:${resto}`;
}

export function GravadorAudio({ onArquivoPronto, desabilitado = false }: Props) {
  const gravadorRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const partesRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [estado, setEstado] = useState<EstadoGravacao>("ocioso");
  const [segundos, setSegundos] = useState(0);
  const [urlAudio, setUrlAudio] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  function pararTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function encerrarStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function limparUrl() {
    setUrlAudio((urlAtual) => {
      if (urlAtual) URL.revokeObjectURL(urlAtual);
      return null;
    });
  }

  function limpar() {
    pararTimer();
    if (gravadorRef.current?.state === "recording" || gravadorRef.current?.state === "paused") {
      gravadorRef.current.stop();
    }
    encerrarStream();
    partesRef.current = [];
    gravadorRef.current = null;
    limparUrl();
    setSegundos(0);
    setEstado("ocioso");
    setErro(null);
    onArquivoPronto(null);
  }

  useEffect(() => {
    return () => {
      pararTimer();
      encerrarStream();
      if (urlAudio) URL.revokeObjectURL(urlAudio);
    };
  }, [urlAudio]);

  async function iniciar() {
    if (desabilitado) return;

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setErro("Este navegador não oferece gravação de áudio compatível.");
      return;
    }

    try {
      limparUrl();
      setErro(null);
      setSegundos(0);
      partesRef.current = [];
      onArquivoPronto(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = escolherMimeType();
      const gravador = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      gravadorRef.current = gravador;

      gravador.ondataavailable = (evento) => {
        if (evento.data.size > 0) partesRef.current.push(evento.data);
      };

      gravador.onstop = () => {
        pararTimer();
        encerrarStream();

        const tipoFinal = gravador.mimeType || mimeType || "audio/webm";
        const blob = new Blob(partesRef.current, { type: tipoFinal });
        partesRef.current = [];

        if (!blob.size) {
          setErro("A gravação terminou sem dados de áudio.");
          setEstado("ocioso");
          return;
        }

        const extensao = extensaoPorMime(tipoFinal);
        const arquivo = new File(
          [blob],
          `gravacao-reflexao-${new Date().toISOString().replace(/[:.]/g, "-")}.${extensao}`,
          { type: tipoFinal }
        );

        const url = URL.createObjectURL(blob);
        setUrlAudio(url);
        setEstado("pronto");
        onArquivoPronto(arquivo);
      };

      gravador.start(1000);
      setEstado("gravando");
      timerRef.current = setInterval(() => setSegundos((atual) => atual + 1), 1000);
    } catch (error) {
      encerrarStream();
      const mensagem =
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "Permissão de microfone negada. Autorize o acesso ao microfone para gravar."
          : "Não foi possível iniciar a gravação de áudio.";
      setErro(mensagem);
      setEstado("ocioso");
    }
  }

  function pausarOuRetomar() {
    const gravador = gravadorRef.current;
    if (!gravador) return;

    if (gravador.state === "recording") {
      gravador.pause();
      pararTimer();
      setEstado("pausado");
      return;
    }

    if (gravador.state === "paused") {
      gravador.resume();
      timerRef.current = setInterval(() => setSegundos((atual) => atual + 1), 1000);
      setEstado("gravando");
    }
  }

  function finalizar() {
    const gravador = gravadorRef.current;
    if (gravador && (gravador.state === "recording" || gravador.state === "paused")) {
      gravador.stop();
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-900">Gravação de áudio</p>
          <p className="mt-1 text-xs text-slate-500">
            Grave sua fala, revise a transcrição e preserve o áudio original como fonte.
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-sm font-mono font-bold text-slate-700 shadow-sm">
          {formatarTempo(segundos)}
        </span>
      </div>

      {erro && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {estado === "ocioso" && (
          <button
            type="button"
            onClick={() => void iniciar()}
            disabled={desabilitado}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            <Mic className="h-4 w-4" />
            Iniciar gravação
          </button>
        )}

        {(estado === "gravando" || estado === "pausado") && (
          <>
            <button
              type="button"
              onClick={pausarOuRetomar}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              {estado === "gravando" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {estado === "gravando" ? "Pausar" : "Retomar"}
            </button>
            <button
              type="button"
              onClick={finalizar}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-black"
            >
              <Square className="h-4 w-4" />
              Finalizar
            </button>
          </>
        )}

        {estado === "pronto" && (
          <button
            type="button"
            onClick={limpar}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <RotateCcw className="h-4 w-4" />
            Gravar novamente
          </button>
        )}
      </div>

      {urlAudio && (
        <audio controls preload="metadata" src={urlAudio} className="w-full" />
      )}
    </div>
  );
}
