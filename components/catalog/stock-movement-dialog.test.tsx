import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { StockMovementDialog } from "./stock-movement-dialog"
import type { Product } from "@/lib/api/types"

const post = vi.fn()
vi.mock("@/lib/api", () => ({ api: { post: (...a: unknown[]) => post(...a) } }))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const product: Product = {
  id: 5,
  name: "Веник",
  price: "2500.00",
  stock: 10,
  active: true,
}

function renderDialog() {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <StockMovementDialog product={product} onOpenChange={vi.fn()} />
    </QueryClientProvider>
  )
}

describe("StockMovementDialog", () => {
  beforeEach(() => {
    post.mockReset().mockResolvedValue({
      data: { product: { ...product, stock: 7 }, movement: {} },
    })
  })

  it("пополнение отправляет положительную дельту без причины", async () => {
    const user = userEvent.setup()
    renderDialog()
    await user.type(screen.getByLabelText("Количество"), "5")
    await user.click(screen.getByRole("button", { name: "Применить" }))
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/products/5/stock-movements", {
        type: "RESTOCK",
        quantityDelta: 5,
      })
    )
  })

  it("списание требует причину и отправляет отрицательную дельту", async () => {
    const user = userEvent.setup()
    renderDialog()
    await user.click(screen.getByRole("radio", { name: "Списать" }))
    await user.type(screen.getByLabelText("Количество"), "3")

    await user.click(screen.getByRole("button", { name: "Применить" }))
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Укажите причину"
    )
    expect(post).not.toHaveBeenCalled()

    await user.type(screen.getByLabelText("Причина"), "Порча")
    await user.click(screen.getByRole("button", { name: "Применить" }))
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/products/5/stock-movements", {
        type: "WRITE_OFF",
        quantityDelta: -3,
        reason: "Порча",
      })
    )
  })

  it("корректировка в минус: знак берётся из выбора направления", async () => {
    const user = userEvent.setup()
    renderDialog()
    await user.click(screen.getByRole("radio", { name: "Корректировка" }))
    await user.click(screen.getByRole("radio", { name: /Меньше/ }))
    await user.type(screen.getByLabelText("Количество"), "2")
    await user.type(screen.getByLabelText("Причина"), "Инвентаризация")
    await user.click(screen.getByRole("button", { name: "Применить" }))
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/products/5/stock-movements", {
        type: "ADJUSTMENT",
        quantityDelta: -2,
        reason: "Инвентаризация",
      })
    )
  })

  it("ошибка backend (INSUFFICIENT_STOCK) показывается пользователю", async () => {
    const { AxiosError } = await import("axios")
    post.mockRejectedValueOnce(
      new AxiosError("x", "409", undefined, undefined, {
        status: 409,
        statusText: "",
        headers: {},
        config: {} as never,
        data: {
          code: "INSUFFICIENT_STOCK",
          message: "Недостаточно товара на складе",
        },
      })
    )
    const user = userEvent.setup()
    renderDialog()
    await user.type(screen.getByLabelText("Количество"), "5")
    await user.click(screen.getByRole("button", { name: "Применить" }))
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Недостаточно товара на складе"
    )
  })
})
