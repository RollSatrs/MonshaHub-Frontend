/**
 * Время. Все «сейчас» приходят с backend (serverTime); здесь только отображение и локальный отсчёт
 * от серверных значений. Состояния и суммы не вычисляются.
 */

/** 5292 сек → "01:28:12"; отрицательное значение — "−00:05:12". */
export function formatCountdown(totalSeconds: number): string {
  const sign = totalSeconds < 0 ? "−" : ""
  const abs = Math.abs(Math.trunc(totalSeconds))
  const h = Math.floor(abs / 3600)
  const m = Math.floor((abs % 3600) / 60)
  const s = abs % 60
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${sign}${pad(h)}:${pad(m)}:${pad(s)}`
}

/** 90 → "1 ч 30 мин", 45 → "45 мин", 120 → "2 ч". */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} мин`
  if (m === 0) return `${h} ч`
  return `${h} ч ${m} мин`
}

export function formatTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(iso))
}

export function formatDayTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(iso))
}

export function formatDay(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone,
  }).format(new Date(iso))
}

/** Ключ дня в поясе организации, например "2026-01-01" — для группировки. */
export function dayKey(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).format(new Date(iso))
}

/**
 * «Локальные» дата и время в поясе организации → ISO с корректным смещением.
 * date: "2026-01-01", time: "18:00", timeZone: "Asia/Almaty" → "2026-01-01T13:00:00.000Z".
 */
export function zonedTimeToIso(
  date: string,
  time: string,
  timeZone: string
): string {
  const [y, mo, d] = date.split("-").map(Number)
  const [h, mi] = time.split(":").map(Number)
  const asUtc = Date.UTC(y, mo - 1, d, h, mi)
  // смещение пояса в этот момент: разница между «стенным» временем в поясе и UTC
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(asUtc))
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value)
  const wall = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second")
  )
  const offset = wall - asUtc
  return new Date(asUtc - offset).toISOString()
}

/** ISO → значения для <input type="date"> и <input type="time"> в поясе организации. */
export function isoToZonedInputs(
  iso: string,
  timeZone: string
): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(iso))
  const get = (t: string) => parts.find((p) => p.type === t)!.value
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  }
}

/** Варианты длительности, кратные шагу: быстрые кнопки. */
export function durationOptions(step: number, max = 6 * 60): number[] {
  const candidates = [step, 60, 90, 120, 180, 240, 360]
  return [...new Set(candidates)]
    .filter((m) => m % step === 0 && m <= max)
    .sort((a, b) => a - b)
}
