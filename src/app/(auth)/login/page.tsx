"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Feather,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { fazerLogin, cadastrarConta } from "@/acoes/auth";

export default function PaginaLogin() {
  const router = useRouter();
  const [modo, setModo] = useState<"login" | "cadastro">("login");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Estados dos formulários
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [lembrarDeMim, setLembrarDeMim] = useState(true);

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setMensagemSucesso(null);

    if (modo === "cadastro") {
      if (!nome.trim()) {
        setErro("Por favor, informe seu nome completo.");
        return;
      }
      if (senha.length < 6) {
        setErro("A senha deve conter no mínimo 6 caracteres.");
        return;
      }
      if (senha !== confirmarSenha) {
        setErro("As senhas digitadas não coincidem.");
        return;
      }

      try {
        setCarregando(true);
        const res = await cadastrarConta({ nome, email, senha });
        if (!res.sucesso) {
          setErro(res.erro || "Falha ao cadastrar conta.");
          return;
        }

        setMensagemSucesso("Conta criada com sucesso! Entrando no seu ateliê...");
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1200);
      } catch (err: any) {
        setErro(err.message || "Erro inesperado ao criar conta.");
      } finally {
        setCarregando(false);
      }
    } else {
      try {
        setCarregando(true);
        const res = await fazerLogin({ email, senha });
        if (!res.sucesso) {
          setErro("E-mail ou senha incorretos. Verifique suas credenciais.");
          return;
        }

        router.push("/");
        router.refresh();
      } catch (err: any) {
        setErro(err.message || "Erro inesperado ao realizar login.");
      } finally {
        setCarregando(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 select-none">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/50 p-7 sm:p-9 space-y-7">
        {/* Logotipo & Cabeçalho Oficial */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30">
            <Feather className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-slate-900 tracking-tight">
            Memória Reflexiva
          </h1>
          <p className="text-xs text-slate-500 font-medium max-w-xs leading-relaxed">
            Seu acervo. Sua inteligência. Novas reflexões.
          </p>
        </div>

        {/* Alternador de Abas: Entrar vs Criar Conta */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setModo("login");
              setErro(null);
            }}
            className={`py-2 rounded-xl transition-all ${
              modo === "login"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setModo("cadastro");
              setErro(null);
            }}
            className={`py-2 rounded-xl transition-all ${
              modo === "cadastro"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Criar conta
          </button>
        </div>

        {/* Mensagens de Alerta */}
        {erro && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span className="leading-snug">{erro}</span>
          </div>
        )}

        {mensagemSucesso && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-700">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
            <span className="leading-snug">{mensagemSucesso}</span>
          </div>
        )}

        {/* Formulário de Acesso */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {modo === "cadastro" && (
            <div className="space-y-1.5">
              <label className="block font-medium text-slate-700">
                Nome completo
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Roberth Naninne"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-xs"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block font-medium text-slate-700">E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-medium text-slate-700">Senha</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={mostrarSenha ? "text" : "password"}
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-xs"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                title={mostrarSenha ? "Ocultar senha" : "Exibir senha"}
              >
                {mostrarSenha ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {modo === "cadastro" && (
            <div className="space-y-1.5">
              <label className="block font-medium text-slate-700">
                Confirmar senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={mostrarSenha ? "text" : "password"}
                  required
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-xs"
                />
              </div>
            </div>
          )}

          {modo === "login" && (
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lembrarDeMim}
                  onChange={(e) => setLembrarDeMim(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Lembrar de mim</span>
              </label>

              <button
                type="button"
                onClick={() =>
                  alert(
                    "Para recuperar sua senha, entre em contato com o suporte ou utilize a redefinição por e-mail."
                  )
                }
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Esqueceu sua senha?
              </button>
            </div>
          )}

          {/* Botão Principal Azul Royal */}
          <button
            type="submit"
            disabled={carregando}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 text-sm mt-2"
          >
            {carregando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processando...</span>
              </>
            ) : (
              <>
                <span>{modo === "login" ? "Entrar" : "Criar uma conta"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divisor "ou" */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-slate-200" />
          <span className="bg-white px-3 text-[11px] text-slate-400 uppercase tracking-wider font-mono absolute">
            ou
          </span>
        </div>

        {/* Botão Social Google */}
        <button
          type="button"
          onClick={() =>
            alert(
              "Login com Google será ativado mediante as credenciais OAuth do Google Cloud no Supabase Auth."
            )
          }
          className="w-full py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl transition-all flex items-center justify-center gap-2.5 text-xs shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continuar com Google</span>
        </button>

        {/* Rodapé com Alternador */}
        <div className="text-center pt-2">
          {modo === "login" ? (
            <button
              type="button"
              onClick={() => setModo("cadastro")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Não tem uma conta? Criar uma conta
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setModo("login")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Já possui uma conta? Fazer login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
