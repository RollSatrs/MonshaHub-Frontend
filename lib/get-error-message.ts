import { isAxiosError } from "axios"
import type { ApiErrorBody } from "@/lib/api/types"

export interface ParsedApiError {
  /** Машинный код ошибки (VALIDATION_ERROR, BOOKING_CONFLICT, ...) — по нему принимаем решения */
  code?: string
  message: string
  details?: string[]
  /** Структурированные подробности (например, availableMinutes при BOOKING_CONFLICT) */
  meta?: Record<string, unknown>
}

export function parseApiError(err: unknown, fallback = ""): ParsedApiError {
  if (isAxiosError(err)) {
    const data = err.response?.data as Partial<ApiErrorBody> | undefined
    return {
      code: data?.code,
      message: data?.message || fallback,
      details: data?.details,
      meta: data?.meta,
    }
  }
  return { message: fallback }
}

/** Текст для пользователя: для validation-ошибок добавляем первую деталь. */
export function getErrorMessage(err: unknown, fallback = ""): string {
  const { code, message, details } = parseApiError(err, fallback)
  if (code === "VALIDATION_ERROR" && details?.length) return details[0]
  return message
}
