import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AxiosError } from "axios"
import BookingsPage from "./page"
import type { Booking } from "@/lib/api/types"

const get = vi.fn()
const post = vi.fn()
const patch = vi.fn()
const push = vi.fn()
vi.mock("@/lib/api", () => ({
  api: {
    get: (...a: unknown[]) => get(...a),
    post: (...a: unknown[]) => post(...a),
    patch: (...a: unknown[]) => patch(...a),
  },
}))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const org = {
  id: 1,
  name: "Баня",
  currency: "KZT",
  timezone: "Asia/Almaty",
  timeStepMinutes: 60,
}
const rooms = [
  {
    id: 1,
    name: "VIP №1",
    type: "PRIVATE",
    capacity: 6,
    sortOrder: 1,
    active: true,
    activeTariffs: [],
  },
  {
    id: 2,
    name: "Общий зал",
    type: "PUBLIC",
    capacity: 60,
    sortOrder: 2,
    active: true,
    activeTariffs: [],
  },
]
const booking = (over: Partial<Booking> = {}): Booking => ({
  id: 7,
  roomId: 1,
  roomName: "VIP №1",
  customerName: "Мадина",
  customerPhone: "+7 702 333 44 55",
  startsAt: "2026-06-10T13:00:00.000Z",
  endsAt: "2026-06-10T15:00:00.000Z",
  durationMinutes: 120,
  status: "BOOKED",
  notes: "Торт принесут с собой",
  createdByName: "Демо Кассир",
  isLate: false,
  visitId: null,
  closedAt: null,
  closeReason: null,
  ...over,
})

function serve(list: Booking[]) {
  get.mockImplementation((url: string) => {
    if (url === "/organization") return Promise.resolve({ data: org })
    if (url === "/bookings") return Promise.resolve({ data: list })
    if (url === "/rooms") return Promise.resolve({ data: rooms })
    return Promise.reject(new Error(`unexpected ${url}`))
  })
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <BookingsPage />
    </QueryClientProvider>
  )
}

describe("Брони", () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
    patch.mockReset()
    push.mockReset()
  })

  it("список по дням: время в поясе бани, помещение, клиент, телефон, заметка", async () => {
    serve([booking()])
    renderPage()
    const card = await screen.findByTestId("booking-7")
    // 13:00–15:00 UTC = 18:00–20:00 Алматы
    expect(within(card).getByText(/18:00–20:00/)).toBeInTheDocument()
    expect(within(card).getByText("VIP №1")).toBeInTheDocument()
    expect(within(card).getByText("Мадина")).toBeInTheDocument()
    expect(
      within(card).getByRole("link", { name: /702 333 44 55/ })
    ).toHaveAttribute("href", "tel:+77023334455")
    expect(within(card).getByText("Торт принесут с собой")).toBeInTheDocument()
  })

  it("наступившее время помечено словами", async () => {
    serve([booking({ isLate: true })])
    renderPage()
    expect(await screen.findByText(/Время наступило/)).toBeInTheDocument()
  })

  it("«Начать» стартует посещение по брони и открывает его", async () => {
    serve([booking()])
    post.mockResolvedValue({ data: { id: 900 } })
    renderPage()
    await userEvent.click(await screen.findByRole("button", { name: "Начать" }))
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/bookings/7/start-visit", {})
    )
    await waitFor(() => expect(push).toHaveBeenCalledWith("/visits/900"))
  })

  it("отмена брони требует подтверждения", async () => {
    serve([booking()])
    post.mockResolvedValue({ data: booking({ status: "CANCELLED" }) })
    renderPage()
    await userEvent.click(
      await screen.findByRole("button", { name: "Отменить" })
    )
    const dialog = await screen.findByRole("alertdialog")
    expect(post).not.toHaveBeenCalled()
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Отменить бронь" })
    )
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/bookings/7/cancel", {})
    )
  })

  it("«Не пришли» отмечает неявку", async () => {
    serve([booking()])
    post.mockResolvedValue({ data: booking({ status: "NO_SHOW" }) })
    renderPage()
    await userEvent.click(
      await screen.findByRole("button", { name: "Не пришли" })
    )
    const dialog = await screen.findByRole("alertdialog")
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Не пришли" })
    )
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/bookings/7/no-show", {})
    )
  })

  it("новая бронь: время из полей переводится из пояса бани в UTC; только приватные помещения", async () => {
    serve([])
    post.mockResolvedValue({ data: booking() })
    renderPage()
    await userEvent.click(
      await screen.findByRole("button", { name: /Новая бронь/ })
    )
    const dialog = await screen.findByRole("dialog")

    await userEvent.click(
      within(dialog).getByRole("combobox", { name: "Помещение" })
    )
    expect(
      screen.queryByRole("option", { name: "Общий зал" })
    ).not.toBeInTheDocument()
    await userEvent.click(await screen.findByRole("option", { name: "VIP №1" }))

    await userEvent.type(within(dialog).getByLabelText("Клиент"), "Мадина")
    await userEvent.type(
      within(dialog).getByLabelText("Телефон"),
      "+7 702 333 44 55"
    )
    const date = within(dialog).getByLabelText("Дата")
    const time = within(dialog).getByLabelText("Время")
    await userEvent.clear(date)
    await userEvent.type(date, "2026-06-10")
    await userEvent.clear(time)
    await userEvent.type(time, "18:00")
    await userEvent.click(within(dialog).getByRole("button", { name: "2 ч" }))
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Создать бронь" })
    )

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/bookings", {
        roomId: 1,
        customerName: "Мадина",
        customerPhone: "+7 702 333 44 55",
        startsAt: "2026-06-10T13:00:00.000Z",
        durationMinutes: 120,
      })
    )
  })

  it("конфликт от backend: показано занятое время в поясе бани", async () => {
    serve([])
    post.mockRejectedValueOnce(
      new AxiosError("x", "409", undefined, undefined, {
        status: 409,
        statusText: "",
        headers: {},
        config: {} as never,
        data: {
          code: "BOOKING_CONFLICT",
          message: "Помещение занято бронью на это время",
          meta: {
            conflictStartsAt: "2026-06-10T13:00:00.000Z",
            conflictEndsAt: "2026-06-10T15:00:00.000Z",
          },
        },
      })
    )
    renderPage()
    await userEvent.click(
      await screen.findByRole("button", { name: /Новая бронь/ })
    )
    const dialog = await screen.findByRole("dialog")
    await userEvent.click(
      within(dialog).getByRole("combobox", { name: "Помещение" })
    )
    await userEvent.click(await screen.findByRole("option", { name: "VIP №1" }))
    await userEvent.type(within(dialog).getByLabelText("Клиент"), "Тимур")
    await userEvent.type(
      within(dialog).getByLabelText("Телефон"),
      "+7 705 000 00 00"
    )
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Создать бронь" })
    )
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "занято 18:00–20:00"
    )
  })

  it("пустой список", async () => {
    serve([])
    renderPage()
    expect(
      await screen.findByText("Предстоящих броней нет")
    ).toBeInTheDocument()
  })
})
