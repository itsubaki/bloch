"use client"

import { useState } from "react"
import { Complex, QuantumState } from "@/lib/quantum"

const createInitialQuantumState = () => new QuantumState(new Complex(1), new Complex(0))

export function useBlochState() {
  const [quantumState, setQuantumState] = useState(createInitialQuantumState)

  const applyGate = (gate: string) => {
    setQuantumState((previousState) => previousState.apply(gate))
  }

  const resetState = () => {
    setQuantumState(createInitialQuantumState())
  }

  return {
    quantumState,
    applyGate,
    resetState,
  }
}
