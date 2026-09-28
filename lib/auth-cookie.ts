/**
 * Имя httpOnly-cookie сессии. Должно совпадать с backend (shared/constants/auth.ts).
 * Не `access_token`: cookie не привязаны к порту, и другие локальные проекты на localhost
 * с тем же именем перезаписывали бы сессию друг друга (и вызывали бы циклы редиректов).
 */
export const AUTH_COOKIE = "monshahub_token"
