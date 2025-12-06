import { Button } from "@/components/ui/button"

export function DarkModeButton({
    isDarkMode,
    toggleDarkMode,
}: {
    isDarkMode: boolean
    toggleDarkMode: () => void
}) {
    return (
        <Button
            onClick={toggleDarkMode}
            variant="outline"
            size="icon"
            className={`w-10 h-10 backdrop-blur-md border rounded-lg shadow-xl transition-colors ${isDarkMode
                ? "bg-gray-800/90 border-gray-700 hover:bg-gray-700/95 text-white"
                : "bg-background/90 hover:bg-background/95"
                }`}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={isDarkMode
                        ? "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                        : "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    }
                />
            </svg>
        </Button>
    )
}
