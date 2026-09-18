"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
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

        if (res.requerLoginManual) {
          setMensagemSucesso("Conta criada com sucesso! Por favor, digite sua senha para entrar.");
          setModo("login");
          return;
        }

        setMensagemSucesso("Conta criada com sucesso! Entrando...");
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1000);
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
          setErro(res.erro || "E-mail ou senha incorretos. Verifique suas credenciais.");
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
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      {/* Coluna Esquerda: Arte & Identidade Autoral (Identica ao print do usuario) */}
      <section className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white p-12 relative overflow-hidden">
        {/* Marca Topo */}
        <div className="flex items-center gap-3.5 z-10">
          <div className="w-10 h-10 rounded-full border-2 border-white/20 bg-white/5 flex items-center justify-center text-xl font-serif">
            ◜
          </div>
          <div>
            <span className="font-serif font-bold text-lg text-white leading-tight block">
              Rflex01
            </span>
            <span className="text-[11px] text-slate-400 font-sans block">
              Seu acervo. Seu pensamento. Novas reflexões.
            </span>
          </div>
        </div>

        {/* Frase Central do Print */}
        <div className="max-w-md my-auto space-y-4 z-10">
          <h2 className="font-serif text-3xl xl:text-4xl font-bold leading-tight tracking-tight text-white">
            Entre no seu universo autoral.
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed font-sans font-light">
            Um espaço privado para organizar sua produção intelectual, compreender
            sua metodologia e construir novas reflexões com contexto.
          </p>
        </div>

        {/* Rodapé da Arte */}
        <div className="text-xs text-slate-400 font-sans z-10">
          Rflex01 &bull; Memória e inteligência autoral
        </div>

        {/* Efeito Glow Abstrato de Fundo */}
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-24 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Coluna Direita: Formulário de Autenticação */}
      <section className="flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 bg-slate-50/50">
        <div className="w-full max-w-md space-y-6">
          
          {/* Logo Mobile */}
          <div className="flex lg:hidden items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full border-2 border-blue-600/30 bg-blue-600/10 flex items-center justify-center text-xl font-serif text-blue-600">
              ◜
            </div>
            <div>
              <span className="font-serif font-bold text-lg text-slate-900 leading-tight block">
                Rflex01
              </span>
              <span className="text-[11px] text-slate-500 font-sans block">
                Seu acervo. Seu pensamento. Novas reflexões.
              </span>
            </div>
          </div>

          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
              Acesse o Rflex01
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Entre com sua conta ou crie uma nova conta com e-mail e senha.
            </p>
          </div>

          {/* Abas Alternar Modo */}
          <div className="flex p-1 bg-slate-200/70 rounded-2xl">
            <button
              type="button"
              onClick={() => { setModo("login"); setErro(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                modo === "login"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => { setModo("cadastro"); setErro(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                modo === "cadastro"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Criar Conta
            </button>
          </div>

          {/* Alertas */}
          {erro && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          {mensagemSucesso && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-700 text-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{mensagemSucesso}</span>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {modo === "cadastro" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome autoral"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors shadow-xs"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={mostrarSenha ? "text" : "password"}
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {modo === "cadastro" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Repita sua senha"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors shadow-xs"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 text-xs mt-2 disabled:opacity-50 active:scale-95"
            >
              {carregando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processando autenticação...</span>
                </>
              ) : (
                <>
                  <span>{modo === "login" ? "Entrar" : "Finalizar Cadastro"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="p-3 bg-slate-100/80 rounded-xl text-[11px] text-slate-500 leading-relaxed border border-slate-200/60">
            Sua sessão é mantida de forma segura pelo sistema de autenticação do Rflex01.
          </div>
        </div>
      </section>
    </main>
  );
}
