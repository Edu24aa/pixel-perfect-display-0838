import { cn } from "@/lib/utils";
import { statusMeta, type MilestoneStatus } from "@/lib/clientlens-data";

const toneClass: Record<string, string> = {
  success: "bg-success-soft text-success border-success/30",
  warning: "bg-warning-soft text-warning-foreground border-warning/40",
  info: "bg-info-soft text-info border-info/30",
  muted: "bg-muted text-muted-foreground border-border",
};

export function StatusPill({
  status,
  className,
}: {
  status: MilestoneStatus;
  className?: string;
}) {
  const meta = statusMeta[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        toneClass[meta.tone],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
}
