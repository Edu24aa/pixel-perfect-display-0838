import { useState } from "react";
import { History, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  adminProjects,
  progressFor,
  project,
  statusMeta,
  statusOrder,
  type AuditEntry,
  type Milestone,
  type MilestoneStatus,
} from "@/lib/clientlens-data";
import { StatusPill } from "./StatusPill";

type Props = {
  milestones: Milestone[];
  audit: AuditEntry[];
  onStatusChange: (id: string, status: MilestoneStatus) => void;
  onAddMilestone: (title: string, dateLabel: string) => void;
};

export function AdminView({ milestones, audit, onStatusChange, onAddMilestone }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dateLabel, setDateLabel] = useState("");
  const current = progressFor(milestones);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Painel interno</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Projetos ativos, status das etapas e histórico de aprovações.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus /> Novo Marco de Entrega
        </Button>
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Projeto</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Entrega</TableHead>
              <TableHead className="w-44">Progresso</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adminProjects.map((p) => {
              const percent = p.name === project.name ? current.percent : p.progress;
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-foreground">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">{p.client}</TableCell>
                  <TableCell className="text-muted-foreground">{p.owner}</TableCell>
                  <TableCell className="text-muted-foreground">{p.due}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={percent} className="h-1.5" />
                      <span className="w-10 text-right text-xs text-muted-foreground">
                        {percent}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </section>

      <section className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Etapas — {project.name}
        </h2>
        <ul className="mt-4 divide-y divide-border">
          {milestones.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium text-foreground">{m.title}</p>
                <p className="text-sm text-muted-foreground">{m.dateLabel}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusPill status={m.status} />
                <Select
                  value={m.status}
                  onValueChange={(v) => onStatusChange(m.id, v as MilestoneStatus)}
                >
                  <SelectTrigger className="w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOrder.map((s) => (
                      <SelectItem key={s} value={s}>
                        {statusMeta[s].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <h2 className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          <History className="size-4" /> Histórico de aprovações
        </h2>
        <ul className="mt-4 space-y-3">
          {audit.map((a) => (
            <li key={a.id} className="flex gap-3 text-sm">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-border" />
              <span className="text-foreground/80">{a.text}</span>
              <span className="ml-auto shrink-0 text-muted-foreground">{a.timestamp}</span>
            </li>
          ))}
        </ul>
      </section>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) {
            setTitle("");
            setDateLabel("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo marco de entrega</DialogTitle>
            <DialogDescription>
              O cliente verá este marco na linha do tempo do projeto.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do marco"
            />
            <Input
              value={dateLabel}
              onChange={(e) => setDateLabel(e.target.value)}
              placeholder="Previsão (ex.: Previsto para 30/Out)"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!title.trim()}
              onClick={() => {
                onAddMilestone(title.trim(), dateLabel.trim() || "Sem data definida");
                setOpen(false);
                setTitle("");
                setDateLabel("");
              }}
            >
              Criar marco
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
