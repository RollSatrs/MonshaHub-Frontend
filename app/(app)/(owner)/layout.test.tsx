import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import OwnerLayout from "./layout"

const replace = vi.fn()
let role: "OWNER" | "CASHIER" = "OWNER"
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }))
vi.mock("@/hooks/use-current-user", () => ({
  useCurrentUser: () => ({ role }),
}))

describe("OwnerLayout", () => {
  beforeEach(() => {
    replace.mockReset()
  })

  it("OWNER видит содержимое", () => {
    role = "OWNER"
    render(<OwnerLayout>секретные настройки</OwnerLayout>)
    expect(screen.getByText("секретные настройки")).toBeInTheDocument()
    expect(replace).not.toHaveBeenCalled()
  })

  it("CASHIER не видит содержимое и возвращается на главную", () => {
    role = "CASHIER"
    render(<OwnerLayout>секретные настройки</OwnerLayout>)
    expect(screen.queryByText("секретные настройки")).not.toBeInTheDocument()
    expect(replace).toHaveBeenCalledWith("/")
  })
})
