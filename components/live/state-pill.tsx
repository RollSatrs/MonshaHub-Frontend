import { cn } from "@/lib/utils"
import { ROOM_STATE_LABEL } from "@/lib/labels"
import type { RoomState } from "@/lib/api/types"

export const STATE_STYLES: Record<RoomState, { card: string; pill: string }> = {
  AVAILABLE: {
    card: "bg-card border-border hover:border-primary/50",
    pill: "bg-primary-subtle text-success",
  },
  OCCUPIED: {
    card: "bg-primary-subtle border-primary/30 hover:border-primary",
    pill: "bg-primary text-primary-foreground",
  },
  ENDING_SOON: {
    card: "bg-warning-subtle border-warning/40 hover:border-warning",
    pill: "bg-warning text-white",
  },
  OVERTIME: {
    card: "bg-danger-subtle border-danger/40 hover:border-danger",
    pill: "bg-danger text-white",
  },
  CLEANING: {
    card: "bg-secondary border-border",
    pill: "bg-foreground/80 text-background",
  },
  OPEN: {
    card: "bg-card border-border",
    pill: "bg-primary-subtle text-success",
  },
  FULL: {
    card: "bg-danger-subtle border-danger/40",
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
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
        STATE_STYLES[state].pill,
        className
      )}
    >
      <span aria-hidden>●</span>
      {ROOM_STATE_LABEL[state]}
    </span>
  )
}
