"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useCurrentUser } from "@/hooks/use-current-user"

/**
 * Разделы настройки доступны только OWNER. Это удобство интерфейса (кассира сразу возвращаем
 * на главную); реальную защиту обеспечивает backend (RBAC на каждом эндпоинте).
 */
export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = useCurrentUser()
  const router = useRouter()
  const allowed = user.role === "OWNER"

  useEffect(() => {
    if (!allowed) router.replace("/")
  }, [allowed, router])

  return allowed ? <>{children}</> : null
}
