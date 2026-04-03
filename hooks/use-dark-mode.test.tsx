import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { useDarkMode } from "@/hooks/use-dark-mode"

describe("useDarkMode", () => {
  it("starts in dark mode", () => {
    const { result } = renderHook(() => useDarkMode())

    expect(result.current.isDarkMode).toBe(true)
  })

  it("toggles dark mode", () => {
    const { result } = renderHook(() => useDarkMode())

    act(() => {
      result.current.toggleDarkMode()
    })

    expect(result.current.isDarkMode).toBe(false)
  })
})
