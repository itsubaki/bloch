import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import Bloch from "@/app/page"
import { Complex, QuantumState } from "@/lib/quantum"

const quantumState = new QuantumState(new Complex(1, 0), new Complex(0, 0))
const applyGate = vi.fn()
const applyNoise = vi.fn()
const resetState = vi.fn()
const toggleDarkMode = vi.fn()
const resetCamera = vi.fn()
const mountRef = { current: null }

let desktopProps: Record<string, unknown> | undefined
let mobileProps: Record<string, unknown> | undefined

vi.mock("@/hooks/use-bloch-state", () => ({
    useBlochState: () => ({
        quantumState,
        applyGate,
        applyNoise,
        resetState,
    }),
}))

vi.mock("@/hooks/use-dark-mode", () => ({
    useDarkMode: () => ({
        isDarkMode: true,
        toggleDarkMode,
    }),
}))

vi.mock("@/hooks/use-bloch-scene", () => ({
    useBlochScene: () => ({
        mountRef,
        resetCamera,
    }),
}))

vi.mock("@/hooks/use-viewport-offset", () => ({
    useViewportOffset: () => 48,
}))

vi.mock("@/components/desktop-controls", () => ({
    DesktopControls: (props: Record<string, unknown>) => {
        desktopProps = props
        return (
            <button onClick={props.reset as () => void} type="button">
                desktop reset
            </button>
        )
    },
}))

vi.mock("@/components/mobile-controls", () => ({
    MobileControls: (props: Record<string, unknown>) => {
        mobileProps = props
        return (
            <button onClick={props.reset as () => void} type="button">
                mobile reset
            </button>
        )
    },
}))

describe("app/page", () => {
    beforeEach(() => {
        desktopProps = undefined
        mobileProps = undefined
        vi.clearAllMocks()
    })

    it("wires hook state into desktop and mobile controls", () => {
        const { container } = render(<Bloch />)

        expect(container.firstChild).toHaveClass("relative", "w-screen", "h-screen", "overflow-hidden")
        expect(container.querySelector(".absolute.inset-0")).toBeInTheDocument()

        expect(desktopProps).toMatchObject({
            applyGate,
            applyNoise,
            isDarkMode: true,
            quantumState,
            toggleDarkMode,
        })
        expect(mobileProps).toMatchObject({
            applyGate,
            applyNoise,
            bottomOffset: 48,
            isDarkMode: true,
            quantumState,
            toggleDarkMode,
        })
    })

    it("resets both the quantum state and camera through child controls", () => {
        render(<Bloch />)

        fireEvent.click(screen.getByRole("button", { name: "desktop reset" }))
        fireEvent.click(screen.getByRole("button", { name: "mobile reset" }))

        expect(resetState).toHaveBeenCalledTimes(2)
        expect(resetCamera).toHaveBeenCalledTimes(2)
    })
})
