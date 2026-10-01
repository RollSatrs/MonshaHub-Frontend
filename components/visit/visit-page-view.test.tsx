import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { VisitPageView } from "@/components/visit/visit-page-view"
import { SERVER_TIME, visitDetail } from "@/lib/test-fixtures"
import type { VisitDetail } from "@/lib/api/types"

const get = vi.fn()
const post = vi.fn()
const push = vi.fn()
vi.mock("@/lib/api", () => ({
  api: {
    get: (...a: unknown[]) => get(...a),
    post: (...a: unknown[]) => post(...a),
  },
}))
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const org = {
  id: 1,
  name: "Баня",
  currency: "KZT",
  timezone: "Asia/Almaty",
  timeStepMinutes: 60,
}

function serve(visit: VisitDetail) {
  get.mockImplementation((url: string) => {
    if (url === "/organization") return Promise.resolve({ data: org })
    if (url === `/visits/${visit.id}`) return Promise.resolve({ data: visit })
    if (url === "/products") {
      return Promise.resolve({
        data: [
          { id: 1, name: "Веник", price: "2500.00", stock: 10, active: true },
          { id: 2, name: "Чай", price: "1500.00", stock: 0, active: true },
        ],
      })
    }
    if (url === "/services")
      return Promise.resolve({
        data: [{ id: 1, name: "Массаж", price: "5000.00", active: true }],
      })
    return Promise.reject(new Error(`unexpected ${url}`))
  })
}

async function renderPage(visit: VisitDetail) {
  serve(visit)
  vi.useFakeTimers({ toFake: ["Date"], now: new Date(SERVER_TIME) })
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <VisitPageView visitId={visit.id} />
    </QueryClientProvider>
  )
  await screen.findByRole("heading", { name: visit.roomName })
}

