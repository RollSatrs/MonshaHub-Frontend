import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/** Статус не только цветом: точка + текст. */
export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "rounded-full",
        active ? "bg-primary-subtle text-success" : "text-muted-foreground"
      )}
    >
      <span aria-hidden>{active ? "●" : "○"}</span>
      {active ? "Активен" : "В архиве"}
    </Badge>
  )
}
