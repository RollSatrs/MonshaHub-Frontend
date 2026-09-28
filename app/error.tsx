"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-muted-foreground text-sm">Ошибка</p>
      <h1 className="text-2xl font-bold">Что-то пошло не так</h1>
      <p className="text-muted-foreground text-sm text-balance">
        Попробуйте обновить страницу. Если ошибка повторяется, сообщите нам.
      </p>
      <Button onClick={() => reset()}>Попробовать снова</Button>
    </div>
  )
}
