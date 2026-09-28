import type { components } from "./schema"

/** Типы берутся из OpenAPI backend (pnpm api:types), не описываем модели вручную. */
export type Schemas = components["schemas"]

export type User = Schemas["UserResponseDto"]
export type Role = User["role"]
export type ApiErrorBody = Schemas["ErrorResponseDto"]

export type Organization = Schemas["OrganizationResponseDto"]
export type Room = Schemas["RoomResponseDto"]
export type RoomType = Room["type"]
export type Tariff = Schemas["TariffResponseDto"]
export type GuestCategory = NonNullable<Tariff["guestCategory"]>
export type Product = Schemas["ProductResponseDto"]
export type BathService = Schemas["BathServiceResponseDto"]
export type StockMovement = Schemas["StockMovementResponseDto"]
export type StockMovementResult = Schemas["StockMovementResultDto"]
export type ManualMovementType = Schemas["CreateStockMovementDto"]["type"]
export type StaffMember = Schemas["StaffMemberResponseDto"]

export type CreateRoomInput = Schemas["CreateRoomDto"]
export type UpdateRoomInput = Schemas["UpdateRoomDto"]
export type CreateTariffInput = Schemas["CreateTariffDto"]
export type UpdateTariffInput = Schemas["UpdateTariffDto"]
export type CreateProductInput = Schemas["CreateProductDto"]
export type UpdateProductInput = Schemas["UpdateProductDto"]
export type CreateStockMovementInput = Schemas["CreateStockMovementDto"]
export type CreateBathServiceInput = Schemas["CreateBathServiceDto"]
export type UpdateBathServiceInput = Schemas["UpdateBathServiceDto"]
export type CreateCashierInput = Schemas["CreateCashierDto"]
