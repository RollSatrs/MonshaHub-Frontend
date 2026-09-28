/**
 * Деньги на frontend — только форматирование и ввод.
 * Значения приходят от backend decimal-строками ("10000.00") и в него же уходят строками.
 * Никаких расчётов итогов/стоимости здесь быть не должно — их делает backend.
 */

const MONEY_RE = /^\d{1,10}(\.\d{1,2})?$/

export function isValidMoney(value: string): boolean {
  return MONEY_RE.test(value)
}

/** Приводит ввод к виду, допустимому API: запятая → точка, только цифры, ≤ 2 знаков после точки. */
export function sanitizeMoneyInput(raw: string): string {
  let v = raw.replace(",", ".").replace(/[^\d.]/g, "")
  const dot = v.indexOf(".")
  if (dot !== -1) {
    v = v.slice(0, dot + 1) + v.slice(dot + 1).replace(/\./g, "")
    const [whole, frac] = v.split(".")
    v = `${whole.slice(0, 10)}.${frac.slice(0, 2)}`
  } else {
    v = v.slice(0, 10)
  }
  return v
}

const CURRENCY_SYMBOL: Record<string, string> = {
  KZT: "₸",
  RUB: "₽",
  USD: "$",
  EUR: "€",
}

/**
 * "10000.00" → "10 000 ₸" (только для отображения).
 * Символ валюты задан явно: Intl отдаёт «₸» или «KZT» в зависимости от ICU окружения.
 */
export function formatMoney(value: string, currency = "KZT"): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return value
  const number = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n)
  return `${number}\u00A0${CURRENCY_SYMBOL[currency] ?? currency}`
}
