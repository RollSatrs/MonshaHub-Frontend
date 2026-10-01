import type { LiveBoard, LiveRoom, VisitDetail } from "@/lib/api/types"

/** Фикстуры для тестов: значения имитируют ответы backend (все суммы и состояния — «как от сервера»). */
export const SERVER_TIME = "2026-01-01T12:00:00.000Z"

export function liveRoom(over: Partial<LiveRoom> = {}): LiveRoom {
  return {
    id: 1,
    name: "VIP №1",
    type: "PRIVATE",
    capacity: 6,
    state: "AVAILABLE",
    visit: null,
    cleaningStartedAt: null,
    nextBooking: null,
    availableMinutes: null,
    inside: null,
    activeVisits: null,
    hasTariff: true,
    ...over,
  }
}

export function occupiedRoom(
  over: Partial<LiveRoom> = {},
  endsInMinutes = 87
): LiveRoom {
  return liveRoom({
    id: 2,
    name: "VIP №2",
    state: "OCCUPIED",
    visit: {
      id: 42,
      customerName: "Ержан",
      startedAt: "2026-01-01T11:00:00.000Z",
      endsAt: new Date(
        Date.parse(SERVER_TIME) + endsInMinutes * 60_000
      ).toISOString(),
      total: "31500.00",
      paid: "0.00",
      balance: "31500.00",
      paymentStatus: "UNPAID",
    },
    ...over,
  })
}

export function board(
  rooms: LiveRoom[],
  over: Partial<LiveBoard> = {}
): LiveBoard {
  return {
    serverTime: SERVER_TIME,
    endingSoonMinutes: 10,
    currency: "KZT",
    timezone: "Asia/Almaty",
    timeStepMinutes: 60,
    rooms,
    ...over,
  }
}

export function visitDetail(over: Partial<VisitDetail> = {}): VisitDetail {
  return {
    id: 42,
    kind: "PRIVATE",
    status: "ACTIVE",
    roomId: 2,
    roomName: "VIP №2",
    bookingId: null,
    customerName: "Ержан",
    customerPhone: "+7 707 111 22 33",
    guestsCount: null,
    startedAt: "2026-01-01T11:00:00.000Z",
    endsAt: "2026-01-01T13:00:00.000Z",
    endedAt: null,
    currency: "KZT",
    timeStepMinutes: 60,
    hourlyRate: "10000.00",
    timeState: "OCCUPIED",
    remainingSeconds: 3600,
    items: [
      {
        id: 1,
        kind: "ROOM_TIME",
        name: "Аренда помещения",
        unitPrice: "10000.00",
        quantity: 1,
        minutes: 120,
        guestCategory: null,
        lineTotal: "20000.00",
        voided: false,
        voidedAt: null,
        voidedByName: null,
        voidReason: null,
        createdAt: "2026-01-01T11:00:00.000Z",
        createdByName: "Демо Кассир",
      },
      {
        id: 2,
        kind: "PRODUCT",
        name: "Веник",
        unitPrice: "2500.00",
        quantity: 2,
        minutes: null,
        guestCategory: null,
        lineTotal: "5000.00",
        voided: false,
        voidedAt: null,
        voidedByName: null,
        voidReason: null,
        createdAt: "2026-01-01T11:10:00.000Z",
        createdByName: "Демо Кассир",
      },
    ],
    payments: [],
    total: "25000.00",
    paid: "0.00",
    balance: "25000.00",
    paymentStatus: "UNPAID",
    guests: null,
    completedByName: null,
    cancelledAt: null,
    cancelledByName: null,
    cancelReason: null,
    serverTime: SERVER_TIME,
    ...over,
  }
}
