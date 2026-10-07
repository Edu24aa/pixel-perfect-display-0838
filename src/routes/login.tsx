import { useEffect, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getManagerSession, saveManagerSession } from "@/lib/auth";
import { loginManager } from "@/services/api";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@clientlens.com");
  const [password, setPassword] = useState("admin123");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const session = getManagerSession();
    if (session) {
      void navigate({ to: "/tracking", search: { code: "NF-2024-001" } });
    }
  }, [navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await loginManager({ email: email.trim(), password });

      if (!response.success || !response.user) {
        setError(response.error ?? "Credenciais inválidas");
        return;
      }

      saveManagerSession(response.user);
      void navigate({ to: "/tracking", search: { code: "NF-2024-001" } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Credenciais inválidas");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur-sm">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">ClientLens</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Acesso do Gestor</h1>
          </div>
          <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 p-2 text-emerald-300">
            <ShieldCheck className="size-5" />
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-200">
              E-mail
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="gestor@clientlens.com"
              className="border-slate-700 bg-slate-950 text-white placeholder:text-slate-500"
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-200">
              Senha
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Digite sua senha"
              className="border-slate-700 bg-slate-950 text-white placeholder:text-slate-500"
              autoComplete="current-password"
            />
          </div>

          {error ? (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Entrando..." : "Entrar no painel"}
          </Button>
        </form>

        <div className="mt-5 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white">
            <ArrowLeft className="size-4" />
            Voltar para consulta de cliente
          </Link>
        </div>
      </div>
    </div>
  );
}
