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

    it("applies noise channels, producing a mixed state", () => {
        const { result } = renderHook(() => useBlochState())

        act(() => {
            result.current.applyNoise("DEP")
        })

        expect(result.current.quantumState.isMixed).toBe(true)
        const [bx, by, bz] = result.current.quantumState.toBlochVector()
        expect(bx).toBeCloseTo(0)
        expect(by).toBeCloseTo(0)
        expect(bz).toBeCloseTo(2 / 3)
    })

    it("applies noise then gate, preserving the mixed state with correct rotation", () => {
        const { result } = renderHook(() => useBlochState())

        act(() => {
            result.current.applyNoise("DEP")
        })

        act(() => {
            result.current.applyGate("X")
        })

        expect(result.current.quantumState.isMixed).toBe(true)
        const [bx, by, bz] = result.current.quantumState.toBlochVector()
        expect(bx).toBeCloseTo(0)
        expect(by).toBeCloseTo(0)
        expect(bz).toBeCloseTo(-2 / 3)
    })

    it("resets mixed state back to initial pure state", () => {
        const { result } = renderHook(() => useBlochState())

        act(() => {
            result.current.applyNoise("DEP")
        })

        act(() => {
            result.current.resetState()
        })

        expect(result.current.quantumState.isMixed).toBe(false)
        expect(result.current.quantumState.a.toString()).toBe("1.0000 + 0.0000i")
        expect(result.current.quantumState.b.toString()).toBe("0.0000 + 0.0000i")
    })
})
