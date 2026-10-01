import type {
  BookingStatus,
  GuestCategory,
  ManualMovementType,
  PaymentMethod,
  Room,
  RoomState,
  RoomType,
  StockMovement,
  VisitItem,
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
  SALE_RETURN: "Возврат в склад",
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

export const ROOM_STATE_LABEL: Record<RoomState, string> = {
  AVAILABLE: "СВОБОДНО",
  OCCUPIED: "ЗАНЯТО",
  ENDING_SOON: "ЗАКАНЧИВАЕТСЯ",
  OVERTIME: "ПРОСРОЧЕНО",
  CLEANING: "УБОРКА",
  OPEN: "ОТКРЫТ",
  FULL: "ЗАЛ ЗАПОЛНЕН",
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "Наличные",
  CARD: "Карта",
  KASPI: "Kaspi",
  OTHER: "Другое",
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  "CASH",
  "CARD",
  "KASPI",
  "OTHER",
]

export const PAYMENT_STATUS_LABEL = {
  UNPAID: "Не оплачено",
  PARTIAL: "Оплачено частично",
  PAID: "Оплачено",
} as const

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  BOOKED: "Ожидается",
  STARTED: "Начата",
  CANCELLED: "Отменена",
  NO_SHOW: "Не пришли",
}

export const VISIT_STATUS_LABEL = {
  ACTIVE: "Идёт",
  COMPLETED: "Завершено",
  CANCELLED: "Отменено",
} as const

export const ITEM_KIND_LABEL: Record<VisitItem["kind"], string> = {
  ROOM_TIME: "Время",
  ENTRY: "Вход",
  PRODUCT: "Товар",
  SERVICE: "Услуга",
}
