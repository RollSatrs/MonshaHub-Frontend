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

// ─── Phase 2: посещения, брони, live ──────────────────────────────────────
export type LiveBoard = Schemas["LiveBoardDto"]
export type LiveRoom = Schemas["LiveRoomDto"]
export type RoomState = LiveRoom["state"]
export type Inside = Schemas["InsideDto"]
export type VisitDetail = Schemas["VisitDetailDto"]
export type VisitItem = Schemas["VisitItemDto"]
export type VisitSummary = Schemas["VisitSummaryDto"]
export type VisitList = Schemas["VisitListDto"]
export type Payment = Schemas["PaymentDto"]
export type PaymentMethod = Schemas["CreatePaymentDto"]["method"]
export type Booking = Schemas["BookingResponseDto"]
export type BookingStatus = Booking["status"]

export type StartPrivateVisitInput = Schemas["StartPrivateVisitDto"]
export type StartPublicVisitInput = Schemas["StartPublicVisitDto"]
export type GuestInput = Schemas["GuestDto"]
export type CreateBookingInput = Schemas["CreateBookingDto"]
export type UpdateBookingInput = Schemas["UpdateBookingDto"]
