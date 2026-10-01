import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { PublicRoomCard } from "./public-room-card"
import { liveRoom } from "@/lib/test-fixtures"

const post = vi.fn()
const push = vi.fn()
vi.mock("@/lib/api", () => ({ api: { post: (...a: unknown[]) => post(...a) } }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const hall = (over = {}) =>
  liveRoom({
    id: 5,
    name: "Общий мужской зал",
    type: "PUBLIC",
    capacity: 60,
    state: "OPEN",
    inside: 37,
    activeVisits: 14,
    ...over,
  })

function renderCard(room = hall()) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  const onGroup = vi.fn()
  const onInside = vi.fn()
  render(
    <QueryClientProvider client={client}>
      <PublicRoomCard
        room={room}
        currency="KZT"
        onGroup={onGroup}
        onInside={onInside}
      />
    </QueryClientProvider>
  )
  return { onGroup, onInside }
}

describe("PublicRoomCard", () => {
  beforeEach(() => {
    post.mockReset().mockResolvedValue({ data: { id: 77, total: "2000.00" } })
    push.mockReset()
  })

  it("показывает «37 / 60» и число чеков внутри", () => {
    renderCard()
    expect(screen.getByLabelText("Гостей внутри")).toHaveTextContent("37 / 60")
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "37"
    )
    expect(
      screen.getByRole("button", { name: /Внутри \(14\)/ })
    ).toBeInTheDocument()
  })

  it("«+ Взрослый» создаёт чек одного взрослого; «+ Ребёнок» — одного ребёнка", async () => {
    renderCard()
    await userEvent.click(screen.getByRole("button", { name: "+ Взрослый" }))
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/visits/public", {
        roomId: 5,
        guests: [{ category: "ADULT", quantity: 1 }],
      })
    )
    await userEvent.click(screen.getByRole("button", { name: "+ Ребёнок" }))
    await waitFor(() =>
      expect(post).toHaveBeenLastCalledWith("/visits/public", {
        roomId: 5,
        guests: [{ category: "CHILD", quantity: 1 }],
      })
    )
  })

  it("зал заполнен: подпись словами, кнопки входа заблокированы, «Внутри» доступна", () => {
    const { onInside } = renderCard(hall({ state: "FULL", inside: 60 }))
    expect(screen.getByText("ЗАЛ ЗАПОЛНЕН")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "+ Взрослый" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "+ Ребёнок" })).toBeDisabled()
    expect(screen.getByRole("button", { name: /Группа/ })).toBeDisabled()
    expect(screen.getByRole("button", { name: /Внутри/ })).toBeEnabled()
    void onInside
  })

  it("нет тарифа входа: предупреждение и заблокированные кнопки", () => {
    renderCard(hall({ hasTariff: false }))
    expect(screen.getByText(/Не задан тариф входа/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "+ Взрослый" })).toBeDisabled()
  })

  it("«Группа» и «Внутри» вызывают обработчики", async () => {
    const { onGroup, onInside } = renderCard()
    await userEvent.click(screen.getByRole("button", { name: /Группа/ }))
    await userEvent.click(screen.getByRole("button", { name: /Внутри/ }))
    expect(onGroup).toHaveBeenCalled()
    expect(onInside).toHaveBeenCalled()
  })
})
