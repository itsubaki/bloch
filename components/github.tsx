'use client'

import Image from "next/image"

export function GitHubIcon({
    isDarkMode,
}: {
    isDarkMode: boolean
}) {
    return (
        <a
            href="https://github.com/itsubaki/bloch"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center w-10 h-10 backdrop-blur-md border rounded-lg shadow-xl transition-colors ${isDarkMode
                ? "bg-gray-800/90 border-gray-700 hover:bg-gray-700/95 text-white"
                : "bg-background/90 hover:bg-background/95"
                }`}
            title="View on GitHub"
        >
            <Image
                src="/github-mark.svg"
                alt="GitHub"
                width={24}
                height={24}
                className={isDarkMode ? "invert" : ""}
            />
        </a>
    )
}
