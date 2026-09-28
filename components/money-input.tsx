"use client"

import { Input } from "@/components/ui/input"
import { sanitizeMoneyInput } from "@/lib/money"
import { cn } from "@/lib/utils"

interface MoneyInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange" | "type"
> {
  value: string
  onValueChange: (value: string) => void
  /** Подпись справа (валюта/единица), например «₸ / час» */
  suffix?: string
}

/** Ввод денег: строка, а не число — без float и потери точности. */
export function MoneyInput({
  value,
  onValueChange,
  suffix,
  className,
  ...props
}: MoneyInputProps) {
  return (
    <div className="relative">
      <Input
        {...props}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(e) => onValueChange(sanitizeMoneyInput(e.target.value))}
        className={cn(suffix && "pr-20", "tabular-nums", className)}
      />
      {suffix && (
        <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm">
          {suffix}
        </span>
      )}
    </div>
  )
}
