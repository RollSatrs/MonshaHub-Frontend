import { describe, expect, it } from "vitest"
import {
  dayKey,
  durationOptions,
  formatCountdown,
  formatDuration,
  isoToZonedInputs,
  zonedTimeToIso,
} from "./time"

describe("time", () => {
  it("formatCountdown: часы:минуты:секунды, отрицательное — просрочка", () => {
    expect(formatCountdown(5292)).toBe("01:28:12")
    expect(formatCountdown(0)).toBe("00:00:00")
    expect(formatCountdown(59)).toBe("00:00:59")
    expect(formatCountdown(-312)).toBe("−00:05:12")
    expect(formatCountdown(3600 * 10 + 1)).toBe("10:00:01")
  })

  it("formatDuration", () => {
    expect(formatDuration(45)).toBe("45 мин")
    expect(formatDuration(60)).toBe("1 ч")
    expect(formatDuration(90)).toBe("1 ч 30 мин")
    expect(formatDuration(180)).toBe("3 ч")
  })

  it("zonedTimeToIso: время в поясе организации → правильный UTC (Asia/Almaty, UTC+5)", () => {
    expect(zonedTimeToIso("2026-01-01", "18:00", "Asia/Almaty")).toBe(
      "2026-01-01T13:00:00.000Z"
    )
    expect(zonedTimeToIso("2026-07-15", "00:30", "Asia/Almaty")).toBe(
      "2026-07-14T19:30:00.000Z"
    )
    expect(zonedTimeToIso("2026-01-01", "12:00", "UTC")).toBe(
      "2026-01-01T12:00:00.000Z"
    )
  })

  it("isoToZonedInputs — обратное преобразование", () => {
    expect(isoToZonedInputs("2026-01-01T13:00:00.000Z", "Asia/Almaty")).toEqual(
      {
        date: "2026-01-01",
        time: "18:00",
      }
    )
    const iso = zonedTimeToIso("2026-03-05", "09:15", "Asia/Almaty")
    expect(isoToZonedInputs(iso, "Asia/Almaty")).toEqual({
      date: "2026-03-05",
      time: "09:15",
    })
  })

  it("dayKey группирует по дню в поясе организации", () => {
    expect(dayKey("2026-01-01T20:00:00.000Z", "Asia/Almaty")).toBe("2026-01-02")
    expect(dayKey("2026-01-01T20:00:00.000Z", "UTC")).toBe("2026-01-01")
  })

  it("durationOptions: только кратные шагу", () => {
    expect(durationOptions(60)).toEqual([60, 120, 180, 240, 360])
    expect(durationOptions(30)).toEqual([30, 60, 90, 120, 180, 240, 360])
    expect(durationOptions(15)).toEqual([15, 60, 90, 120, 180, 240, 360])
  })
})
