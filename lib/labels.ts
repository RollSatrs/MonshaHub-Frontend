import type {
  GuestCategory,
  ManualMovementType,
  Room,
  RoomType,
  StockMovement,
} from "@/lib/api/types"
import { formatMoney } from "@/lib/money"

export const ROOM_TYPE_LABEL: Record<RoomType, string> = {
  PRIVATE: "Приватное",
  PUBLIC: "Общественное",
}

export const GUEST_LABEL: Record<GuestCategory, string> = {
  ADULT: "Взрослый",
  CHILD: "Детский",
}

export const MOVEMENT_LABEL: Record<StockMovement["type"], string> = {
  RESTOCK: "Пополнение",
  WRITE_OFF: "Списание",
  ADJUSTMENT: "Корректировка",
  SALE: "Продажа",
}

export const MANUAL_MOVEMENTS: { value: ManualMovementType; label: string }[] =
  [
    { value: "RESTOCK", label: "Пополнить" },
    { value: "WRITE_OFF", label: "Списать" },
    { value: "ADJUSTMENT", label: "Корректировка" },
  ]

/** Краткая строка тарифов помещения для списка. Цены — как пришли от backend. */
export function tariffSummary(room: Room, currency: string): string | null {
  if (!room.activeTariffs.length) return null
  return room.activeTariffs
    .map((t) =>
      t.kind === "HOURLY"
        ? `${formatMoney(t.price, currency)} / час`
        : `${t.guestCategory ? GUEST_LABEL[t.guestCategory] : t.name} ${formatMoney(t.price, currency)}`
    )
    .join(" · ")
}

export function formatDateTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone,
  }).format(new Date(iso))
}
