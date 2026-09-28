import { describe, expect, it } from "vitest"
import { AxiosError } from "axios"
import { getErrorMessage, parseApiError } from "./get-error-message"

function axiosErr(data: unknown) {
  return new AxiosError("fail", "ERR", undefined, undefined, {
    data,
    status: 400,
    statusText: "",
    headers: {},
    config: {} as never,
  })
}

describe("parseApiError", () => {
  it("читает code, message и details", () => {
    const e = axiosErr({ code: "BOOKING_CONFLICT", message: "Занято" })
    expect(parseApiError(e)).toMatchObject({
      code: "BOOKING_CONFLICT",
      message: "Занято",
    })
  })

  it("возвращает fallback для не-axios ошибок", () => {
    expect(parseApiError(new Error("x"), "Ошибка")).toEqual({
      message: "Ошибка",
    })
  })
})

describe("getErrorMessage", () => {
  it("для VALIDATION_ERROR показывает первую деталь", () => {
    const e = axiosErr({
      code: "VALIDATION_ERROR",
      message: "Ошибка валидации",
      details: ["email must be an email"],
    })
    expect(getErrorMessage(e)).toBe("email must be an email")
  })

  it("для обычной ошибки показывает message", () => {
    expect(
      getErrorMessage(
        axiosErr({ code: "FORBIDDEN", message: "Недостаточно прав" })
      )
    ).toBe("Недостаточно прав")
  })

  it("возвращает fallback без ответа", () => {
    expect(getErrorMessage(new Error("x"), "fallback")).toBe("fallback")
  })
})
