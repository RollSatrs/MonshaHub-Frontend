import { describe, expect, it } from "vitest"
import { AxiosError, AxiosHeaders } from "axios"
import { getErrorMessage } from "./get-error-message"

function makeAxiosError(message?: string) {
  return new AxiosError("Request failed", "400", undefined, undefined, {
    status: 400,
    statusText: "Bad Request",
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
    data: message ? { message } : {},
  })
}

describe("getErrorMessage", () => {
  it("возвращает message из ответа axios-ошибки", () => {
    expect(getErrorMessage(makeAxiosError("Неверный пароль"))).toBe(
      "Неверный пароль"
    )
  })

  it("возвращает fallback, если у axios-ошибки нет message", () => {
    expect(getErrorMessage(makeAxiosError(), "Произошла ошибка")).toBe(
      "Произошла ошибка"
    )
  })

  it("возвращает fallback для не-axios ошибок", () => {
    expect(getErrorMessage(new Error("boom"), "Произошла ошибка")).toBe(
      "Произошла ошибка"
    )
  })

  it("возвращает пустую строку по умолчанию, если fallback не передан", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("")
  })
})
