import axios from "axios"
import { env } from "@/lib/env"

export const api = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const isAuthRoute = ["/login", "/signup"].some((r) =>
        window.location.pathname.startsWith(r)
      )
      if (!isAuthRoute) window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)
