import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Aperture } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientView } from "@/components/clientlens/ClientView";
import { AdminView } from "@/components/clientlens/AdminView";
import {
  initialAudit,
  initialMilestones,
  project,
  statusMeta,
  type AuditEntry,
  type Milestone,
  type MilestoneStatus,
} from "@/lib/clientlens-data";

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

function stamp() {
  return new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Index() {
  const [view, setView] = useState("client");
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);
  const [audit, setAudit] = useState<AuditEntry[]>(initialAudit);

  const log = (text: string) =>
    setAudit((prev) => [{ id: crypto.randomUUID(), text, timestamp: stamp() }, ...prev]);

  const setStatus = (id: string, status: MilestoneStatus) => {
    setMilestones((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              status,
              dateLabel:
                status === "approved"
                  ? `Aprovado em ${stamp()}`
                  : status === "review"
                    ? "Aguardando sua aprovação"
                    : m.dateLabel,
            }
          : m,
      ),
    );
    const m = milestones.find((x) => x.id === id);
    if (m) log(`Equipe de TI alterou “${m.title}” para ${statusMeta[status].label}`);
  };

  const approve = (id: string) => {
    setMilestones((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, status: "approved", dateLabel: `Aprovado em ${stamp()}` } : m,
      ),
    );
    const m = milestones.find((x) => x.id === id);
    if (m) log(`${project.client} aprovou a etapa “${m.title}”`);
  };

  const requestChange = (id: string, feedback: string) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: "in_progress" } : m)),
    );
    const m = milestones.find((x) => x.id === id);
    if (m) log(`${project.client} solicitou ajuste em “${m.title}”: ${feedback}`);
  };

  const addMilestone = (title: string, dateLabel: string) => {
    setMilestones((prev) => [
      ...prev,
      { id: crypto.randomUUID(), title, dateLabel, status: "pending", summary: dateLabel },
    ]);
    log(`Equipe de TI criou o marco “${title}”`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
              <Aperture className="size-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-foreground">ClientLens</span>
          </div>
          <Tabs value={view} onValueChange={setView}>
            <TabsList>
              <TabsTrigger value="client">Área do Cliente</TabsTrigger>
              <TabsTrigger value="admin">Gestor / TI</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {view === "client" ? (
          <ClientView
            milestones={milestones}
            onApprove={approve}
            onRequestChange={requestChange}
          />
        ) : (
          <AdminView
            milestones={milestones}
            audit={audit}
            onStatusChange={setStatus}
            onAddMilestone={addMilestone}
          />
        )}
      </main>
    </div>
  );
}
