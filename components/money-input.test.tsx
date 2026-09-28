import { useState } from "react"
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MoneyInput } from "./money-input"

function Harness() {
  const [value, setValue] = useState("")
  return (
    <MoneyInput
      aria-label="Цена"
      value={value}
      onValueChange={setValue}
      suffix="₸"
    />
  )
}

describe("MoneyInput", () => {
  it("приводит ввод к формату API: запятая → точка, ≤ 2 знаков, без букв и минуса", async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const input = screen.getByLabelText("Цена")

    await user.type(input, "12,5abc-")
    expect(input).toHaveValue("12.5")

    await user.clear(input)
    await user.type(input, "1.999")
    expect(input).toHaveValue("1.99")
  })
})
