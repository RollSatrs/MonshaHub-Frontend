import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type {
  Branch,
  CreateBranchInput,
  UpdateBranchInput,
} from "@/lib/api/types"

export const branchesKey = ["branches"] as const
export const currentBranchKey = ["branches", "current"] as const

export function useBranches(enabled = true) {
  return useQuery({
    queryKey: branchesKey,
    queryFn: async () => (await api.get<Branch[]>("/branches")).data,
    enabled,
  })
}

export function useCurrentBranch() {
  return useQuery({
    queryKey: currentBranchKey,
    queryFn: async () => (await api.get<Branch>("/branches/current")).data,
  })
}

export function useCreateBranch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateBranchInput) =>
      (await api.post<Branch>("/branches", input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: branchesKey }),
  })
}

export function useUpdateBranch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: number
      input: UpdateBranchInput
    }) => (await api.patch<Branch>(`/branches/${id}`, input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: branchesKey }),
  })
}
