"use client"

import { createContext, useContext } from "react"
import type { User } from "@/lib/api/types"

const CurrentUserContext = createContext<User | null>(null)

export const CurrentUserProvider = CurrentUserContext.Provider

/** Пользователь текущей сессии. Используется только внутри AppShell. */
export function useCurrentUser(): User {
  const user = useContext(CurrentUserContext)
  if (!user) throw new Error("useCurrentUser вне AppShell")
  return user
}
