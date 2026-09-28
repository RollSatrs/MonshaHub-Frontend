import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { LoginForm } from "./login-form"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe("LoginForm", () => {
  it("показывает ошибку валидации и не отправляет запрос при коротком пароле", async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText("Email"), "user@example.com")
    await user.type(screen.getByLabelText("Пароль"), "123")
    await user.click(screen.getByRole("button", { name: /войти/i }))

    expect(
      await screen.findByText("Пароль должен содержать не менее 8 символов.")
    ).toBeInTheDocument()
  })
})
