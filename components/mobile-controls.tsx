import { DarkModeButton } from "@/components/darkmode"
import { GitHubIcon } from "@/components/github"
import { Button } from "@/components/ui/button"
import { QuantumState, quantumGates } from "@/lib/quantum"
import { cn } from "@/lib/utils"

type MobileControlsProps = {
  applyGate: (gate: string) => void
  bottomOffset: number
  isDarkMode: boolean
  quantumState: QuantumState
  reset: () => void
  toggleDarkMode: () => void
}

export function MobileControls({
  applyGate,
  bottomOffset,
  isDarkMode,
  quantumState,
  reset,
  toggleDarkMode,
}: MobileControlsProps) {
  return (
    <div className="md:hidden">
      <div className={cn(
        "top-4 right-4 z-50 gap-2",
        "flex flex-row items-center absolute",
      )}>
        <DarkModeButton isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
        <GitHubIcon isDarkMode={isDarkMode} />
      </div>

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
            a = {quantumState.a.toString()}
            <br />
            b = {quantumState.b.toString()}
          </div>
        </div>
      </div>
    </div>
  )
}
