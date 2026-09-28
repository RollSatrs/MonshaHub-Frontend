import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import ProductsPage from "./page"

const get = vi.fn()
vi.mock("@/lib/api", () => ({
  api: { get: (...a: unknown[]) => get(...a), patch: vi.fn(), post: vi.fn() },
}))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const org = { id: 1, name: "Баня", currency: "KZT", timezone: "Asia/Almaty" }

function mockApi(products: unknown[] | Error) {
  get.mockImplementation(async (url: string) => {
    if (url === "/organization") return { data: org }
    if (url === "/products") {
      if (products instanceof Error) throw products
      return { data: products }
    }
    throw new Error(`unexpected ${url}`)
  })
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <ProductsPage />
    </QueryClientProvider>
  )
}

describe("ProductsPage", () => {
  beforeEach(() => {
    get.mockReset()
  })

  it("показывает товары: цены форматируются из decimal-строк, нулевой остаток помечен текстом", async () => {
    mockApi([
      { id: 1, name: "Веник", price: "2500.00", stock: 50, active: true },
      { id: 2, name: "Вода", price: "500.50", stock: 0, active: true },
    ])
    renderPage()

    expect(await screen.findByText("Веник")).toBeInTheDocument()
    expect(screen.getByText(/2\s500\s₸/)).toBeInTheDocument()
    expect(screen.getByText(/500,50\s₸/)).toBeInTheDocument()
    expect(screen.getByText("50")).toBeInTheDocument()
    expect(screen.getByText(/Нет в наличии/)).toBeInTheDocument()
  })

  it("пустой список: empty state с действием", async () => {
    mockApi([])
    renderPage()
    expect(await screen.findByText("Товаров пока нет")).toBeInTheDocument()
    expect(
      screen.getAllByRole("button", { name: /Добавить товар/ }).length
    ).toBeGreaterThan(0)
  })

  it("ошибка загрузки: сообщение и кнопка «Повторить» перезапрашивает данные", async () => {
    mockApi(new Error("network"))
    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Не удалось загрузить данные"
    )

    mockApi([
      { id: 1, name: "Веник", price: "2500.00", stock: 5, active: true },
    ])
    await user.click(screen.getByRole("button", { name: "Повторить" }))
    expect(await screen.findByText("Веник")).toBeInTheDocument()
  })

  it("«Показать архивные» запрашивает includeInactive=true", async () => {
    mockApi([])
    const user = userEvent.setup()
    renderPage()
    await screen.findByText("Товаров пока нет")

    await user.click(screen.getByRole("switch", { name: "Показать архивные" }))
    await screen.findByText("Товаров пока нет")
    expect(get).toHaveBeenCalledWith("/products", {
      params: { includeInactive: true },
    })
  })
})
