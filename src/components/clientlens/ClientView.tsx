import { useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Clock,
  MessageSquare,
  Paperclip,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  progressFor,
  project,
  type Milestone,
} from "@/lib/clientlens-data";
import { StatusPill } from "./StatusPill";

type Props = {
  milestones: Milestone[];
  onApprove: (id: string) => void;
  onRequestChange: (id: string, feedback: string) => void;
};

export function ClientView({ milestones, onApprove, onRequestChange }: Props) {
  const { done, total, percent } = progressFor(milestones);
  const [openId, setOpenId] = useState<string | null>(
    milestones.find((m) => m.status === "review")?.id ?? null,
  );
  const [approveFor, setApproveFor] = useState<Milestone | null>(null);
  const [approved, setApproved] = useState<Milestone | null>(null);
  const [adjustFor, setAdjustFor] = useState<Milestone | null>(null);
  const [feedback, setFeedback] = useState("");
  const [attached, setAttached] = useState(false);

  const now = new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Projeto
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-foreground">{project.name}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="size-4" />
              Previsão de entrega: {project.dueLabel}
            </p>
          </div>
          <StatusPill
            status={percent === 100 ? "approved" : "review"}
            className="px-3 py-1 text-sm"
          />
        </div>

        <div className="mt-6">
          <div className="flex items-end justify-between text-sm">
            <span className="font-medium text-foreground">{percent}% concluído</span>
            <span className="text-muted-foreground">
              {done} de {total} etapas concluídas
            </span>
          </div>
          <Progress value={percent} className="mt-2 h-2" />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Linha do tempo
        </h2>
        <ol className="relative space-y-3 pl-8">
          <span className="absolute left-[11px] top-2 bottom-2 w-px bg-border" aria-hidden />
          {milestones.map((m) => {
            const isOpen = openId === m.id;
            const isReview = m.status === "review";
            return (
              <li key={m.id} className="relative">
                <span
                  className={cn(
                    "absolute -left-8 top-4 grid size-6 place-items-center rounded-full border-2 bg-background",
                    m.status === "approved" && "border-success bg-success text-success-foreground",
                    isReview && "border-warning bg-warning-soft text-warning-foreground",
                    m.status === "in_progress" && "border-info bg-info-soft text-info",
                    m.status === "pending" && "border-border text-muted-foreground",
                  )}
                >
                  {m.status === "approved" ? (
                    <Check className="size-3.5" strokeWidth={3} />
                  ) : (
                    <span className="size-1.5 rounded-full bg-current" />
                  )}
                </span>

                <div
                  className={cn(
                    "rounded-xl border bg-card transition-colors",
                    isReview ? "border-warning/60 shadow-[var(--shadow-card)]" : "border-border",
                    m.status === "pending" && "bg-muted/40",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : m.id)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left cursor-pointer"
                  >
                    <div>
                      <p
                        className={cn(
                          "font-medium",
                          m.status === "pending" ? "text-muted-foreground" : "text-foreground",
                        )}
                      >
                        {m.title}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{m.dateLabel}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <StatusPill status={m.status} />
                      <ChevronDown
                        className={cn(
                          "size-4 text-muted-foreground transition-transform",
                          isOpen && "rotate-180",
                        )}
                      />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-border px-5 py-4">
                      <p className="text-sm leading-relaxed text-foreground/80">{m.summary}</p>

                      {m.demoUrl && (
                        <a
                          href={m.demoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-info hover:underline"
                        >
                          Acessar Ambiente de Testes
                          <ArrowUpRight className="size-4" />
                        </a>
                      )}

                      {isReview && (
                        <div className="mt-5 flex flex-wrap gap-3 border-t border-border pt-4">
                          <Button variant="success" onClick={() => setApproveFor(m)}>
                            <Check /> Aprovar Entrega
                          </Button>
                          <Button variant="outline" onClick={() => setAdjustFor(m)}>
                            <MessageSquare /> Solicitar Ajuste
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <Dialog open={!!approveFor} onOpenChange={(o) => !o && setApproveFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar aprovação</DialogTitle>
            <DialogDescription>
              Você está aprovando “{approveFor?.title}”. O registro será feito em {now}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveFor(null)}>
              Cancelar
            </Button>
            <Button
              variant="success"
              onClick={() => {
                if (!approveFor) return;
                onApprove(approveFor.id);
                setApproved(approveFor);
                setApproveFor(null);
              }}
            >
              Confirmar aprovação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!approved} onOpenChange={(o) => !o && setApproved(null)}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto grid size-11 place-items-center rounded-full bg-success-soft text-success">
              <Check className="size-5" strokeWidth={3} />
            </div>
            <DialogTitle className="text-center">Entrega aprovada</DialogTitle>
            <DialogDescription className="text-center">
              “{approved?.title}” foi aprovada em {now}. Nosso time foi notificado e seguirá para a
              próxima etapa.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setApproved(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!adjustFor}
        onOpenChange={(o) => {
          if (!o) {
            setAdjustFor(null);
            setFeedback("");
            setAttached(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar ajuste</DialogTitle>
            <DialogDescription>
              Descreva o que precisa ser revisado em “{adjustFor?.title}”.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Ex.: no checkout, o campo de CPF aceita valores inválidos."
            rows={5}
          />
          <button
            type="button"
            onClick={() => setAttached(true)}
            className="inline-flex items-center gap-2 self-start text-sm text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <Paperclip className="size-4" />
            {attached ? "print-checkout.png anexado" : "Anexar arquivo"}
          </button>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAdjustFor(null);
                setFeedback("");
                setAttached(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              disabled={!feedback.trim()}
              onClick={() => {
                if (!adjustFor) return;
                onRequestChange(adjustFor.id, feedback.trim());
                setAdjustFor(null);
                setFeedback("");
                setAttached(false);
              }}
            >
              Enviar solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
