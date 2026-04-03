"use client"

import { useState } from "react"

export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(true)

  const toggleDarkMode = () => {
    setIsDarkMode((previousDarkMode) => !previousDarkMode)
  }

  return {
    isDarkMode,
    toggleDarkMode,
  }
}
