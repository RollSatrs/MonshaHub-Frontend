"use client"

import { useEffect, useState } from "react"

/**
 * «Сейчас» по серверным часам. Берём serverTime из ответа backend и момент его получения,
 * дальше время идёт локально (тикаем раз в секунду) — так обратный отсчёт от серверного endsAt
 * не зависит от неточных часов кассы. При каждом новом ответе поправка пересчитывается.
 * Возвращает миллисекунды (epoch).
 */
export function useServerNow(
  serverTime: string | undefined,
  receivedAt: number
): number {
  const [tick, setTick] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!serverTime) return tick
  const offset = Date.parse(serverTime) - receivedAt
  return tick + offset
}
