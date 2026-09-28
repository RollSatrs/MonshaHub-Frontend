"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { api } from "@/lib/api"
import { getErrorMessage } from "@/lib/get-error-message"
import { Spinner } from "./ui/spinner"

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => setError(""), 2000)
    return () => clearTimeout(timer)
  }, [error])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (password.length < 8) {
      setError("Пароль должен содержать не менее 8 символов")
      return
    }
    if (password !== confirm) {
      setError("Пароли не совпадают")
      return
    }
    if (!token) {
      setError("Неверная ссылка")
      return
    }
    setLoading(true)
    try {
      await api.post("/auth/reset-password", { token, password })
      setSuccess(true)
      setTimeout(() => router.push("/login"), 2000)
    } catch (err) {
      setError(getErrorMessage(err, "Произошла ошибка"))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-4xl">✅</div>
        <h1 className="text-2xl font-bold">Пароль изменён</h1>
        <p className="text-muted-foreground text-sm">
          Перенаправляем вас ко входу...
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Новый пароль</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Придумайте новый пароль для вашего аккаунта
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="password">Новый пароль</FieldLabel>
          <Input
            id="password"
            type="password"
            placeholder="Минимум 8 символов"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm">Повторите пароль</FieldLabel>
          <Input
            id="confirm"
            type="password"
            placeholder="Повторите пароль"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </Field>

        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            error ? "max-h-16 opacity-100 mt-1" : "max-h-0 opacity-0 mt-0"
          )}
        >
          <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">
            <span className="leading-none">⚠️</span>
            <span className="leading-tight">{error}</span>
          </div>
        </div>

        <Field>
          <Button type="submit" disabled={loading}>
            {loading ? "Сохраняем..." : "Сохранить пароль"}
            {loading && <Spinner className="size-6" />}
          </Button>
        </Field>
        <Field>
          <FieldDescription className="text-center">
            <a href="/login" className="underline underline-offset-4">
              Вернуться ко входу
            </a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
