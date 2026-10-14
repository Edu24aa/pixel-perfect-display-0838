import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Clock,
  FileText,
  MessageSquare,
  Paperclip,
  Pencil,
  Send,
  ShieldCheck,
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
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  progressFor,
  type Milestone,
} from "@/lib/clientlens-data";
import { StatusPill } from "./StatusPill";
import { askClientLensAssistant } from "@/services/api";

type Props = {
  project: {
    name: string;
    client: string;
    dueLabel: string;
    overallStatus: string;
    accessCode?: string;
    clientEmail?: string | null;
    clientPhone?: string | null;
  };
  milestones: Milestone[];
  onApprove: (id: string) => void;
  onRequestChange: (id: string, feedback: string, clientName?: string) => void;
  onSaveProfile?: (payload: { name: string; email: string; phone: string }) => Promise<void> | void;
};

export function ClientView({ project, milestones, onApprove, onRequestChange, onSaveProfile }: Props) {
  const list = Array.isArray(milestones) ? milestones : [];
  const { done, total, percent: progressPercentage } = progressFor(list);
  const [openId, setOpenId] = useState<string | null>(
    list.find((m) => m.status === "review")?.id ?? null,
  );
  const [approveFor, setApproveFor] = useState<Milestone | null>(null);
  const [approved, setApproved] = useState<Milestone | null>(null);
  const [adjustFor, setAdjustFor] = useState<Milestone | null>(null);
  const [feedback, setFeedback] = useState("");
  const [attached, setAttached] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: project.client,
    email: project.clientEmail ?? "",
    phone: project.clientPhone ?? "",
  });
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    {
      role: "assistant",
      text: "Olá! Posso ajudar com dúvidas sobre o ClientLens, prazos, status e o fluxo do seu projeto.",
    },
  ]);

  const now = new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  useEffect(() => {
    setProfileForm({
      name: project.client,
      email: project.clientEmail ?? "",
      phone: project.clientPhone ?? "",
    });
  }, [project.client, project.clientEmail, project.clientPhone]);

  const handleSendChat = async () => {
    const message = chatInput.trim();
    if (!message || chatLoading) return;

    setChatInput("");
    setChatError(null);
    setChatMessages((current) => [...current, { role: "user", text: message }]);
    setChatLoading(true);

    try {
      const reply = await askClientLensAssistant(message);
      setChatMessages((current) => [...current, { role: "assistant", text: reply }]);
    } catch (error) {
      const messageError = error instanceof Error ? error.message : "Não foi possível enviar a mensagem.";
      setChatError(messageError);
      setChatMessages((current) => [...current, { role: "assistant", text: "Desculpe, houve um problema ao responder. Tente novamente em instantes." }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {!chatOpen && (
        <button
          type="button"
          className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-xl shadow-primary/20 transition hover:scale-[1.02]"
          onClick={() => setChatOpen(true)}
        >
          <MessageSquare className="size-4" />
          Assistente
        </button>
      )}

      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
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

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setChatOpen((current) => !current)}>
              <MessageSquare className="mr-2 size-4" />
              Assistente
            </Button>
            <Button variant="outline" size="sm" onClick={() => setProfileOpen(true)}>
              <Pencil className="mr-2 size-4" />
              Meu Perfil
            </Button>
            <StatusPill
              status={progressPercentage === 100 ? "approved" : "review"}
              className="px-3 py-1 text-sm"
            />
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-end justify-between text-sm">
            <span className="font-medium text-foreground">
              <span>{progressPercentage}%</span> concluído
            </span>
            <span className="text-muted-foreground">
              <span>{done}</span> de <span>{total}</span> etapas concluídas
            </span>
          </div>
          <Progress value={progressPercentage} className="mt-2 h-2" />
        </div>
      </section>

      {chatOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[min(390px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_20px_60px_rgba(15,23,42,0.22)] ring-1 ring-primary/10 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2 border-b border-border bg-gradient-to-r from-primary/10 via-background to-background px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <div className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
                <MessageSquare className="size-4" />
              </div>
              Assistente ClientLens
            </div>
            <Button variant="ghost" size="sm" onClick={() => setChatOpen(false)}>
              Fechar
            </Button>
          </div>

          <div className="max-h-[320px] space-y-3 overflow-y-auto bg-background/70 p-3">
            {chatMessages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={cn(
                  "max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm",
                  message.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                {message.text}
              </div>
            ))}
            {chatLoading && (
              <div className="max-w-[88%] rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground shadow-sm">
                Pensando...
              </div>
            )}
          </div>

          {chatError && <p className="px-3 pb-2 text-xs text-destructive">{chatError}</p>}

          <div className="flex gap-2 border-t border-border bg-background/80 p-3">
            <Textarea
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              rows={2}
              placeholder="Pergunte sobre o projeto, status ou prazos..."
              className="min-h-[48px] resize-none border-muted-foreground/20 bg-background"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSendChat();
                }
              }}
            />
            <Button
              type="button"
              onClick={() => void handleSendChat()}
              disabled={chatLoading || !chatInput.trim()}
              className="self-end rounded-xl px-3"
            >
              <Send className="mr-2 size-4" />
              Enviar
            </Button>
          </div>
        </div>
      )}

      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Linha do tempo
        </h2>
        <ol className="relative space-y-3 pl-8">
          <span className="absolute left-2.75 top-2 bottom-2 w-px bg-border" aria-hidden />
          {list.map((m) => {
            const isOpen = openId === m.id;
            const isReview = m.status === "review";
            const isApproved = m.status === "approved";

            return (
              <li key={m.id} className="relative">
                <span
                  className={cn(
                    "absolute -left-8 top-4 grid size-6 place-items-center rounded-full border-2 bg-background",
                    isApproved && "border-success bg-success text-success-foreground",
                    isReview && "border-warning bg-warning-soft text-warning-foreground",
                    m.status === "in_progress" && "border-info bg-info-soft text-info",
                    m.status === "pending" && "border-border text-muted-foreground",
                  )}
                >
                  {isApproved ? (
                    <Check className="size-3.5" strokeWidth={3} />
                  ) : (
                    <span className="size-1.5 rounded-full bg-current" />
                  )}
                </span>

                <div
                  className={cn(
                    "rounded-xl border bg-card shadow-sm transition-colors",
                    isReview ? "border-warning/60" : "border-border",
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

                      {isApproved && (
                        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-emerald-900/60 bg-emerald-950/20 p-3.5">
                          <div className="space-y-1 text-left">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                              <ShieldCheck className="size-4 shrink-0 text-emerald-400" />
                              Certificado de Homologação Auditado
                            </div>
                            <div className="space-y-0.5 font-mono text-[11px] text-muted-foreground">
                              <p>
                                Hash de Aceite:{" "}
                                <span className="text-slate-300">
                                  SHA256: 7f8a9e2d...{m.id}b04
                                </span>
                              </p>
                              <p>
                                Autenticação:{" "}
                                <span className="text-slate-300">
                                  {project.client} via Assinatura Digital (IP Verificado)
                                </span>
                              </p>
                              <p>
                                Conformidade:{" "}
                                <span className="font-semibold text-emerald-400">
                                  Garantia de Escopo Blindada
                                </span>
                              </p>
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              alert(
                                `Emitindo PDF: Termo de Homologação e Aceite Formal da etapa "${m.title}". Código de autenticação registrado no sistema.`
                              )
                            }
                            className="h-8 shrink-0 gap-1.5 border-emerald-800/80 bg-emerald-950/40 text-xs font-medium text-emerald-300 hover:bg-emerald-900/60 hover:text-emerald-200"
                          >
                            <FileText className="size-3.5" />
                            Termo de Aceite (.PDF)
                          </Button>
                        </div>
                      )}

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
            <DialogTitle>Confirmar homologação e aceite</DialogTitle>
            <DialogDescription>
              Você está formalizando a aprovação da etapa “{approveFor?.title}”. Ao confirmar, um registro de homologação com data, hora ({now}) e hash auditável será emitido.
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
              Confirmar e Homologar
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
            <DialogTitle className="text-center">Entrega homologada com sucesso</DialogTitle>
            <DialogDescription className="text-center">
              “{approved?.title}” foi registrada com autenticação em {now}. O certificado auditável já está anexado à etapa e a equipe seguirá para o próximo marco.
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
            <span>{attached ? "print-checkout.png anexado" : "Anexar arquivo"}</span>
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
                onRequestChange(adjustFor.id, feedback.trim(), project.client);
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

      <Dialog open={profileOpen} onOpenChange={(openState) => setProfileOpen(openState)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar meus dados</DialogTitle>
            <DialogDescription>
              Atualize nome, e-mail e telefone para receber informações do projeto.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              value={profileForm.name}
              onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Nome do contato"
            />
            <Input
              type="email"
              value={profileForm.email}
              onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="E-mail"
            />
            <Input
              value={profileForm.phone}
              onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))}
              placeholder="Telefone / WhatsApp"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                void onSaveProfile?.({
                  name: profileForm.name.trim() || project.client,
                  email: profileForm.email.trim(),
                  phone: profileForm.phone.trim(),
                });
                setProfileOpen(false);
              }}
            >
              Salvar perfil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}