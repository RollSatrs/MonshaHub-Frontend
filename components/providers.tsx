"use client"

import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { isAxiosError } from "axios"

/** Единый QueryClient для server state. Auth (AppShell/useCurrentUser) сюда не переносим. */
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            // 4xx повторять бессмысленно; сетевые/5xx — до 2 раз
            retry: (failureCount, error) => {
              const status = isAxiosError(error)
                ? error.response?.status
                : undefined
              if (status && status < 500) return false
              return failureCount < 2
            },
          },
          mutations: { retry: false },
        },
      })
  )
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