describe("Экран посещения", () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
    push.mockReset()
  })

  it("показывает помещение, клиента, время, позиции и итоги от backend", async () => {
    await renderPage(visitDetail())
    expect(screen.getByRole("heading", { name: "VIP №2" })).toBeInTheDocument()
    expect(screen.getByText(/Ержан/)).toBeInTheDocument()
    expect(screen.getByText("ЗАНЯТО")).toBeInTheDocument()
    // до 13:00 UTC при «сейчас» 12:00 → 1 час
    expect(screen.getByLabelText("Оставшееся время")).toHaveTextContent(
      "01:00:00"
    )
    expect(screen.getByText(/Аренда помещения · 2 ч/)).toBeInTheDocument()
    expect(screen.getByText("Веник")).toBeInTheDocument()
    expect(screen.getByLabelText("Итого")).toHaveTextContent(/25\s000\s₸/)
    expect(screen.getByLabelText("Оплачено")).toHaveTextContent(/^0\s₸$/)
    expect(screen.getByLabelText("Осталось оплатить")).toHaveTextContent(
      /25\s000\s₸/
    )
    expect(screen.getByText(/○ Не оплачено/)).toBeInTheDocument()
  })

  it("основные действия кассира на виду: + Товар, + Услуга, Продлить, Оплатить / Завершить", async () => {
    await renderPage(visitDetail())
    for (const name of [
      "+ Товар",
      "+ Услуга",
      "Продлить",
      "Оплатить / Завершить",
    ]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument()
    }
    expect(
      screen.getByRole("button", { name: "Отменить посещение" })
    ).toBeInTheDocument()
  })

  it("просрочка: подпись словами и предложение продлить", async () => {
    await renderPage(
      visitDetail({
        timeState: "OVERTIME",
        endsAt: "2026-01-01T11:55:00.000Z",
        remainingSeconds: -300,
      })
    )
    expect(screen.getByText("ПРОСРОЧЕНО")).toBeInTheDocument()
    expect(screen.getByLabelText("Оставшееся время")).toHaveTextContent(
      "−00:05:00"
    )
    expect(
      screen.getByText(/Время вышло — продлите или завершите/)
    ).toBeInTheDocument()
  })

  it("«+ Товар»: тап по плитке добавляет одну единицу; нет в наличии — заблокировано", async () => {
    const updated = visitDetail({ total: "27500.00", balance: "27500.00" })
    post.mockResolvedValue({ data: updated })
    await renderPage(visitDetail())
    await userEvent.click(screen.getByRole("button", { name: "+ Товар" }))

    const dialog = await screen.findByRole("dialog")
    expect(
      within(dialog).getByRole("button", { name: "Добавить Чай" })
    ).toBeDisabled()
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Добавить Веник" })
    )
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/visits/42/products", {
        productId: 1,
        quantity: 1,
      })
    )
  })

  it("«+ Услуга» добавляет услугу", async () => {
    post.mockResolvedValue({ data: visitDetail() })
    await renderPage(visitDetail())
    await userEvent.click(screen.getByRole("button", { name: "+ Услуга" }))
    const dialog = await screen.findByRole("dialog")
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Добавить Массаж" })
    )
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/visits/42/services", {
        serviceId: 1,
        quantity: 1,
      })
    )
  })

  it("«Продлить»: кратно шагу посещения, отправляет minutes", async () => {
    post.mockResolvedValue({ data: visitDetail() })
    await renderPage(visitDetail())
    await userEvent.click(screen.getByRole("button", { name: "Продлить" }))
    const dialog = await screen.findByRole("dialog")
    await userEvent.click(within(dialog).getByRole("button", { name: "+2 ч" }))
    await userEvent.click(
      within(dialog).getByRole("button", { name: /Продлить на 2 ч/ })
    )
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/visits/42/extend", { minutes: 120 })
    )
  })

  it("убранная позиция остаётся видна: зачёркнута, с причиной и кто убрал; кнопки «Убрать» у неё нет", async () => {
    const v = visitDetail()
    v.items[1] = {
      ...v.items[1],
      voided: true,
      voidedAt: "2026-01-01T11:20:00.000Z",
      voidedByName: "Демо Кассир",
      voidReason: "Добавили по ошибке",
    }
    v.total = "20000.00"
    v.balance = "20000.00"
    await renderPage(v)

    const row = screen.getByTestId("item-2")
    expect(
      within(row).getByText(/Убрано \(Демо Кассир\): Добавили по ошибке/)
    ).toBeInTheDocument()
    expect(
      within(row).queryByRole("button", { name: /Убрать/ })
    ).not.toBeInTheDocument()
    // время помещения убрать нельзя
    expect(
      within(screen.getByTestId("item-1")).queryByRole("button", {
        name: /Убрать/,
      })
    ).not.toBeInTheDocument()
    expect(screen.getByLabelText("Итого")).toHaveTextContent(/20\s000\s₸/)
  })

  it("«Убрать» позицию требует причину и отправляет её", async () => {
    post.mockResolvedValue({ data: visitDetail() })
    await renderPage(visitDetail())
    await userEvent.click(screen.getByRole("button", { name: /Убрать: Веник/ }))
    const dialog = await screen.findByRole("dialog")

    await userEvent.click(
      within(dialog).getByRole("button", { name: "Убрать позицию" })
    )
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Укажите причину"
    )
    expect(post).not.toHaveBeenCalled()

    await userEvent.click(
      within(dialog).getByRole("button", { name: "Добавили по ошибке" })
    )
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Убрать позицию" })
    )
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/visits/42/items/2/void", {
        reason: "Добавили по ошибке",
      })
    )
  })

  it("завершённое посещение: только просмотр, действий нет", async () => {
    await renderPage(
      visitDetail({
        status: "COMPLETED",
        timeState: null,
        remainingSeconds: null,
        endedAt: "2026-01-01T11:50:00.000Z",
        completedByName: "Демо Кассир",
        paid: "25000.00",
        balance: "0.00",
        paymentStatus: "PAID",
        payments: [
          {
            id: 1,
            amount: "25000.00",
            method: "CASH",
            createdAt: "2026-01-01T11:50:00.000Z",
            createdByName: "Демо Кассир",
          },
        ],
      })
    )
    expect(
      screen.getByText("Завершено", { selector: "[data-slot=badge]" })
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Посещение завершено — изменять его нельзя/)
    ).toBeInTheDocument()
    for (const name of [
      "+ Товар",
      "+ Услуга",
      "Продлить",
      "Оплатить / Завершить",
    ]) {
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument()
    }
    expect(
      screen.queryByRole("button", { name: /Убрать/ })
    ).not.toBeInTheDocument()
    expect(screen.getByText(/Наличные/)).toBeInTheDocument()
    expect(screen.getByText(/✓ Оплачено/)).toBeInTheDocument()
  })

  it("отменённое посещение: причина и кто отменил на виду, действий нет", async () => {
    await renderPage(
      visitDetail({
        status: "CANCELLED",
        timeState: null,
        remainingSeconds: null,
        cancelledAt: "2026-01-01T11:05:00.000Z",
        cancelledByName: "Демо Кассир",
        cancelReason: "Начали не в том помещении",
      })
    )
    expect(
      screen.getByText(
        /Посещение отменено \(Демо Кассир\).*Начали не в том помещении/
      )
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "+ Товар" })
    ).not.toBeInTheDocument()
  })

  it("если по посещению есть платёж, «Отменить посещение» скрыто", async () => {
    await renderPage(
      visitDetail({
        paid: "5000.00",
        balance: "20000.00",
        paymentStatus: "PARTIAL",
        payments: [
          {
            id: 1,
            amount: "5000.00",
            method: "CARD",
            createdAt: SERVER_TIME,
            createdByName: "Демо Кассир",
          },
        ],
      })
    )
    expect(
      screen.queryByRole("button", { name: "Отменить посещение" })
    ).not.toBeInTheDocument()
    expect(screen.getByText(/◐ Оплачено частично/)).toBeInTheDocument()
  })

  it("PUBLIC: вместо «Продлить» — «+ Гости», нет таймера", async () => {
    await renderPage(
      visitDetail({
        kind: "PUBLIC",
        roomName: "Общий мужской зал",
        endsAt: null,
        timeState: null,
        remainingSeconds: null,
        guests: 3,
        hourlyRate: null,
        timeStepMinutes: null,
      })
    )
    expect(screen.getByRole("button", { name: "+ Гости" })).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Продлить" })
    ).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Оставшееся время")).not.toBeInTheDocument()
  })
})
