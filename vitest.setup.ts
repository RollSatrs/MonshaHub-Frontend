import "@testing-library/jest-dom/vitest"

process.env.NEXT_PUBLIC_API_URL ??= "http://localhost:3001"

// jsdom не реализует часть браузерного API, которое нужно Radix (Select, Popover и др.)
if (typeof Element !== "undefined") {
  Element.prototype.hasPointerCapture ??= () => false
  Element.prototype.setPointerCapture ??= () => {}
  Element.prototype.releasePointerCapture ??= () => {}
  Element.prototype.scrollIntoView ??= () => {}
}
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
