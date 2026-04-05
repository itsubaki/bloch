import { DarkModeButton } from "@/components/darkmode"
import { GitHubIcon } from "@/components/github"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { QuantumState, formatComplexParts, quantumGates } from "@/lib/quantum"
import { cn } from "@/lib/utils"

type DesktopControlsProps = {
    applyGate: (gate: string) => void
    isDarkMode: boolean
    quantumState: QuantumState
    reset: () => void
    toggleDarkMode: () => void
}

export function DesktopControls({
    applyGate,
    isDarkMode,
    quantumState,
    reset,
    toggleDarkMode,
}: DesktopControlsProps) {
    const coefficients = [
        { label: "a =", value: formatComplexParts(quantumState.a) },
        { label: "b =", value: formatComplexParts(quantumState.b) },
    ]

    return (
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
                            <CardTitle className={`text-base ${isDarkMode ? "text-white" : ""}`}>
                                Quantum State
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-2">
                                <div className={cn(
                                    "grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 font-mono text-xs p-2 rounded",
                                    isDarkMode ? "bg-gray-800 text-gray-300" : "bg-gray-100"
                                )}>
                                    {coefficients.map(({ label, value }) => (
                                        <div key={label} className="contents">
                                            <span>{label}</span>
                                            <span
                                                className="inline-grid grid-cols-[1ch_auto_1ch_auto] items-baseline gap-x-1 tabular-nums whitespace-nowrap"
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
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
