import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Aperture, ArrowRight, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackProject } from "@/services/api";

const title = "ClientLens — Acompanhe suas entregas de software";
const description =
  "Portal de rastreamento de entregas para clientes: linha do tempo do projeto, aprovações de etapas e histórico auditável.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [code, setCode] = useState("NF-2024-001");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedCode = code.trim();

    if (!normalizedCode) {
      setError("Informe um código ou número da nota fiscal.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await trackProject(normalizedCode);
      void navigate({ to: "/tracking", search: { code: normalizedCode } });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Código não encontrado. Verifique e tente novamente.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30">
            <Aperture className="size-5" />
          </span>
          <div>
            <div className="text-sm font-semibold tracking-[0.14em] text-cyan-300">ClientLens</div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Entregas com clareza</div>
          </div>
        </div>

        <Link to="/login">
          <Button variant="outline" className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800">
            Acesso Gestor / TI
          </Button>
        </Link>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-88px)] max-w-5xl items-center justify-center">
        <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/50 backdrop-blur-sm md:p-10">
          <div className="mb-8 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-cyan-300">Acompanhe sua Entrega</p>
            <h1 className="mt-4 text-3xl font-semibold text-white md:text-5xl">ClientLens</h1>
            <p className="mt-3 text-sm text-slate-300 md:text-base">
              Consulte o status, acompanhe os marcos e confirme a evolução do projeto em tempo real.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <Input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="Ex: NF-2024-001"
                className="h-14 border-slate-700 bg-slate-950 pl-11 text-base text-white placeholder:text-slate-500"
              />
            </div>

            {error ? (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <Button type="submit" className="h-12 w-full gap-2 text-base" disabled={isLoading}>
              {isLoading ? "Consultando..." : "Consultar Status"}
              {!isLoading ? <ArrowRight className="size-4" /> : null}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
