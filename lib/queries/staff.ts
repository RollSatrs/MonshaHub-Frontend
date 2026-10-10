import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type {
  CreateCashierInput,
  StaffMember,
  UpdateStaffInput,
} from "@/lib/api/types"

export const staffKey = ["staff"] as const

export function useStaff() {
  return useQuery({
    queryKey: staffKey,
    queryFn: async () => (await api.get<StaffMember[]>("/staff")).data,
  })
}

export function useCreateCashier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateCashierInput) =>
      (await api.post<StaffMember>("/staff/cashiers", input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: staffKey }),
  })
}

export function useSetStaffActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) =>
      (await api.patch<StaffMember>(`/staff/${id}`, { active })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: staffKey }),
  })
}

export function useUpdateStaff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: number
      input: UpdateStaffInput
    }) => (await api.patch<StaffMember>(`/staff/${id}`, input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: staffKey }),
  })
}
