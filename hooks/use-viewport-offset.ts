"use client"

import { useEffect, useState } from "react"

export function useViewportOffset() {
  const [bottomOffset, setBottomOffset] = useState(0)

  useEffect(() => {
    const updateBottomOffset = () => {
      if (window.visualViewport) {
        const offset = window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop
        setBottomOffset(Math.max(0, offset))
      }
    }

    updateBottomOffset()

    window.visualViewport?.addEventListener("resize", updateBottomOffset)
    window.visualViewport?.addEventListener("scroll", updateBottomOffset)

    return () => {
      window.visualViewport?.removeEventListener("resize", updateBottomOffset)
      window.visualViewport?.removeEventListener("scroll", updateBottomOffset)
    }
  }, [])

  return bottomOffset
}
