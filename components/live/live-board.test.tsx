import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { LiveBoard } from "./live-board"
import { board, liveRoom, occupiedRoom, SERVER_TIME } from "@/lib/test-fixtures"
import type { LiveBoard as LiveBoardData } from "@/lib/api/types"

const get = vi.fn()
const post = vi.fn()
vi.mock("@/lib/api", () => ({
  api: {
    get: (...a: unknown[]) => get(...a),
    post: (...a: unknown[]) => post(...a),
  },
}))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const scenario = () =>
  board([
    liveRoom({ id: 1, name: "VIP №1", state: "AVAILABLE" }),
    occupiedRoom({ id: 2, name: "VIP №2" }, 87),
    occupiedRoom({ id: 3, name: "VIP №3", state: "ENDING_SOON" }, 8),
    occupiedRoom({ id: 4, name: "VIP №4", state: "OVERTIME" }, -3),
    liveRoom({
      id: 5,
      name: "Семейный зал",
      state: "CLEANING",
      cleaningStartedAt: SERVER_TIME,
    }),
    liveRoom({
      id: 6,
      name: "Общий мужской зал",
      type: "PUBLIC",
      capacity: 60,
      state: "OPEN",
      inside: 37,
      activeVisits: 12,
    }),
  ])

function serve(data: LiveBoardData | Error) {
  get.mockImplementation((url: string) => {
    if (url === "/live/board")
      return data instanceof Error
        ? Promise.reject(data)
        : Promise.resolve({ data })
    return Promise.reject(new Error(`unexpected ${url}`))
  })
}

function renderBoard() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <LiveBoard />
    </QueryClientProvider>
  )
}

describe("«Баня сейчас»", () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
  })

  it("показывает все состояния помещений и счётчик общественного зала", async () => {
    serve(scenario())
    renderBoard()

    await screen.findByText("VIP №1")
    expect(
      within(screen.getByTestId("room-1")).getByText("СВОБОДНО")
    ).toBeInTheDocument()
    expect(
      within(screen.getByTestId("room-2")).getByText("ЗАНЯТО")
    ).toBeInTheDocument()
    expect(
      within(screen.getByTestId("room-3")).getByText("ЗАКАНЧИВАЕТСЯ")
    ).toBeInTheDocument()
    expect(
      within(screen.getByTestId("room-4")).getByText("ПРОСРОЧЕНО")
    ).toBeInTheDocument()
    expect(
      within(screen.getByTestId("room-5")).getByText("УБОРКА")
    ).toBeInTheDocument()
    expect(
      within(screen.getByTestId("room-6")).getByLabelText("Гостей внутри")
    ).toHaveTextContent("37 / 60")
    expect(
      screen.getByText(/Свободно: 1 · Занято: 3 · Уборка: 1/)
    ).toBeInTheDocument()
  })

  it("запрашивает состояние с backend (а не считает сам)", async () => {
    serve(scenario())
    renderBoard()
    await screen.findByText("VIP №1")
    expect(get).toHaveBeenCalledWith("/live/board")
  })

  it("клик по свободному помещению открывает старт посещения", async () => {
    serve(scenario())
    renderBoard()
    await userEvent.click(
      await screen.findByRole("button", { name: /VIP №1: свободно/ })
    )
    expect(await screen.findByRole("dialog")).toHaveTextContent(
      "VIP №1: начать посещение"
    )
  })

  it("«Уборка завершена» вызывает backend и обновляет состояние", async () => {
    serve(scenario())
    post.mockResolvedValue({ data: { finished: true } })
    renderBoard()
    await userEvent.click(
      await screen.findByRole("button", { name: "Уборка завершена" })
    )
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/rooms/5/finish-cleaning")
    )
    // после операции состояние перезапрашивается
    await waitFor(() =>
      expect(
        get.mock.calls.filter((c) => c[0] === "/live/board").length
      ).toBeGreaterThan(1)
    )
  })

  it("если локальный отсчёт пересёк порог, а backend ещё говорит ЗАНЯТО — один внеочередной запрос", async () => {
    // backend сообщил OCCUPIED, но до конца всего 8 минут (порог 10): состояние устарело
    serve(board([occupiedRoom({ state: "OCCUPIED" }, 8)]))
    renderBoard()
    await screen.findByText("VIP №2")
    await waitFor(() =>
      expect(get.mock.calls.filter((c) => c[0] === "/live/board").length).toBe(
        2
      )
    )
    // и не зацикливается на одном и том же состоянии
    await new Promise((r) => setTimeout(r, 200))
    expect(get.mock.calls.filter((c) => c[0] === "/live/board").length).toBe(2)
  })

  it("пустой список помещений: понятное состояние", async () => {
    serve(board([]))
    renderBoard()
    expect(await screen.findByText("Помещений пока нет")).toBeInTheDocument()
  })

  it("ошибка загрузки: сообщение и «Повторить»", async () => {
    serve(new Error("network"))
    renderBoard()
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Не удалось загрузить данные"
    )
    serve(scenario())
    await userEvent.click(screen.getByRole("button", { name: "Повторить" }))
    expect(await screen.findByText("VIP №1")).toBeInTheDocument()
  })
})
