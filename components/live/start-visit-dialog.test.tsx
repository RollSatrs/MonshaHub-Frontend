import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { StartVisitDialog } from "./start-visit-dialog"
import { board, liveRoom } from "@/lib/test-fixtures"

const post = vi.fn()
const push = vi.fn()
vi.mock("@/lib/api", () => ({ api: { post: (...a: unknown[]) => post(...a) } }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

function conflict(meta: Record<string, unknown>) {
  return new AxiosError("x", "409", undefined, undefined, {
    status: 409,
    statusText: "",
    headers: {},
    config: {} as never,
    data: {
      code: "BOOKING_CONFLICT",
      message: "Время посещения пересекается с бронью",
      meta,
    },
  })
}

function renderDialog(roomOver = {}, boardOver = {}) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  const room = liveRoom(roomOver)
  render(
    <QueryClientProvider client={client}>
      <StartVisitDialog
        room={room}
        board={board([room], boardOver)}
        onOpenChange={vi.fn()}
      />
    </QueryClientProvider>
  )
  return room
}

describe("StartVisitDialog", () => {
  beforeEach(() => {
    post.mockReset().mockResolvedValue({ data: { id: 501 } })
    push.mockReset()
  })

  it("варианты длительности кратны шагу организации (60): 1, 1.5 ч не предлагается", () => {
    renderDialog()
    for (const label of ["1 ч", "2 ч", "3 ч", "4 ч", "6 ч"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument()
    }
    expect(
      screen.queryByRole("button", { name: "1 ч 30 мин" })
    ).not.toBeInTheDocument()
  })

  it("шаг 30 минут: появляются получасовые варианты", () => {
    renderDialog({}, { timeStepMinutes: 30 })
    expect(screen.getByRole("button", { name: "30 мин" })).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "1 ч 30 мин" })
    ).toBeInTheDocument()
  })

  it("старт отправляет комнату, выбранную длительность и необязательные данные клиента, затем открывает посещение", async () => {
    renderDialog({ id: 7 })
    await userEvent.click(screen.getByRole("button", { name: "2 ч" }))
    await userEvent.type(screen.getByLabelText(/Клиент/), "Ержан")
    await userEvent.click(
      screen.getByRole("button", { name: "Начать посещение" })
    )

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/visits/private", {
        roomId: 7,
        durationMinutes: 120,
        customerName: "Ержан",
      })
    )
    await waitFor(() => expect(push).toHaveBeenCalledWith("/visits/501"))
  })

  it("до брони свободно 90 минут: варианты длиннее заблокированы (подсказка, окончательно решает backend)", () => {
    renderDialog({
      availableMinutes: 90,
      nextBooking: {
        id: 3,
        customerName: "Мадина",
        startsAt: "2026-01-01T13:30:00.000Z",
        endsAt: "2026-01-01T15:00:00.000Z",
      },
    })
    expect(screen.getByRole("button", { name: "1 ч" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "2 ч" })).toBeDisabled()
    expect(screen.getByText(/До брони свободно 1 ч 30 мин/)).toBeInTheDocument()
    expect(screen.getByText(/Ближайшая бронь: Мадина/)).toBeInTheDocument()
  })

  it("«Начать по брони» стартует посещение по ближайшей брони", async () => {
    renderDialog({
      nextBooking: {
        id: 3,
        customerName: "Мадина",
        startsAt: "2026-01-01T13:30:00.000Z",
        endsAt: "2026-01-01T15:00:00.000Z",
      },
      availableMinutes: 90,
    })
    await userEvent.click(
      screen.getByRole("button", { name: "Начать по брони" })
    )
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/bookings/3/start-visit", {})
    )
    await waitFor(() => expect(push).toHaveBeenCalledWith("/visits/501"))
  })

  it("конфликт с бронью от backend: понятное сообщение с оставшимся временем", async () => {
    post.mockRejectedValueOnce(conflict({ availableMinutes: 60 }))
    renderDialog()
    await userEvent.click(
      screen.getByRole("button", { name: "Начать посещение" })
    )
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "свободно ещё 1 ч"
    )
    expect(push).not.toHaveBeenCalled()
  })

  it("нет тарифа: старт заблокирован", () => {
    renderDialog({ hasTariff: false })
    expect(
      screen.getByRole("button", { name: "Начать посещение" })
    ).toBeDisabled()
  })

  it("стрелки меняют длительность на шаг", async () => {
    renderDialog({}, { timeStepMinutes: 30 })
    await userEvent.click(
      screen.getByRole("button", { name: "Больше на 30 мин" })
    )
    expect(
      screen.getByText("1 ч 30 мин", { selector: "span" })
    ).toBeInTheDocument()
    await userEvent.click(
      screen.getByRole("button", { name: "Меньше на 30 мин" })
    )
    expect(screen.getByText("1 ч", { selector: "span" })).toBeInTheDocument()
  })
})
