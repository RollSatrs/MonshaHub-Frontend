import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TariffEditor } from "./tariff-editor"
import type { Room } from "@/lib/api/types"

const post = vi.fn()
const patch = vi.fn()
vi.mock("@/lib/api", () => ({
  api: {
    post: (...a: unknown[]) => post(...a),
    patch: (...a: unknown[]) => patch(...a),
  },
}))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const privateRoom: Room = {
  id: 7,
  name: "VIP №1",
  type: "PRIVATE",
  capacity: 6,
  sortOrder: 0,
  active: true,
  activeTariffs: [],
}
const publicRoom: Room = {
  ...privateRoom,
  id: 8,
  name: "Общий зал",
  type: "PUBLIC",
  capacity: 60,
}

function renderEditor(room: Room) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <TariffEditor room={room} />
    </QueryClientProvider>
  )
}

describe("TariffEditor", () => {
  beforeEach(() => {
    post.mockReset().mockResolvedValue({ data: {} })
    patch.mockReset().mockResolvedValue({ data: {} })
  })

  it("PRIVATE: одна строка «Почасовой тариф»; создание отправляет только roomId, name и price (kind определяет backend)", async () => {
    const user = userEvent.setup()
    renderEditor(privateRoom)

    expect(screen.getByLabelText("Почасовой тариф")).toBeInTheDocument()
    expect(screen.queryByLabelText("Взрослый")).not.toBeInTheDocument()

    const button = screen.getByRole("button", { name: "Задать тариф" })
    expect(button).toBeDisabled()
    await user.type(screen.getByLabelText("Почасовой тариф"), "10000")
    await user.click(button)

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1))
    expect(post).toHaveBeenCalledWith("/tariffs", {
      roomId: 7,
      name: "Почасовой",
      price: "10000",
    })
  })

  it("PUBLIC: строки «Взрослый» и «Детский»; guestCategory передаётся, kind — нет", async () => {
    const user = userEvent.setup()
    renderEditor(publicRoom)

    expect(screen.getByLabelText("Взрослый")).toBeInTheDocument()
    expect(screen.getByLabelText("Детский")).toBeInTheDocument()

    await user.type(screen.getByLabelText("Детский"), "1000")
    await user.click(screen.getAllByRole("button", { name: "Задать тариф" })[1])

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1))
    const [, body] = post.mock.calls[0]
    expect(body).toEqual({
      roomId: 8,
      name: "Детский",
      price: "1000",
      guestCategory: "CHILD",
    })
    expect(body).not.toHaveProperty("kind")
  })

  it("существующий тариф: кнопка «Сохранить» активна только после изменения цены, отправляется PATCH", async () => {
    const user = userEvent.setup()
    renderEditor({
      ...privateRoom,
      activeTariffs: [
        {
          id: 3,
          roomId: 7,
          kind: "HOURLY",
          guestCategory: null,
          name: "Почасовой",
          price: "10000.00",
          active: true,
        },
      ],
    })

    const input = screen.getByLabelText("Почасовой тариф")
    expect(input).toHaveValue("10000")
    const save = screen.getByRole("button", { name: "Сохранить" })
    expect(save).toBeDisabled()

    await user.clear(input)
    await user.type(input, "12000.5")
    await user.click(save)

    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith("/tariffs/3", { price: "12000.5" })
    )
  })

  it("некорректная цена блокирует сохранение", async () => {
    const user = userEvent.setup()
    renderEditor(privateRoom)
    await user.type(screen.getByLabelText("Почасовой тариф"), "1.")
    expect(screen.getByRole("button", { name: "Задать тариф" })).toBeDisabled()
  })
})
