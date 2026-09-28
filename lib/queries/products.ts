import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type {
  CreateProductInput,
  CreateStockMovementInput,
  Product,
  StockMovement,
  StockMovementResult,
  UpdateProductInput,
} from "@/lib/api/types"

export const productsKey = ["products"] as const

export function useProducts(includeInactive = false) {
  return useQuery({
    queryKey: [...productsKey, { includeInactive }],
    queryFn: async () =>
      (await api.get<Product[]>("/products", { params: { includeInactive } }))
        .data,
  })
}

export function useStockMovements(productId: number | null) {
  return useQuery({
    queryKey: [...productsKey, "movements", productId],
    queryFn: async () =>
      (await api.get<StockMovement[]>(`/products/${productId}/stock-movements`))
        .data,
    enabled: productId !== null,
  })
}

function useInvalidateProducts() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: productsKey })
}

export function useCreateProduct() {
  const invalidate = useInvalidateProducts()
  return useMutation({
    mutationFn: async (input: CreateProductInput) =>
      (await api.post<Product>("/products", input)).data,
    onSuccess: invalidate,
  })
}

export function useUpdateProduct() {
  const invalidate = useInvalidateProducts()
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateProductInput & { id: number }) =>
      (await api.patch<Product>(`/products/${id}`, input)).data,
    onSuccess: invalidate,
  })
}

export function useDeleteProduct() {
  const invalidate = useInvalidateProducts()
  return useMutation({
    mutationFn: async (id: number) => api.delete(`/products/${id}`),
    onSuccess: invalidate,
  })
}

export function useAddStockMovement() {
  const invalidate = useInvalidateProducts()
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: CreateStockMovementInput & { id: number }) =>
      (
        await api.post<StockMovementResult>(
          `/products/${id}/stock-movements`,
          input
        )
      ).data,
    onSuccess: invalidate,
  })
}
