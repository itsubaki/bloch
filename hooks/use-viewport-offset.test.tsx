import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { useViewportOffset } from "@/hooks/use-viewport-offset"

type ViewportEvent = "resize" | "scroll"
type Listener = () => void
type MockVisualViewport = {
  height: number
  offsetTop: number
  addEventListener: ReturnType<typeof vi.fn>
  removeEventListener: ReturnType<typeof vi.fn>
  dispatch: (event: ViewportEvent) => void
}

const originalVisualViewport = Object.getOwnPropertyDescriptor(window, "visualViewport")
const originalInnerHeight = Object.getOwnPropertyDescriptor(window, "innerHeight")

function setInnerHeight(value: number) {
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    writable: true,
    value,
  })
}

function setVisualViewport(viewport?: MockVisualViewport) {
  if (viewport) {
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: viewport,
    })

    return
  }

  delete (window as Window & { visualViewport?: MockVisualViewport }).visualViewport
}

function createVisualViewport(height: number, offsetTop: number): MockVisualViewport {
  const listeners: Record<ViewportEvent, Set<Listener>> = {
    resize: new Set(),
    scroll: new Set(),
  }

  return {
    height,
    offsetTop,
    addEventListener: vi.fn((event: ViewportEvent, listener: Listener) => {
      listeners[event].add(listener)
    }),
    removeEventListener: vi.fn((event: ViewportEvent, listener: Listener) => {
      listeners[event].delete(listener)
    }),
    dispatch: (event: ViewportEvent) => {
      listeners[event].forEach((listener) => listener())
    },
  }
}

afterEach(() => {
  if (originalVisualViewport) {
    Object.defineProperty(window, "visualViewport", originalVisualViewport)
  } else {
    delete (window as Window & { visualViewport?: MockVisualViewport }).visualViewport
  }

  if (originalInnerHeight) {
    Object.defineProperty(window, "innerHeight", originalInnerHeight)
  }
})

describe("useViewportOffset", () => {
  it("returns 0 when visualViewport is unavailable", () => {
    setInnerHeight(1000)
    setVisualViewport()

    const { result } = renderHook(() => useViewportOffset())

    expect(result.current).toBe(0)
  })

  it("calculates the initial bottom offset", () => {
    setInnerHeight(1000)
    setVisualViewport(createVisualViewport(720, 40))

    const { result } = renderHook(() => useViewportOffset())

    expect(result.current).toBe(240)
  })

  it("updates on viewport events, clamps negative values, and cleans up listeners", () => {
    setInnerHeight(1000)
    const viewport = createVisualViewport(800, 50)
    setVisualViewport(viewport)

    const { result, unmount } = renderHook(() => useViewportOffset())

    expect(result.current).toBe(150)

    act(() => {
      viewport.height = 970
      viewport.offsetTop = 60
      viewport.dispatch("resize")
    })

    expect(result.current).toBe(0)

    act(() => {
      viewport.height = 900
      viewport.offsetTop = 20
      viewport.dispatch("scroll")
    })

    expect(result.current).toBe(80)

    unmount()

    expect(viewport.addEventListener).toHaveBeenCalledWith("resize", expect.any(Function))
    expect(viewport.addEventListener).toHaveBeenCalledWith("scroll", expect.any(Function))
    expect(viewport.removeEventListener).toHaveBeenCalledWith("resize", expect.any(Function))
    expect(viewport.removeEventListener).toHaveBeenCalledWith("scroll", expect.any(Function))
  })
})
