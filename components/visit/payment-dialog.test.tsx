import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { PaymentDialog } from "./payment-dialog"
import { visitDetail } from "@/lib/test-fixtures"

const post = vi.fn()
vi.mock("@/lib/api", () => ({ api: { post: (...a: unknown[]) => post(...a) } }))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

function renderDialog(over = {}, onCompleted = vi.fn()) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  const visit = visitDetail(over)
  render(
    <QueryClientProvider client={client}>
      <PaymentDialog
        visit={visit}
        open
        onOpenChange={vi.fn()}
        onCompleted={onCompleted}
      />
    </QueryClientProvider>
  )
  return { visit, onCompleted }
}

describe("PaymentDialog", () => {
  beforeEach(() => {
    post.mockReset().mockResolvedValue({
      data: visitDetail({ balance: "0.00", status: "COMPLETED" }),
    })
  })

  it("показывает остаток от backend и подставляет его в сумму", () => {
    renderDialog()
    expect(screen.getByLabelText("Осталось оплатить")).toHaveTextContent(
      /25\s000\s₸/
    )
    expect(screen.getByLabelText("Сумма")).toHaveValue("25000")
  })

  it("«Оплатить и завершить»: платёж и завершение одним запросом complete", async () => {
    const { onCompleted } = renderDialog()
    await userEvent.click(screen.getByRole("button", { name: "Kaspi" }))
    await userEvent.click(
      screen.getByRole("button", { name: /Оплатить .* и завершить/ })
    )

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/visits/42/complete", {
        payments: [{ method: "KASPI", amount: "25000" }],
      })
    )
    await waitFor(() => expect(onCompleted).toHaveBeenCalled())
  })

  it("частичная оплата: «Оплатить и завершить» недоступно, «Принять платёж» шлёт /payments", async () => {
    renderDialog()
    const amount = screen.getByLabelText("Сумма")
    await userEvent.clear(amount)
    await userEvent.type(amount, "10000")

    expect(
      screen.getByRole("button", { name: /Оплатить .* и завершить/ })
    ).toBeDisabled()
    await userEvent.click(
      screen.getByRole("button", { name: /Принять платёж/ })
    )
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/visits/42/payments", {
        method: "CASH",
        amount: "10000",
      })
    )
  })

  it("«Весь остаток» возвращает полную сумму", async () => {
    renderDialog()
    const amount = screen.getByLabelText("Сумма")
    await userEvent.clear(amount)
    await userEvent.type(amount, "1")
    await userEvent.click(screen.getByRole("button", { name: "Весь остаток" }))
    expect(amount).toHaveValue("25000")
  })

  it("нулевой остаток: только «Завершить» без платежей", async () => {
    renderDialog({ balance: "0.00", paid: "25000.00", paymentStatus: "PAID" })
    expect(screen.queryByLabelText("Сумма")).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Завершить" }))
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/visits/42/complete", {})
    )
  })

  it("сумма больше остатка (ответ backend): понятная ошибка", async () => {
    post.mockRejectedValueOnce(
      new AxiosError("x", "409", undefined, undefined, {
        status: 409,
        statusText: "",
        headers: {},
        config: {} as never,
        data: {
          code: "PAYMENT_EXCEEDS_BALANCE",
          message: "Сумма платежа больше остатка к оплате",
        },
      })
    )
    renderDialog()
    await userEvent.click(
      screen.getByRole("button", { name: /Оплатить .* и завершить/ })
    )
    expect(await screen.findByRole("alert")).toHaveTextContent("больше остатка")
  })

  it("завершённое посещение: оплата недоступна", () => {
    renderDialog({ status: "COMPLETED" })
    expect(
      screen.getByRole("button", { name: /Оплатить .* и завершить/ })
    ).toBeDisabled()
    expect(
      screen.getByRole("button", { name: /Принять платёж/ })
    ).toBeDisabled()
  })

  it("некорректная сумма блокирует кнопки", async () => {
    renderDialog()
    const amount = screen.getByLabelText("Сумма")
    await userEvent.clear(amount)
    expect(
      screen.getByRole("button", { name: /Принять платёж/ })
    ).toBeDisabled()
  })
})
