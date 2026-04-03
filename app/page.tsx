"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DarkModeButton } from "@/components/darkmode"
import { GitHubIcon } from "@/components/github"
import { useBlochScene } from "@/hooks/use-bloch-scene"
import { useBlochState } from "@/hooks/use-bloch-state"
import { useViewportOffset } from "@/hooks/use-viewport-offset"
import { quantumGates } from "@/lib/quantum"
import { cn } from "@/lib/utils"

export default function Bloch() {
  const { quantumState, isDarkMode, applyGate, resetState, toggleDarkMode } = useBlochState()
  const { mountRef, resetCamera } = useBlochScene({ quantumState, isDarkMode })
  const bottomOffset = useViewportOffset()

  const reset = () => {
    resetState()
    resetCamera()
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <div ref={mountRef} className="absolute inset-0" />

      {/* Desktop Controls */}
      <div className={cn(
        "top-4 right-4 gap-2 z-50",
        "md:flex hidden absolute items-start",
      )}>
        <DarkModeButton isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
        <GitHubIcon isDarkMode={isDarkMode} />

        <div className={cn(
          "w-64 max-h-[calc(100vh-2rem)]",
          "backdrop-blur-md border rounded-lg shadow-xl overflow-y-auto",
          isDarkMode ? "bg-gray-800/90 border-gray-700" : "bg-background/90"
        )}>
          <div className="p-3 space-y-3">
            <Card className={isDarkMode ? "bg-gray-900/50 border-gray-700" : ""}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-base ${isDarkMode ? "text-white" : ""}`}>
                  Quantum Gate
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-2">
                {Object.entries(quantumGates).map(([key, gate]) => (
                  <Button
                    key={key}
                    onClick={() => applyGate(key)}
                    className={cn(
                      "h-8",
                      "w-full justify-start text-sm",
                      isDarkMode ? "bg-gray-800 border-gray-600 hover:bg-gray-700 text-white" : "",
                    )}
                    variant="outline"
                    style={{ borderColor: gate.color }}
                  >
                    <span className="font-mono mr-2" style={{ color: gate.color }}>
                      {key}
                    </span>
                    {gate.name}
                  </Button>
                ))}

                <Button onClick={reset} variant="destructive" className="w-full text-sm h-8">
                  Reset
                </Button>
              </CardContent>
            </Card>

            <Card className={isDarkMode ? "bg-gray-900/50 border-gray-700" : ""}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-base ${isDarkMode ? "text-white" : ""}`}>Quantum State</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className={cn(
                    "font-mono text-xs p-2 rounded",
                    isDarkMode ? "bg-gray-800 text-gray-300" : "bg-gray-100"
                  )}>
                    a = {quantumState.a.toString()}
                    <br />
                    b = {quantumState.b.toString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Controls */}
      <div className="md:hidden">
        {/* Top buttons */}
        <div className={cn(
          "top-4 right-4 z-50 gap-2",
          "flex flex-row items-center absolute",
        )}>
          <DarkModeButton isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
          <GitHubIcon isDarkMode={isDarkMode} />
        </div>

        {/* Bottom panel */}
        <div
          className={cn(
            "left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)]",
            "fixed backdrop-blur-md border-t shadow-xl",
            isDarkMode ? "bg-gray-800/95 border-gray-700" : "bg-background/95"
          )}
          style={{ bottom: bottomOffset }}
        >
          <div className="p-3 space-y-2">
            <div className="flex flex-row gap-1 flex-wrap justify-center">
              {Object.entries(quantumGates).map(([key, gate]) => (
                <Button
                  key={key}
                  onClick={() => applyGate(key)}
                  className={cn(
                    "h-8 px-3",
                    "text-xs no-select-interactive",
                    isDarkMode ? "bg-gray-700 border-gray-600 hover:bg-gray-600 text-white" : ""
                  )}
                  variant="outline"
                  style={{ borderColor: gate.color }}
                >
                  <span className="font-mono" style={{ color: gate.color }}>
                    {key}
                  </span>
                </Button>
              ))}
              <Button onClick={reset} variant="destructive" className="text-xs h-8 px-3 no-select-interactive">
                Reset
              </Button>
            </div>

            <div className={cn(
              "p-2",
              "font-mono text-xs rounded text-center",
              isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100"
            )}>
              a = {quantumState.a.real.toFixed(4)} + {quantumState.a.imag.toFixed(4)}i
              <br />
              b = {quantumState.b.real.toFixed(4)} + {quantumState.b.imag.toFixed(4)}i
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
