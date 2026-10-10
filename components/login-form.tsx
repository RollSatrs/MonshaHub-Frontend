"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { IconBackspace, IconEraser } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { getWorkplaceToken } from "@/lib/branch-context"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { api } from "@/lib/api"
import { getErrorMessage } from "@/lib/get-error-message"

const KEYS = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "←", "0", "."]

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [email, setEmail] = useState("")
  const [pin, setPin] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [now, setNow] = useState<Date | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => setError(""), 2000)
    return () => clearTimeout(timer)
  }, [error])

  useEffect(() => {
    const initial = window.setTimeout(() => setNow(new Date()), 0)
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => {
      window.clearTimeout(initial)
      window.clearInterval(timer)
    }
  }, [])

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    if (!/^\d{4}$/.test(pin)) {
      setError("PIN должен состоять из 4 цифр.")
      setLoading(false)
      return
    }

    try {
      await api.post("/auth/pin-login", {
        email,
        pin,
        workplaceToken: getWorkplaceToken() ?? undefined,
      })
      router.push("/")
    } catch (err) {
      console.error(err)
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      noValidate
      onSubmit={handleLogin}
      className={cn("flex flex-col text-white", className)}
      {...props}
    >
      <div className="mb-3 text-center">
        <p className="text-4xl leading-none font-light tabular-nums">
          {now
            ? new Intl.DateTimeFormat("ru-RU", {
                hour: "2-digit",
                minute: "2-digit",
              }).format(now)
            : "--:--"}
        </p>
        <p className="mt-2 text-sm text-white/65">
          {now
            ? new Intl.DateTimeFormat("ru-RU", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }).format(now)
            : "Загрузка даты"}
        </p>
        <p className="text-xs tracking-[0.15em] text-white/55 uppercase">
          {now
            ? new Intl.DateTimeFormat("ru-RU", { weekday: "long" }).format(now)
            : ""}
        </p>
        <p className="mt-2 text-base leading-snug text-white/90">
          Для входа введите email и PIN-код
        </p>
      </div>

      <FieldGroup className="gap-2">
        <Field className="gap-1.5">
          <FieldLabel htmlFor="email" className="sr-only">
            Email
          </FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="Email сотрудника"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            className="h-12 rounded-none border-white/35 bg-white text-center text-base text-foreground placeholder:text-muted-foreground focus-visible:border-white focus-visible:ring-white/20"
            required
          />
        </Field>

        <Field className="gap-1.5">
          <FieldLabel htmlFor="pin" className="sr-only">
            PIN-код
          </FieldLabel>
          <Input
            id="pin"
            type="password"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            placeholder="PIN-код"
            value={pin}
            onChange={(e) =>
              setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            autoComplete="off"
            className="h-12 rounded-none border-white/35 bg-white/10 text-center text-xl tracking-[0.35em] text-white placeholder:text-base placeholder:tracking-normal placeholder:text-white/50 focus-visible:border-white focus-visible:ring-white/20"
            required
          />
        </Field>

        <div
          className="grid grid-cols-3 gap-1"
          aria-label="Цифровая клавиатура"
        >
          {KEYS.map((key) => (
            <button
              key={key}
              type="button"
              className="flex h-14 items-center justify-center border border-white/45 bg-white/10 text-3xl font-light text-white transition-colors hover:bg-white/18 active:bg-white/25 disabled:cursor-not-allowed disabled:opacity-35"
              onClick={() =>
                key === "←"
                  ? setPin((value) => value.slice(0, -1))
                  : key === "."
                    ? undefined
                    : setPin((value) => (value + key).slice(0, 4))
              }
              disabled={key === "."}
              aria-label={
                key === "←" ? "Удалить последний символ" : `Символ ${key}`
              }
            >
              {key === "←" ? <IconBackspace className="size-7" /> : key}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-1">
          <button
            type="button"
            className="flex h-14 items-center justify-center border border-white/45 bg-white/10 text-white transition-colors hover:bg-white/18 active:bg-white/25"
            onClick={() => setPin("")}
            aria-label="Очистить PIN"
          >
            <IconEraser className="size-6" />
          </button>
          <Button
            type="submit"
            aria-label="Войти"
            className="col-span-2 h-14 rounded-none border border-white/35 bg-success text-lg font-medium text-white hover:bg-success/90"
          >
            {loading ? "Вход…" : "Подтвердить"}
            {loading ? <Spinner className="size-5" /> : null}
          </Button>
        </div>

        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            error ? "mt-1 max-h-16 opacity-100" : "mt-0 max-h-0 opacity-0"
          )}
        >
          <div
            className={cn(
              "flex items-center justify-center gap-2 border border-white/30 bg-danger px-3 py-2 text-center text-xs text-white",
              error && "animate-shake"
            )}
          >
            <span aria-hidden>⚠</span>
            <span className="leading-tight">{error}</span>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-center gap-4 text-xs text-white/65">
          <a
            href="/forgot-password"
            className="hover:text-white hover:underline"
          >
            Забыли пароль?
          </a>
          <span aria-hidden>·</span>
          <FieldDescription className="text-white/65">
            <a href="/signup" className="hover:text-white hover:underline">
              Создать аккаунт
            </a>
          </FieldDescription>
        </div>
      </FieldGroup>
    </form>
  )
}
