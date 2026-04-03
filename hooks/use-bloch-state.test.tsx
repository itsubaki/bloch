import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { useBlochState } from "@/hooks/use-bloch-state"

describe("useBlochState", () => {
  it("starts with the default quantum state", () => {
    const { result } = renderHook(() => useBlochState())

    expect(result.current.quantumState.a.toString()).toBe("1.0000 + 0.0000i")
    expect(result.current.quantumState.b.toString()).toBe("0.0000 + 0.0000i")
  })

  it("applies quantum gates to the current state", () => {
    const { result } = renderHook(() => useBlochState())

    act(() => {
      result.current.applyGate("X")
    })

    expect(result.current.quantumState.a.toString()).toBe("0.0000 + 0.0000i")
    expect(result.current.quantumState.b.toString()).toBe("1.0000 + 0.0000i")
  })

  it("resets the state to the initial values", () => {
    const { result } = renderHook(() => useBlochState())

    act(() => {
      result.current.applyGate("X")
    })

    act(() => {
      result.current.resetState()
    })

    expect(result.current.quantumState.a.toString()).toBe("1.0000 + 0.0000i")
    expect(result.current.quantumState.b.toString()).toBe("0.0000 + 0.0000i")
  })
})
