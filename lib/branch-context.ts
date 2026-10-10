export const ACTIVE_BRANCH_KEY = "monshahub.activeBranchId"
export const WORKPLACE_TOKEN_KEY = "monshahub.workplaceToken"

export function getActiveBranchId() {
  if (typeof window === "undefined") return null
  const value = Number(window.localStorage.getItem(ACTIVE_BRANCH_KEY))
  return Number.isInteger(value) && value > 0 ? value : null
}

export function setActiveBranchId(id: number) {
  window.localStorage.setItem(ACTIVE_BRANCH_KEY, String(id))
}

export function getWorkplaceToken() {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(WORKPLACE_TOKEN_KEY)
}

export function setWorkplaceToken(token: string) {
  window.localStorage.setItem(WORKPLACE_TOKEN_KEY, token)
}
