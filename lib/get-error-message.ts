import { isAxiosError } from "axios"

export function getErrorMessage(err: unknown, fallback = ""): string {
  if (isAxiosError(err)) {
    return (
      (err.response?.data as { message?: string } | undefined)?.message ??
      fallback
    )
  }
  return fallback
}
