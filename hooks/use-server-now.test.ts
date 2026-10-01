import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, renderHook } from "@testing-library/react"
import { useServerNow } from "./use-server-now"

describe("useServerNow", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("возвращает серверное время с поправкой: часы кассы отстают на 5 минут — отсчёт всё равно по серверу", () => {
    // касса думает, что сейчас 12:00:00; сервер в момент ответа сказал 12:05:00
    vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"))
    const receivedAt = Date.now()
    const { result } = renderHook(() =>
      useServerNow("2026-01-01T12:05:00.000Z", receivedAt)
    )
    expect(result.current).toBe(Date.parse("2026-01-01T12:05:00.000Z"))
  })

  it("время идёт локально: через 3 секунды — на 3 секунды позже", () => {
    vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"))
    const receivedAt = Date.now()
    const { result } = renderHook(() =>
      useServerNow("2026-01-01T12:05:00.000Z", receivedAt)
    )
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(result.current).toBe(Date.parse("2026-01-01T12:05:03.000Z"))
  })

  it("без serverTime возвращает локальное время", () => {
    vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"))
    const { result } = renderHook(() => useServerNow(undefined, 0))
    expect(result.current).toBe(Date.parse("2026-01-01T12:00:00.000Z"))
  })
})
