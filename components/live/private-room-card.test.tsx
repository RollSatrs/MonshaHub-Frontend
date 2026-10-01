import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PrivateRoomCard } from "./private-room-card"
import { liveRoom, occupiedRoom, SERVER_TIME } from "@/lib/test-fixtures"

const base = {
  nowMs: Date.parse(SERVER_TIME),
  currency: "KZT",
  timezone: "Asia/Almaty",
  onStart: vi.fn(),
  onFinishCleaning: vi.fn(),
  cleaningPending: false,
}

describe("PrivateRoomCard", () => {
  it("СВОБОДНО: слово в карточке, нажатие открывает старт посещения", async () => {
    const onStart = vi.fn()
    const room = liveRoom({ name: "Семейный зал" })
    render(<PrivateRoomCard {...base} room={room} onStart={onStart} />)

    expect(screen.getByText("СВОБОДНО")).toBeInTheDocument()
    expect(screen.getByText("Ближайших броней нет")).toBeInTheDocument()
    await userEvent.click(
      screen.getByRole("button", { name: /свободно, начать посещение/ })
    )
    expect(onStart).toHaveBeenCalledWith(room)
  })

  it("СВОБОДНО с ближайшей бронью: время брони и сколько минут свободно (значения от backend)", () => {
    render(
      <PrivateRoomCard
        {...base}
        room={liveRoom({
          nextBooking: {
            id: 9,
            customerName: "Мадина",
            startsAt: "2026-01-01T14:00:00.000Z",
            endsAt: "2026-01-01T16:00:00.000Z",
          },
          availableMinutes: 120,
        })}
      />
    )
    expect(screen.getByText(/Бронь в 19:00 · Мадина/)).toBeInTheDocument()
    expect(screen.getByText(/свободно 2 ч/)).toBeInTheDocument()
  })

  it("нет тарифа: предупреждение, карточка остаётся кликабельной для объяснения", () => {
    render(<PrivateRoomCard {...base} room={liveRoom({ hasTariff: false })} />)
    expect(screen.getByText(/Не задан тариф/)).toBeInTheDocument()
  })

  it("ЗАНЯТО: ссылка на посещение, крупный таймер от серверного endsAt, сумма и остаток", () => {
    // до конца 1 ч 27 мин 43 с
    const room = occupiedRoom({}, 87)
    room.visit!.endsAt = new Date(
      Date.parse(SERVER_TIME) + (87 * 60 + 43) * 1000
    ).toISOString()
    render(<PrivateRoomCard {...base} room={room} />)

    expect(screen.getByRole("link")).toHaveAttribute("href", "/visits/42")
    expect(screen.getByText("ЗАНЯТО")).toBeInTheDocument()
    expect(screen.getByLabelText("Оставшееся время")).toHaveTextContent(
      "01:27:43"
    )
    expect(
      screen.getByText(/31\s500\s₸/, { selector: "p.text-xl" })
    ).toBeInTheDocument()
    expect(screen.getByText(/Осталось оплатить/)).toBeInTheDocument()
    expect(screen.getByText("Ержан")).toBeInTheDocument()
  })

  it("таймер идёт от переданного «сейчас»: через 10 минут остаётся на 10 минут меньше", () => {
    const room = occupiedRoom({}, 87)
    const { rerender } = render(<PrivateRoomCard {...base} room={room} />)
    expect(screen.getByLabelText("Оставшееся время")).toHaveTextContent(
      "01:27:00"
    )
    rerender(
      <PrivateRoomCard {...base} room={room} nowMs={base.nowMs + 10 * 60_000} />
    )
    expect(screen.getByLabelText("Оставшееся время")).toHaveTextContent(
      "01:17:00"
    )
  })

  it("ЗАКАНЧИВАЕТСЯ и ПРОСРОЧЕНО подписаны словами; просрочка — отрицательный таймер", () => {
    const { rerender } = render(
      <PrivateRoomCard
        {...base}
        room={occupiedRoom({ state: "ENDING_SOON" }, 8)}
      />
    )
    expect(screen.getByText("ЗАКАНЧИВАЕТСЯ")).toBeInTheDocument()
    expect(screen.getByLabelText("Оставшееся время")).toHaveTextContent(
      "00:08:00"
    )

    rerender(
      <PrivateRoomCard
        {...base}
        room={occupiedRoom({ state: "OVERTIME" }, -5)}
      />
    )
    expect(screen.getByText("ПРОСРОЧЕНО")).toBeInTheDocument()
    expect(screen.getByLabelText("Оставшееся время")).toHaveTextContent(
      "−00:05:00"
    )
  })

  it("оплачено полностью: вместо остатка — «Оплачено»", () => {
    const room = occupiedRoom({}, 30)
    room.visit!.balance = "0.00"
    room.visit!.paid = room.visit!.total
    room.visit!.paymentStatus = "PAID"
    render(<PrivateRoomCard {...base} room={room} />)
    expect(screen.getByText("Оплачено")).toBeInTheDocument()
  })

  it("УБОРКА: не ссылка, кнопка «Уборка завершена»", async () => {
    const onFinishCleaning = vi.fn()
    const room = liveRoom({
      state: "CLEANING",
      cleaningStartedAt: "2026-01-01T11:40:00.000Z",
    })
    render(
      <PrivateRoomCard
        {...base}
        room={room}
        onFinishCleaning={onFinishCleaning}
      />
    )

    expect(screen.getByText("УБОРКА")).toBeInTheDocument()
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
    await userEvent.click(
      screen.getByRole("button", { name: "Уборка завершена" })
    )
    expect(onFinishCleaning).toHaveBeenCalledWith(room)
  })

  it("во время сохранения кнопка уборки заблокирована", () => {
    render(
      <PrivateRoomCard
        {...base}
        room={liveRoom({ state: "CLEANING" })}
        cleaningPending
      />
    )
    expect(screen.getByRole("button", { name: "Сохраняем…" })).toBeDisabled()
  })
})
