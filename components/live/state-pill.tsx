import { cn } from "@/lib/utils"
import { ROOM_STATE_LABEL } from "@/lib/labels"
import type { RoomState } from "@/lib/api/types"

export const STATE_STYLES: Record<RoomState, { card: string; pill: string }> = {
  AVAILABLE: {
    card: "bg-card border-border border-l-primary hover:border-primary/55",
    pill: "bg-primary-subtle text-success",
  },
  OCCUPIED: {
    card: "bg-primary-subtle/65 border-primary/25 border-l-primary hover:border-primary/55",
    pill: "bg-primary text-primary-foreground",
  },
  ENDING_SOON: {
    card: "bg-warning-subtle border-warning/30 border-l-warning hover:border-warning/60",
    pill: "bg-warning text-white",
  },
  OVERTIME: {
    card: "bg-danger-subtle border-danger/30 border-l-danger hover:border-danger/60",
    pill: "bg-danger text-white",
  },
  CLEANING: {
    card: "bg-secondary border-border border-l-muted-foreground",
    pill: "bg-muted-foreground text-white",
  },
  OPEN: {
    card: "bg-card border-border border-l-primary",
    pill: "bg-primary-subtle text-success",
  },
  FULL: {
    card: "bg-danger-subtle border-danger/30 border-l-danger",
    pill: "bg-danger text-white",
  },
}

/** Состояние помещения: всегда точка + слово, не только цвет. */
export function StatePill({
  state,
  className,
}: {
  state: RoomState
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase",
        STATE_STYLES[state].pill,
        className
      )}
    >
      <span aria-hidden>●</span>
      {ROOM_STATE_LABEL[state]}
    </span>
  )
}
