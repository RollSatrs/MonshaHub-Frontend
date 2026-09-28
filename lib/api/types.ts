import type { components } from "./schema"

/** Типы берутся из OpenAPI backend (pnpm api:types), не описываем модели вручную. */
export type Schemas = components["schemas"]
export type User = Schemas["UserResponseDto"]
export type Role = User["role"]
export type ApiErrorBody = Schemas["ErrorResponseDto"]
