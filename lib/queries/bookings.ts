import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type {
  Booking,
  CreateBookingInput,
  UpdateBookingInput,
  VisitDetail,
} from "@/lib/api/types"
import { liveKey } from "./live"
import { visitKey, visitsKey } from "./visits"

export const bookingsKey = ["bookings"] as const

/** Предстоящие брони (BOOKED), обновляются раз в минуту. */
export const BOOKINGS_REFETCH_MS = 60_000

export function useBookings(
  params: { from?: string; to?: string; roomId?: number } = {}
) {
  return useQuery({
    queryKey: [...bookingsKey, params],
    queryFn: async () =>
      (await api.get<Booking[]>("/bookings", { params })).data,
    refetchInterval: BOOKINGS_REFETCH_MS,
  })
}

function useInvalidateBookings() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: bookingsKey })
    qc.invalidateQueries({ queryKey: liveKey })
  }
}

export function useCreateBooking() {
  const invalidate = useInvalidateBookings()
  return useMutation({
    mutationFn: async (input: CreateBookingInput) =>
      (await api.post<Booking>("/bookings", input)).data,
    onSuccess: invalidate,
  })
}

export function useUpdateBooking() {
  const invalidate = useInvalidateBookings()
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateBookingInput & { id: number }) =>
      (await api.patch<Booking>(`/bookings/${id}`, input)).data,
    onSuccess: invalidate,
  })
}

export function useCloseBooking() {
  const invalidate = useInvalidateBookings()
  return useMutation({
    mutationFn: async ({
      id,
      kind,
      reason,
    }: {
      id: number
      kind: "cancel" | "no-show"
      reason?: string
    }) =>
      (
        await api.post<Booking>(
          `/bookings/${id}/${kind}`,
          reason ? { reason } : {}
        )
      ).data,
    onSuccess: invalidate,
  })
}

export function useStartBookingVisit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      durationMinutes,
    }: {
      id: number
      durationMinutes?: number
    }) =>
      (
        await api.post<VisitDetail>(
          `/bookings/${id}/start-visit`,
          durationMinutes ? { durationMinutes } : {}
        )
      ).data,
    onSuccess: (v) => {
      qc.setQueryData(visitKey(v.id), v)
      qc.invalidateQueries({ queryKey: bookingsKey })
      qc.invalidateQueries({ queryKey: liveKey })
      qc.invalidateQueries({ queryKey: visitsKey })
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: bookingsKey })
      qc.invalidateQueries({ queryKey: liveKey })
    },
  })
}
