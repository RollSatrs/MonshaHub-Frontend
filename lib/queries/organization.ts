import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { Organization } from "@/lib/api/types"

export const organizationKey = ["organization"] as const

export function useOrganization() {
  return useQuery({
    queryKey: organizationKey,
    queryFn: async () => (await api.get<Organization>("/organization")).data,
  })
}

export function useUpdateOrganization() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { name: string }) =>
      (await api.patch<Organization>("/organization", input)).data,
    onSuccess: (data) => qc.setQueryData(organizationKey, data),
  })
}
