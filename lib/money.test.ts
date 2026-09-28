import { describe, expect, it } from "vitest"
import { formatMoney, isValidMoney, sanitizeMoneyInput } from "./money"

describe("money", () => {
  it("formatMoney форматирует decimal-строку без расчётов", () => {
    expect(formatMoney("10000.00").replace(/\s/g, " ")).toBe("10 000 ₸")
    expect(formatMoney("2500.50").replace(/\s/g, " ")).toBe("2 500,50 ₸")
    expect(formatMoney("0.00").replace(/\s/g, " ")).toBe("0 ₸")
  })

  it("formatMoney не падает на мусоре", () => {
    expect(formatMoney("abc")).toBe("abc")
  })

  it("sanitizeMoneyInput приводит ввод к формату API", () => {
    expect(sanitizeMoneyInput("10 000")).toBe("10000")
    expect(sanitizeMoneyInput("12,5")).toBe("12.5")
    expect(sanitizeMoneyInput("1.234")).toBe("1.23")
    expect(sanitizeMoneyInput("1.2.3")).toBe("1.23")
    expect(sanitizeMoneyInput("-5")).toBe("5")
    expect(sanitizeMoneyInput("abc")).toBe("")
    expect(sanitizeMoneyInput("123456789012")).toBe("1234567890")
  })

  it("isValidMoney совпадает с контрактом backend", () => {
    for (const ok of ["0", "10000", "10000.5", "0.01"])
      expect(isValidMoney(ok)).toBe(true)
    for (const bad of ["", "-1", "1.234", "1,5", ".5", "1.", "12345678901"])
      expect(isValidMoney(bad)).toBe(false)
  })
})
