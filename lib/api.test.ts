import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AxiosError, type InternalAxiosRequestConfig } from "axios"

function unauthorized(config: InternalAxiosRequestConfig) {
  return Promise.reject(
    new AxiosError("401", "ERR_BAD_REQUEST", config, undefined, {
      status: 401,
      statusText: "",
      headers: {},
      config,
      data: {},
    })
  )
}

async function loadApi(pathname: string) {
  vi.resetModules()
  const location = { pathname, href: pathname }
  vi.stubGlobal("location", location)
  Object.defineProperty(window, "location", { value: location, writable: true })
  const { api } = await import("./api")
  api.defaults.adapter = unauthorized
  return { api, location }
}

describe("api: недействительная сессия (401)", () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue({ ok: true })
    vi.stubGlobal("fetch", fetchMock)
  })
  afterEach(() => vi.unstubAllGlobals())

  it("очищает cookie через backend logout и только потом уходит на /login (иначе proxy зациклит редиректы)", async () => {
    const { api, location } = await loadApi("/rooms")
    await expect(api.get("/auth/me")).rejects.toBeTruthy()

    await vi.waitFor(() => expect(location.href).toBe("/login"))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe("http://localhost:3001/auth/logout")
    expect(init).toMatchObject({ method: "POST", credentials: "include" })
  })

  it("пачка одновременных 401 запускает сброс сессии один раз", async () => {
    const { api } = await loadApi("/products")
    await Promise.allSettled([api.get("/a"), api.get("/b"), api.get("/c")])
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("на страницах входа 401 ничего не сбрасывает и не редиректит", async () => {
    const { api, location } = await loadApi("/login")
    await expect(api.post("/auth/login", {})).rejects.toBeTruthy()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(location.href).toBe("/login")
  })
})
