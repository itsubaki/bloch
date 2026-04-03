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

  it("updates the offset on viewport events", () => {
    setInnerHeight(1000)
    const viewport = createVisualViewport(800, 50)
    setVisualViewport(viewport)

    const { result } = renderHook(() => useViewportOffset())

    expect(result.current).toBe(150)

    act(() => {
      viewport.height = 900
      viewport.offsetTop = 20
      viewport.dispatch("resize")
    })

    expect(result.current).toBe(80)
  })

  it("clamps negative offsets to zero", () => {
    setInnerHeight(1000)
    const viewport = createVisualViewport(800, 50)
    setVisualViewport(viewport)

    const { result } = renderHook(() => useViewportOffset())

    expect(result.current).toBe(150)

    // 1000 - 970 - 60 = -30, so the hook should clamp the result to zero.
    act(() => {
      viewport.height = 970
      viewport.offsetTop = 60
      viewport.dispatch("scroll")
    })

    expect(result.current).toBe(0)
  })

  it("removes viewport listeners on unmount", () => {
    setInnerHeight(1000)
    const viewport = createVisualViewport(800, 50)
    setVisualViewport(viewport)

    const { unmount } = renderHook(() => useViewportOffset())
    const resizeListener = viewport.addEventListener.mock.calls.find(([event]) => event === "resize")?.[1]
    const scrollListener = viewport.addEventListener.mock.calls.find(([event]) => event === "scroll")?.[1]

    unmount()

    expect(resizeListener).toEqual(expect.any(Function))
    expect(scrollListener).toEqual(expect.any(Function))
    expect(viewport.removeEventListener).toHaveBeenCalledWith("resize", resizeListener)
    expect(viewport.removeEventListener).toHaveBeenCalledWith("scroll", scrollListener)
  })
})
