"use client"

import { useEffect, useState } from "react"
import { IconCloudCheck, IconMenu2 } from "@tabler/icons-react"
import { AppSidebar } from "@/components/app-sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { CurrentUserProvider } from "@/hooks/use-current-user"
import { api } from "@/lib/api"
import type { User } from "@/lib/api/types"
import { getActiveBranchId, setActiveBranchId } from "@/lib/branch-context"
import { BranchSwitcher } from "@/components/branch-switcher"

type State =
  { status: "loading" } | { status: "error" } | { status: "ready"; user: User }

const ROLE_LABEL: Record<User["role"], string> = {
  OWNER: "Владелец",
  CASHIER: "Кассир",
}

function WorkstationClock() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    const initial = window.setTimeout(() => setNow(new Date()), 0)
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => {
      window.clearTimeout(initial)
      window.clearInterval(timer)
    }
  }, [])

  if (!now) return <span className="tabular-nums">--:--</span>

  return (
    <div className="text-right leading-tight">
      <p className="text-base font-semibold tabular-nums">
        {new Intl.DateTimeFormat("ru-RU", {
          hour: "2-digit",
          minute: "2-digit",
        }).format(now)}
      </p>
      <p className="text-[11px] text-muted-foreground">
        {new Intl.DateTimeFormat("ru-RU", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(now)}
      </p>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>({ status: "loading" })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    api
      .get<User>("/auth/me")
      .then((res) => {
        if (cancelled) return
        if (!getActiveBranchId() && res.data.branchId) {
          setActiveBranchId(res.data.branchId)
        }
        setState({ status: "ready", user: res.data })
      })
      .catch(() => !cancelled && setState({ status: "error" }))
    return () => {
      cancelled = true
    }
  }, [attempt])

  if (state.status === "loading") {
    return (
      <div className="flex min-h-screen" aria-busy="true" aria-label="Загрузка">
        <Skeleton className="hidden h-screen w-64 rounded-none md:block" />
        <div className="flex-1 space-y-4 p-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    )
  }

  if (state.status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-lg font-medium">
          Не удалось загрузить данные пользователя
        </p>
        <p className="text-muted-foreground text-sm">
          Проверьте соединение и повторите попытку.
        </p>
        <Button
          onClick={() => {
            setState({ status: "loading" })
            setAttempt((n) => n + 1)
          }}
        >
          Повторить
        </Button>
      </div>
    )
  }

  return (
    <CurrentUserProvider value={state.user}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex min-h-14 shrink-0 items-center gap-3 border-b bg-white/90 px-3 text-foreground shadow-sm backdrop-blur md:px-4">
            <SidebarTrigger className="border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground md:hidden">
              <IconMenu2 />
            </SidebarTrigger>
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary-subtle text-primary">
                <IconCloudCheck className="size-5" aria-hidden />
              </div>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-semibold">
                  {state.user.fullname}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {ROLE_LABEL[state.user.role]} · рабочее место
                </p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <BranchSwitcher />
              <span className="hidden items-center gap-1.5 border-r border-border pr-3 text-xs text-muted-foreground sm:flex">
                <span className="size-2 rounded-full bg-success" aria-hidden />
                Система онлайн
              </span>
              <WorkstationClock />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-3 md:p-4 lg:p-5">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </CurrentUserProvider>
  )
}
