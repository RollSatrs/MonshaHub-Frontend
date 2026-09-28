"use client"

import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
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

type State =
  { status: "loading" } | { status: "error" } | { status: "ready"; user: User }

export function AppShell({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>({ status: "loading" })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    api
      .get<User>("/auth/me")
      .then(
        (res) => !cancelled && setState({ status: "ready", user: res.data })
      )
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
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <span className="text-sm font-medium">MonshaHub</span>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </CurrentUserProvider>
  )
}
