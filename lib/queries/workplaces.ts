import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type {
  CreatedWorkplace,
  CreateWorkplaceInput,
  UpdateWorkplaceInput,
  Workplace,
} from "@/lib/api/types"

export const workplacesKey = ["workplaces"] as const

export function useWorkplaces() {
  return useQuery({
    queryKey: workplacesKey,
    queryFn: async () => (await api.get<Workplace[]>("/workplaces")).data,
  })
}

export function useCreateWorkplace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateWorkplaceInput) =>
      (await api.post<CreatedWorkplace>("/workplaces", input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: workplacesKey }),
  })
}

export function useUpdateWorkplace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: number
      input: UpdateWorkplaceInput
    }) => (await api.patch<Workplace>(`/workplaces/${id}`, input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: workplacesKey }),
  })
}
