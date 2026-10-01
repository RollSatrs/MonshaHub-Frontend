import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import HistoryPage from "./page"
import type { VisitList } from "@/lib/api/types"

const get = vi.fn()
let role: "OWNER" | "CASHIER" = "OWNER"
vi.mock("@/lib/api", () => ({ api: { get: (...a: unknown[]) => get(...a) } }))
vi.mock("@/hooks/use-current-user", () => ({
  useCurrentUser: () => ({ role }),
}))

const org = {
  id: 1,
  name: "Баня",
  currency: "KZT",
  timezone: "Asia/Almaty",
  timeStepMinutes: 60,
}
const list: VisitList = {
  hasMore: false,
  items: [
    {
      id: 10,
      kind: "PRIVATE",
      status: "COMPLETED",
      roomName: "VIP №1",
      customerName: "Ержан",
      startedAt: "2026-01-01T10:00:00.000Z",
      endedAt: "2026-01-01T12:00:00.000Z",
      cancelledAt: null,
      total: "31500.00",
      paid: "31500.00",
      voidedItemsCount: 2,
      guests: null,
      cancelReason: null,
    },
    {
      id: 11,
      kind: "PRIVATE",
      status: "CANCELLED",
      roomName: "VIP №2",
      customerName: null,
      startedAt: "2026-01-01T11:00:00.000Z",
      endedAt: null,
      cancelledAt: "2026-01-01T11:05:00.000Z",
      total: "10000.00",
      paid: "0.00",
      voidedItemsCount: 0,
      guests: null,
      cancelReason: "Начали не в том помещении",
    },
    {
      id: 12,
      kind: "PUBLIC",
      status: "COMPLETED",
      roomName: "Общий мужской зал",
      customerName: null,
      startedAt: "2026-01-01T09:00:00.000Z",
      endedAt: "2026-01-01T10:30:00.000Z",
      cancelledAt: null,
      total: "5000.00",
      paid: "5000.00",
      voidedItemsCount: 0,
      guests: 3,
      cancelReason: null,
    },
  ],
}

function serve(data: VisitList) {
  get.mockImplementation((url: string) => {
    if (url === "/organization") return Promise.resolve({ data: org })
    if (url === "/rooms")
      return Promise.resolve({
        data: [{ id: 1, name: "VIP №1", active: true }],
      })
    if (url === "/visits") return Promise.resolve({ data })
    return Promise.reject(new Error(`unexpected ${url}`))
  })
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <HistoryPage />
    </QueryClientProvider>
  )
}

describe("История", () => {
  beforeEach(() => {
    get.mockReset()
    role = "OWNER"
  })

  it("OWNER: итоги, оплата, причина отмены и число убранных позиций на виду", async () => {
    serve(list)
    renderPage()
    const done = await screen.findByTestId("history-10")
    expect(
      within(done).getByText(/31\s500\s₸/, { selector: "td:nth-child(5)" })
    ).toBeInTheDocument()
    expect(within(done).getByText(/Убрано позиций: 2/)).toBeInTheDocument()

    const cancelled = screen.getByTestId("history-11")
    expect(within(cancelled).getByText(/Отменено/)).toBeInTheDocument()
    expect(
      within(cancelled).getByText("Начали не в том помещении")
    ).toBeInTheDocument()

    expect(
      within(screen.getByTestId("history-12")).getByText("гостей: 3")
    ).toBeInTheDocument()
    expect(screen.getByText(/вашей бани/)).toBeInTheDocument()
  })

  it("CASHIER: пояснение про последние 24 часа", async () => {
    role = "CASHIER"
    serve(list)
    renderPage()
    await screen.findByTestId("history-10")
    expect(screen.getByText(/за последние 24 часа/)).toBeInTheDocument()
  })

  it("ссылка ведёт на экран посещения", async () => {
    serve(list)
    renderPage()
    const link = await screen.findByRole("link", { name: /№10 · VIP №1/ })
    expect(link).toHaveAttribute("href", "/visits/10")
  })

  it("фильтр по статусу уходит в запрос", async () => {
    serve(list)
    renderPage()
    await screen.findByTestId("history-10")
    await userEvent.click(screen.getByRole("combobox", { name: "Статус" }))
    await userEvent.click(
      await screen.findByRole("option", { name: "Отменённые" })
    )
    await waitFor(() =>
      expect(get).toHaveBeenCalledWith("/visits", {
        params: { status: "CANCELLED", limit: 50 },
      })
    )
  })

  it("«Показать ещё» увеличивает лимит, пока backend говорит, что есть ещё", async () => {
    serve({ ...list, hasMore: true })
    renderPage()
    await userEvent.click(
      await screen.findByRole("button", { name: "Показать ещё" })
    )
    await waitFor(() =>
      expect(get).toHaveBeenCalledWith("/visits", { params: { limit: 100 } })
    )
  })

  it("пусто и ошибка", async () => {
    serve({ items: [], hasMore: false })
    const { unmount } = renderPage()
    expect(await screen.findByText("Посещений пока нет")).toBeInTheDocument()
    unmount()

    get.mockImplementation((url: string) =>
      url === "/visits"
        ? Promise.reject(new Error("x"))
        : Promise.resolve({ data: url === "/rooms" ? [] : org })
    )
    renderPage()
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Не удалось загрузить данные"
    )
  })
})
