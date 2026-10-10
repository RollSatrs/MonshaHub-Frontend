"use client"

import { useEffect } from "react"
import { IconBuildingStore } from "@tabler/icons-react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { setActiveBranchId } from "@/lib/branch-context"
import { useBranches, useCurrentBranch } from "@/lib/queries/branches"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function BranchSwitcher() {
  const user = useCurrentUser()
  const current = useCurrentBranch()
  const branches = useBranches(user.role === "OWNER")

  useEffect(() => {
    if (current.data?.id) setActiveBranchId(current.data.id)
  }, [current.data?.id])

  if (user.role === "CASHIER") {
    return (
      <div className="hidden min-w-0 items-center gap-2 rounded-xl bg-muted/70 px-3 py-2 sm:flex">
        <IconBuildingStore className="size-4 shrink-0 text-primary" />
        <span className="max-w-40 truncate text-sm font-medium">
          {current.data?.name ?? "Филиал"}
        </span>
      </div>
    )
  }

  const active = branches.data?.filter((branch) => branch.active) ?? []
  return (
    <Select
      value={current.data ? String(current.data.id) : undefined}
      onValueChange={(value) => {
        setActiveBranchId(Number(value))
        window.location.reload()
      }}
    >
      <SelectTrigger
        className="min-h-11 w-44 bg-background sm:w-56"
        aria-label="Выбранный филиал"
      >
        <IconBuildingStore className="size-4 text-primary" />
        <SelectValue placeholder="Выберите филиал" />
      </SelectTrigger>
      <SelectContent>
        {active.map((branch) => (
          <SelectItem key={branch.id} value={String(branch.id)}>
            {branch.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
