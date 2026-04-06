"use client"

import { DesktopControls } from "@/components/desktop-controls"
import { MobileControls } from "@/components/mobile-controls"
import { useBlochScene } from "@/hooks/use-bloch-scene"
import { useBlochState } from "@/hooks/use-bloch-state"
import { useDarkMode } from "@/hooks/use-dark-mode"
import { useViewportOffset } from "@/hooks/use-viewport-offset"

export default function Bloch() {
    const { isDarkMode, toggleDarkMode } = useDarkMode()
    const { quantumState, applyGate, resetState } = useBlochState()
    const { mountRef, resetCamera } = useBlochScene({ quantumState, isDarkMode, applyGate, resetState })
    const bottomOffset = useViewportOffset()

    const reset = () => {
        resetState()
        resetCamera()
    }

    return (
        <div className="relative w-screen h-screen overflow-hidden">
            <div ref={mountRef} className="absolute inset-0" />
            <DesktopControls
                applyGate={applyGate}
                isDarkMode={isDarkMode}
                quantumState={quantumState}
                reset={reset}
                toggleDarkMode={toggleDarkMode}
            />
            <MobileControls
                applyGate={applyGate}
                isDarkMode={isDarkMode}
                quantumState={quantumState}
                reset={reset}
                toggleDarkMode={toggleDarkMode}
                bottomOffset={bottomOffset}
            />
        </div>
    )
}
