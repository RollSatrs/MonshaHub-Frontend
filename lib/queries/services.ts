import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type {
  BathService,
  CreateBathServiceInput,
  UpdateBathServiceInput,
} from "@/lib/api/types"

export const servicesKey = ["services"] as const

export function useServices(includeInactive = false) {
  return useQuery({
    queryKey: [...servicesKey, { includeInactive }],
    queryFn: async () =>
      (
        await api.get<BathService[]>("/services", {
          params: { includeInactive },
        })
      ).data,
  })
}

function useInvalidateServices() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: servicesKey })
}

export function useCreateService() {
  const invalidate = useInvalidateServices()
  return useMutation({
    mutationFn: async (input: CreateBathServiceInput) =>
      (await api.post<BathService>("/services", input)).data,
    onSuccess: invalidate,
  })
}

export function useUpdateService() {
  const invalidate = useInvalidateServices()
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: UpdateBathServiceInput & { id: number }) =>
      (await api.patch<BathService>(`/services/${id}`, input)).data,
    onSuccess: invalidate,
  })
}

export function useDeleteService() {
  const invalidate = useInvalidateServices()
  return useMutation({
    mutationFn: async (id: number) => api.delete(`/services/${id}`),
    onSuccess: invalidate,
  })
}
