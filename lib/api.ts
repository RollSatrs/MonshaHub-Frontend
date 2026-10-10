import axios from "axios"
import { env } from "@/lib/env"
import { getActiveBranchId } from "@/lib/branch-context"

export const api = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const branchId = getActiveBranchId()
  if (branchId) config.headers.set("x-branch-id", String(branchId))
  return config
})

let sessionResetStarted = false

/**
 * Сессия недействительна (токен просрочен, пользователь деактивирован, cookie чужая).
 * Важно сначала очистить cookie: proxy.ts пускает на защищённые страницы по одному наличию cookie
 * и уводит с /login, если она есть — без очистки «застрявшая» сессия зациклила бы редиректы.
 * logout на backend публичный и идемпотентный, работает и с недействительным токеном.
 */
function resetSession() {
  if (sessionResetStarted) return
  sessionResetStarted = true
  fetch(`${env.NEXT_PUBLIC_API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  })
    .catch(() => undefined)
    .finally(() => {
      window.location.href = "/login"
    })
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const isAuthRoute = [
        "/login",
        "/signup",
        "/forgot-password",
        "/reset-password",
      ].some((r) => window.location.pathname.startsWith(r))
      if (!isAuthRoute) resetSession()
    }
    return Promise.reject(error)
  }
)
