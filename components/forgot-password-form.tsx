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
import { api } from "@/lib/api"
import { getErrorMessage } from "@/lib/get-error-message"
import { Spinner } from "./ui/spinner"

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => setError(""), 2000)
    return () => clearTimeout(timer)
  }, [error])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post("/auth/forgot-password", { email })
      setSuccess(true)
    } catch (err) {
      setError(getErrorMessage(err, "Произошла ошибка"))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-4xl">📬</div>
        <h1 className="text-2xl font-bold">Письмо отправлено</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Если этот email зарегистрирован, на него придёт письмо со ссылкой для
          сброса пароля.
        </p>
        <a href="/login" className="text-sm underline underline-offset-4">
          Вернуться ко входу
        </a>
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
          <h1 className="text-2xl font-bold">Забыли пароль?</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Введите email — мы пришлём ссылку для сброса пароля
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            {loading ? "Отправляем..." : "Отправить ссылку"}
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
