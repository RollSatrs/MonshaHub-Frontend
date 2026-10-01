import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query"
import { api } from "@/lib/api"
import type {
  GuestInput,
  PaymentMethod,
  StartPrivateVisitInput,
  StartPublicVisitInput,
  VisitDetail,
  VisitList,
} from "@/lib/api/types"
import { liveKey } from "./live"
import { bookingsKey } from "./bookings"
import { productsKey } from "./products"

export const visitsKey = ["visits"] as const
export const visitKey = (id: number) => ["visit", id] as const

/** Опрос активного посещения; у завершённого/отменённого прекращается. */
export const VISIT_REFETCH_MS = 15_000

export function useVisit(id: number) {
  return useQuery({
    queryKey: visitKey(id),
    queryFn: async () => (await api.get<VisitDetail>(`/visits/${id}`)).data,
    enabled: Number.isInteger(id) && id > 0,
    refetchInterval: (query) =>
      query.state.data?.status === "ACTIVE" ? VISIT_REFETCH_MS : false,
    staleTime: 0,
  })
}

export interface HistoryFilters {
  status?: "COMPLETED" | "CANCELLED"
  roomId?: number
  limit?: number
  offset?: number
}

export function useHistory(filters: HistoryFilters) {
  return useQuery({
    queryKey: [...visitsKey, "history", filters],
    queryFn: async () =>
      (await api.get<VisitList>("/visits", { params: filters })).data,
  })
}

/** После любой операции с посещением: обновляем сам чек, «Баню сейчас», историю, остатки и брони. */
function afterVisitChange(qc: QueryClient, visit?: VisitDetail) {
  if (visit) qc.setQueryData(visitKey(visit.id), visit)
  qc.invalidateQueries({ queryKey: liveKey })
  qc.invalidateQueries({ queryKey: visitsKey })
  qc.invalidateQueries({ queryKey: bookingsKey })
  qc.invalidateQueries({ queryKey: productsKey })
}

export function useStartPrivateVisit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: StartPrivateVisitInput) =>
      (await api.post<VisitDetail>("/visits/private", input)).data,
    onSuccess: (v) => afterVisitChange(qc, v),
    onError: () => afterVisitChange(qc),
  })
}

export function useStartPublicVisit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: StartPublicVisitInput) =>
      (await api.post<VisitDetail>("/visits/public", input)).data,
    onSuccess: (v) => afterVisitChange(qc, v),
    onError: () => afterVisitChange(qc),
  })
}

function visitAction<TInput>(
  path: (id: number, input: TInput) => string,
  body: (input: TInput) => unknown
) {
  return function useAction(visitId: number) {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: async (input: TInput) =>
        (await api.post<VisitDetail>(path(visitId, input), body(input))).data,
      onSuccess: (v) => afterVisitChange(qc, v),
      // на ошибке (например, посещение уже завершили на другом кассе) — перечитать актуальное состояние
      onError: () => {
        qc.invalidateQueries({ queryKey: visitKey(visitId) })
        qc.invalidateQueries({ queryKey: liveKey })
        qc.invalidateQueries({ queryKey: productsKey })
      },
    })
  }
}

export const useAddProduct = visitAction<{
  productId: number
  quantity: number
}>(
  (id) => `/visits/${id}/products`,
  (i) => i
)
export const useAddService = visitAction<{
  serviceId: number
  quantity: number
}>(
  (id) => `/visits/${id}/services`,
  (i) => i
)
export const useAddGuests = visitAction<{ guests: GuestInput[] }>(
  (id) => `/visits/${id}/guests`,
  (i) => i
)
export const useExtendVisit = visitAction<{ minutes: number }>(
  (id) => `/visits/${id}/extend`,
  (i) => i
)
export const useVoidItem = visitAction<{ itemId: number; reason: string }>(
  (id, i) => `/visits/${id}/items/${i.itemId}/void`,
  (i) => ({ reason: i.reason })
)
export const useAddPayment = visitAction<{
  method: PaymentMethod
  amount: string
}>(
  (id) => `/visits/${id}/payments`,
  (i) => i
)
export const useCompleteVisit = visitAction<{
  payments?: { method: PaymentMethod; amount: string }[]
}>(
  (id) => `/visits/${id}/complete`,
  (i) => i
)
export const useCancelVisit = visitAction<{ reason: string }>(
  (id) => `/visits/${id}/cancel`,
  (i) => i
)
