import { DarkModeButton } from "@/components/darkmode"
import { GitHubIcon } from "@/components/github"
import { Button } from "@/components/ui/button"
import { QuantumState, formatComplexParts, noiseChannels, quantumGates } from "@/lib/quantum"
import { cn } from "@/lib/utils"

const normalizeNegativeZero = (value: number) => Object.is(value, -0) ? 0 : value

type MobileControlsProps = {
  applyGate: (gate: string) => void
  applyNoise: (channel: string) => void
  bottomOffset: number
  isDarkMode: boolean
  quantumState: QuantumState
  reset: () => void
  toggleDarkMode: () => void
}

export function MobileControls({
  applyGate,
  applyNoise,
  bottomOffset,
  isDarkMode,
  quantumState,
  reset,
  toggleDarkMode,
}: MobileControlsProps) {
  const coefficients = [
    { label: "a =", value: formatComplexParts(quantumState.a) },
    { label: "b =", value: formatComplexParts(quantumState.b) },
  ]

  const blochCoords = quantumState.isMixed
    ? (() => {
        const [bx, by, bz] = quantumState.toBlochVector()
        return [
          { label: "x =", testId: "x-value", value: normalizeNegativeZero(bx) },
          { label: "y =", testId: "y-value", value: normalizeNegativeZero(by) },
          { label: "z =", testId: "z-value", value: normalizeNegativeZero(bz) },
        ]
      })()
    : null

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
          <div className="w-fit max-w-full mx-auto space-y-2">
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

            <div className="flex flex-row gap-1 flex-wrap justify-center">
              {Object.entries(noiseChannels).map(([key, channel]) => (
                <Button
                  key={key}
                  onClick={() => applyNoise(key)}
                  className={cn(
                    "h-8 px-3",
                    "text-xs no-select-interactive",
                    isDarkMode ? "bg-gray-700 border-gray-600 hover:bg-gray-600 text-white" : ""
                  )}
                  variant="outline"
                  style={{ borderColor: channel.color }}
                >
                  <span className="font-mono" style={{ color: channel.color }}>
                    {key}
                  </span>
                </Button>
              ))}
            </div>

            <div className={cn(
              "grid w-full grid-cols-[max-content_max-content] justify-center gap-x-2 gap-y-1 p-2",
              "font-mono text-xs rounded",
              isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100"
            )}>
              {blochCoords
                ? blochCoords.map(({ label, testId, value }) => (
                    <div key={label} className="contents">
                      <span>{label}</span>
                      <span
                        data-testid={testId}
                        className="tabular-nums whitespace-nowrap"
                      >
                        {value.toFixed(4)}
                      </span>
                    </div>
                  ))
                : coefficients.map(({ label, value }) => (
                    <div key={label} className="contents">
                      <span>{label}</span>
                      <span
                        className="inline-grid grid-cols-[1ch_max-content_1ch_max-content] items-baseline gap-x-1 tabular-nums whitespace-nowrap"
                        data-testid={`${label[0]}-value`}
                      >
                        <span className={value.realSign === "-" ? "" : "invisible"} aria-hidden={value.realSign !== "-"}>
                          {value.realSign}
                        </span>
                        <span>{value.realDigits}</span>
                        <span>{value.imagSign}</span>
                        <span>{value.imagDigits}</span>
                      </span>
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
