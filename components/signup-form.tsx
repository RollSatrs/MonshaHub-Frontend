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
import { sizes } from "@/shared/constants/css"
import { api } from "@/lib/api"
import { getErrorMessage } from "@/lib/get-error-message"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Spinner } from "./ui/spinner"

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [fullname, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [organizationName, setOrganizationName] = useState("")

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!error) return

    const timer = setTimeout(() => {
      setError("")
    }, 3000)

    return () => clearTimeout(timer)
  }, [error])

  const handlerSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    if (password !== confirmPassword) {
      setError("Пароли не совпадают. Пожалуйста, проверьте ввод.")
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError("Пароль должен содержать не менее 8 символов.")
      setLoading(false)
      return
    }

    try {
      await api.post("/auth/register", {
        organizationName,
        fullname,
        email,
        password,
      })
      router.push("/login")
    } catch (err) {
      console.error(err)
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handlerSignup}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Регистрация бани</h1>
          <p className={sizes.minitwo}>
            Создайте аккаунт владельца. Кассиров вы добавите позже.
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="organization">Название бани</FieldLabel>
          <Input
            id="organization"
            type="text"
            placeholder="Баня «Парная»"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="name">Ваше имя</FieldLabel>
          <Input
            id="name"
            type="text"
            placeholder="Иван Иванов"
            value={fullname}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="test@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Пароль</FieldLabel>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <FieldDescription className={sizes.mini}>
            Пароль должен быть не менее 8 символов.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="confirm-password">
            Подтверждение пароля
          </FieldLabel>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <FieldDescription className={sizes.mini}>
            Пожалуйста, подтвердите ваш пароль.
          </FieldDescription>
        </Field>

        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            error ? "max-h-16 opacity-100 mt-1" : "max-h-0 opacity-0 mt-0"
          )}
        >
          <div
            className={cn(
              "flex items-center gap-2 rounded-md border border-danger/30 bg-danger-subtle px-2 py-1 text-xs text-danger",
              error && "animate-shake"
            )}
          >
            <span className="leading-none">⚠️</span>
            <span className="leading-tight">{error}</span>
          </div>
        </div>

        <Field>
          <Button type="submit" disabled={loading}>
            {loading ? "Регистрация..." : "Создать аккаунт"}
            {loading ? <Spinner className="size-6" /> : ""}
          </Button>
          <FieldDescription className="px-6 text-center">
            Уже есть аккаунт? <a href="/login">Войти</a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
