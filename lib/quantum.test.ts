import { describe, expect, it } from 'vitest'
import { Complex, QuantumState, formatComplexParts, noiseChannels, quantumGates } from '@/lib/quantum'

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

describe('formatComplexParts', () => {
    it('splits positive values into aligned display parts', () => {
        expect(formatComplexParts(new Complex(1, 2))).toEqual({
            realDigits: '1.0000',
            realSign: '+',
            imagDigits: '2.0000i',
            imagSign: '+',
        })
    })

    it('preserves negative signs for real and imaginary parts', () => {
        expect(formatComplexParts(new Complex(-3, -4))).toEqual({
            realDigits: '3.0000',
            realSign: '-',
            imagDigits: '4.0000i',
            imagSign: '-',
        })
    })

    it('normalizes negative zero before formatting', () => {
        expect(formatComplexParts(new Complex(-0, -0))).toEqual({
            realDigits: '0.0000',
            realSign: '+',
            imagDigits: '0.0000i',
            imagSign: '+',
        })
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

    it('is not mixed for a pure state', () => {
        const state = new QuantumState(new Complex(1), new Complex(0))
        expect(state.isMixed).toBe(false)
    })

    it('returns the Bloch vector for a pure state', () => {
        const zero = new QuantumState(new Complex(1), new Complex(0))
        expect(zero.toBlochVector()).toEqual([0, 0, 1])

        const one = new QuantumState(new Complex(0), new Complex(1))
        expect(one.toBlochVector()[2]).toBeCloseTo(-1)
    })

    it('applies depolarizing noise, producing a scaled mixed Bloch vector', () => {
        const zero = new QuantumState(new Complex(1), new Complex(0))
        const noisy = zero.applyNoise('DEP')

        expect(noisy.isMixed).toBe(true)
        const [bx, by, bz] = noisy.toBlochVector()
        expect(bx).toBeCloseTo(0)
        expect(by).toBeCloseTo(0)
        expect(bz).toBeCloseTo(2 / 3)

        const [cx, cy, cz] = noisy.toCoordinates()
        expect(cx).toBeCloseTo(by)
        expect(cy).toBeCloseTo(bz)
        expect(cz).toBeCloseTo(bx)
    })

    it('applies phase damping, shrinking the equatorial plane', () => {
        const plus = new QuantumState(new Complex(1), new Complex(0)).apply('H')
        const noisy = plus.applyNoise('PD')

        expect(noisy.isMixed).toBe(true)
        const [bx, by, bz] = noisy.toBlochVector()
        expect(bx).toBeCloseTo(0.5)
        expect(by).toBeCloseTo(0)
        expect(bz).toBeCloseTo(0)
    })

    it('applies amplitude damping, biasing the state toward |0⟩', () => {
        const one = new QuantumState(new Complex(0), new Complex(1))
        const noisy = one.applyNoise('AD')

        expect(noisy.isMixed).toBe(true)
        const [bx, by, bz] = noisy.toBlochVector()
        expect(bx).toBeCloseTo(0)
        expect(by).toBeCloseTo(0)
        expect(bz).toBeCloseTo(0)
    })

    it('applies gates to a mixed state via Bloch vector rotation', () => {
        const zero = new QuantumState(new Complex(1), new Complex(0))
        const mixed = zero.applyNoise('DEP')

        const afterX = mixed.apply('X')
        expect(afterX.isMixed).toBe(true)
        const [bx, by, bz] = afterX.toBlochVector()
        expect(bx).toBeCloseTo(0)
        expect(by).toBeCloseTo(0)
        expect(bz).toBeCloseTo(-2 / 3)
    })

    it('applies Y, Z, H, S, T gates to a mixed state via Bloch vector rotation', () => {
        const plus = new QuantumState(new Complex(1), new Complex(0)).apply('H')
        const mixed = plus.applyNoise('DEP')

        const afterY = mixed.apply('Y')
        expect(afterY.isMixed).toBe(true)
        const [yx] = afterY.toBlochVector()
        expect(yx).toBeCloseTo(-2 / 3)

        const afterZ = mixed.apply('Z')
        expect(afterZ.isMixed).toBe(true)
        const [zx] = afterZ.toBlochVector()
        expect(zx).toBeCloseTo(-2 / 3)

        const afterH = mixed.apply('H')
        expect(afterH.isMixed).toBe(true)
        const [, , hz] = afterH.toBlochVector()
        expect(hz).toBeCloseTo(2 / 3)

        const afterS = mixed.apply('S')
        expect(afterS.isMixed).toBe(true)
        const [, sy] = afterS.toBlochVector()
        expect(sy).toBeCloseTo(2 / 3)

        const afterT = mixed.apply('T')
        expect(afterT.isMixed).toBe(true)
        const [tx] = afterT.toBlochVector()
        expect(tx).toBeCloseTo((2 / 3) * Math.cos(Math.PI / 4))
    })
})

describe('quantumGates', () => {
    it('exports the configured gate metadata', () => {
        expect(quantumGates.T.name).toBe('T(π/8)')
        expect(quantumGates.T.matrix[1][1].magnitude()).toBeCloseTo(1)
        expect(quantumGates.H.color).toBe('#10b981')
    })
})

describe('noiseChannels', () => {
    it('exports the configured noise channel metadata', () => {
        expect(noiseChannels.DEP.name).toBe('Depolarizing')
        expect(noiseChannels.PD.name).toBe('Phase Damping')
        expect(noiseChannels.AD.name).toBe('Amplitude Damping')
        expect(noiseChannels.DEP.color).toBe('#ec4899')
        expect(noiseChannels.PD.color).toBe('#06b6d4')
        expect(noiseChannels.AD.color).toBe('#84cc16')
    })

    it('depolarizing transform scales all Bloch components by 2/3', () => {
        const result = noiseChannels.DEP.transform(0.6, 0.3, 0.9)
        expect(result[0]).toBeCloseTo(0.4)
        expect(result[1]).toBeCloseTo(0.2)
        expect(result[2]).toBeCloseTo(0.6)
    })

    it('phase damping transform halves x and y, preserves z', () => {
        const result = noiseChannels.PD.transform(0.6, 0.3, 0.9)
        expect(result[0]).toBeCloseTo(0.3)
        expect(result[1]).toBeCloseTo(0.15)
        expect(result[2]).toBeCloseTo(0.9)
    })

    it('amplitude damping transform shrinks x and y, shifts z toward 1', () => {
        const result = noiseChannels.AD.transform(0, 0, -1)
        expect(result[0]).toBeCloseTo(0)
        expect(result[1]).toBeCloseTo(0)
        expect(result[2]).toBeCloseTo(0)
    })
})
