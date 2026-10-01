import { describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CatalogDialog } from "./catalog-dialog"

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const entries = [
  { id: 1, name: "Веник", price: "2500.00", stock: 10 },
  { id: 2, name: "Чай", price: "1500.00", stock: 0 },
]

function renderDialog(add = vi.fn().mockResolvedValue(undefined), extra = {}) {
  render(
    <CatalogDialog
      open
      onOpenChange={vi.fn()}
      title="Добавить товар"
      entries={entries}
      isPending={false}
      isError={false}
      onRetry={vi.fn()}
      currency="KZT"
      addedCounts={new Map([[1, 2]])}
      total="25000.00"
      add={add}
      {...extra}
    />
  )
  return add
}

describe("CatalogDialog", () => {
  it("тап по плитке добавляет одну единицу и не закрывает окно", async () => {
    const add = renderDialog()
    await userEvent.click(
      screen.getByRole("button", { name: "Добавить Веник" })
    )
    await waitFor(() => expect(add).toHaveBeenCalledWith(1))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("остаток и цена видны; нет в наличии — заблокировано; уже добавленное количество отмечено", () => {
    renderDialog()
    expect(screen.getByText(/10 шт\./)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Добавить Чай" })).toBeDisabled()
    expect(screen.getByText(/нет в наличии/)).toBeInTheDocument()
    expect(screen.getByText("×2")).toBeInTheDocument()
  })

  it("итог чека берётся из backend и показан под списком", () => {
    renderDialog()
    expect(screen.getByText(/Итог чека:/)).toHaveTextContent(/25\s000\s₸/)
  })

  it("ошибка добавления (например, кончился остаток) не ломает окно", async () => {
    const add = vi.fn().mockRejectedValue(new Error("boom"))
    renderDialog(add)
    await userEvent.click(
      screen.getByRole("button", { name: "Добавить Веник" })
    )
    await waitFor(() => expect(add).toHaveBeenCalled())
    expect(screen.getByRole("button", { name: "Добавить Веник" })).toBeEnabled()
  })

  it("пустой каталог и ошибка загрузки", () => {
    const { unmount } = render(
      <CatalogDialog
        open
        onOpenChange={vi.fn()}
        title="Добавить услугу"
        entries={[]}
        isPending={false}
        isError={false}
        onRetry={vi.fn()}
        currency="KZT"
        addedCounts={new Map()}
        total="0.00"
        add={vi.fn()}
      />
    )
    expect(screen.getByText(/Каталог пуст/)).toBeInTheDocument()
    unmount()
    render(
      <CatalogDialog
        open
        onOpenChange={vi.fn()}
        title="Добавить услугу"
        entries={undefined}
        isPending={false}
        isError
        onRetry={vi.fn()}
        currency="KZT"
        addedCounts={new Map()}
        total="0.00"
        add={vi.fn()}
      />
    )
    expect(screen.getByRole("alert")).toBeInTheDocument()
  })
})
