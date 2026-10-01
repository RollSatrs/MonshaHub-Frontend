import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { Inside, LiveBoard } from "@/lib/api/types"

export const liveKey = ["live"] as const

/** Интервал опроса «Бани сейчас». Между опросами таймеры идут локально от серверного endsAt. */
export const BOARD_REFETCH_MS = 10_000

export function useBoard() {
  return useQuery({
    queryKey: [...liveKey, "board"],
    queryFn: async () => (await api.get<LiveBoard>("/live/board")).data,
    refetchInterval: BOARD_REFETCH_MS,
    // при возврате на вкладку сразу актуализируем
    refetchOnWindowFocus: true,
    staleTime: 0,
  })
}

export function useInside(roomId: number | null) {
  return useQuery({
    queryKey: [...liveKey, "inside", roomId],
    queryFn: async () =>
      (await api.get<Inside>(`/rooms/${roomId}/inside`)).data,
    enabled: roomId !== null,
    refetchInterval: BOARD_REFETCH_MS,
    staleTime: 0,
  })
}

export function useFinishCleaning() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (roomId: number) =>
      (await api.post(`/rooms/${roomId}/finish-cleaning`)).data,
    onSettled: () => qc.invalidateQueries({ queryKey: liveKey }),
  })
}

export function useCompletePaid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (roomId: number) =>
      (await api.post<{ completed: number }>(`/rooms/${roomId}/complete-paid`))
        .data,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: liveKey })
      qc.invalidateQueries({ queryKey: ["visits"] })
    },
  })
}
