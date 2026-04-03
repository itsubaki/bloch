import { describe, expect, it } from 'vitest'
import { Complex, QuantumState, quantumGates } from '@/lib/quantum'

describe('Complex', () => {
    it('supports arithmetic operations', () => {
        const left = new Complex(1, 2)
        const right = new Complex(3, -4)

        const product = left.multiply(right)
        const sum = left.add(right)
        const conjugate = left.conjugate()

        expect(product.real).toBe(11)
        expect(product.imag).toBe(2)
        expect(sum.real).toBe(4)
        expect(sum.imag).toBe(-2)
        expect(conjugate.real).toBe(1)
        expect(conjugate.imag).toBe(-2)
        expect(left.magnitude()).toBeCloseTo(Math.sqrt(5))
    })

    it('formats negative zero consistently', () => {
        expect(new Complex(-0, -0).toString()).toBe('0.0000 + 0.0000i')
        expect(new Complex(1, -2).toString()).toBe('1.0000 - 2.0000i')
    })
})

describe('QuantumState', () => {
    it('maps the |0⟩ state to the north pole', () => {
        const state = new QuantumState(new Complex(1), new Complex(0))

        expect(state.toCoordinates()).toEqual([0, 1, 0])
    })

    it('applies gates to derive new amplitudes', () => {
        const zero = new QuantumState(new Complex(1), new Complex(0))

        const xState = zero.apply('X')
        expect(xState.a.toString()).toBe('0.0000 + 0.0000i')
        expect(xState.b.toString()).toBe('1.0000 + 0.0000i')

        const yState = zero.apply('Y')
        expect(yState.a.toString()).toBe('0.0000 + 0.0000i')
        expect(yState.b.toString()).toBe('0.0000 + 1.0000i')
    })

    it('converts phased superposition states into Bloch coordinates', () => {
        const zero = new QuantumState(new Complex(1), new Complex(0))

        const plus = zero.apply('H')
        expect(plus.toCoordinates()[0]).toBeCloseTo(0)
        expect(plus.toCoordinates()[1]).toBeCloseTo(0)
        expect(plus.toCoordinates()[2]).toBeCloseTo(1)

        const sPlus = plus.apply('S')
        expect(sPlus.toCoordinates()[0]).toBeCloseTo(1)
        expect(sPlus.toCoordinates()[1]).toBeCloseTo(0)
        expect(sPlus.toCoordinates()[2]).toBeCloseTo(0)
    })
})

describe('quantumGates', () => {
    it('exports the configured gate metadata', () => {
        expect(quantumGates.T.name).toBe('T(π/8)')
        expect(quantumGates.T.matrix[1][1].magnitude()).toBeCloseTo(1)
        expect(quantumGates.H.color).toBe('#10b981')
    })
})
