import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type {
  CreateRoomInput,
  CreateTariffInput,
  Room,
  Tariff,
  UpdateRoomInput,
  UpdateTariffInput,
} from "@/lib/api/types"

export const roomsKey = ["rooms"] as const

export function useRooms(includeInactive = false) {
  return useQuery({
    queryKey: [...roomsKey, { includeInactive }],
    queryFn: async () =>
      (await api.get<Room[]>("/rooms", { params: { includeInactive } })).data,
  })
}

export function useRoom(id: number) {
  return useQuery({
    queryKey: [...roomsKey, "detail", id],
    queryFn: async () => (await api.get<Room>(`/rooms/${id}`)).data,
    enabled: Number.isInteger(id) && id > 0,
  })
}

function useInvalidateRooms() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: roomsKey })
}

export function useCreateRoom() {
  const invalidate = useInvalidateRooms()
  return useMutation({
    mutationFn: async (input: CreateRoomInput) =>
      (await api.post<Room>("/rooms", input)).data,
    onSuccess: invalidate,
  })
}

export function useUpdateRoom(id: number) {
  const invalidate = useInvalidateRooms()
  return useMutation({
    mutationFn: async (input: UpdateRoomInput) =>
      (await api.patch<Room>(`/rooms/${id}`, input)).data,
    onSuccess: invalidate,
  })
}

export function useDeleteRoom() {
  const invalidate = useInvalidateRooms()
  return useMutation({
    mutationFn: async (id: number) => api.delete(`/rooms/${id}`),
    onSuccess: invalidate,
  })
}

// Тарифы всегда читаются вместе с помещением (Room.activeTariffs), поэтому меняем — инвалидируем rooms.

export function useCreateTariff() {
  const invalidate = useInvalidateRooms()
  return useMutation({
    mutationFn: async (input: CreateTariffInput) =>
      (await api.post<Tariff>("/tariffs", input)).data,
    onSuccess: invalidate,
  })
}

export function useUpdateTariff() {
  const invalidate = useInvalidateRooms()
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateTariffInput & { id: number }) =>
      (await api.patch<Tariff>(`/tariffs/${id}`, input)).data,
    onSuccess: invalidate,
  })
}
