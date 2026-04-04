export class Complex {
    constructor(
        public real: number,
        public imag = 0,
    ) { }

    multiply(other: Complex): Complex {
        return new Complex(this.real * other.real - this.imag * other.imag, this.real * other.imag + this.imag * other.real)
    }

    add(other: Complex): Complex {
        return new Complex(this.real + other.real, this.imag + other.imag)
    }

    conjugate(): Complex {
        return new Complex(this.real, -this.imag)
    }

    magnitude(): number {
        return Math.sqrt(this.real * this.real + this.imag * this.imag)
    }

    toString(): string {
        const realStr = (Object.is(this.real, -0) ? 0 : this.real).toFixed(4)
        const imagStr = (Object.is(this.imag, -0) ? 0 : this.imag).toFixed(4)
        const sign = this.imag >= 0 ? "+" : "-"
        return `${realStr} ${sign} ${Math.abs(this.imag).toFixed(4)}i`
    }
}

const gateBlochRotations: Record<string, (x: number, y: number, z: number) => [number, number, number]> = {
    X: (x, y, z) => [x, -y, -z],
    Y: (x, y, z) => [-x, y, -z],
    Z: (x, y, z) => [-x, -y, z],
    H: (x, y, z) => [z, -y, x],
    S: (x, y, z) => [-y, x, z],
    T: (x, y, z) => [
        x * Math.cos(Math.PI / 4) - y * Math.sin(Math.PI / 4),
        x * Math.sin(Math.PI / 4) + y * Math.cos(Math.PI / 4),
        z,
    ],
}

export class QuantumState {
    constructor(
        public a: Complex,
        public b: Complex,
        private readonly _blochVector?: [number, number, number],
    ) { }

    get isMixed(): boolean {
        return this._blochVector !== undefined
    }

    toBlochVector(): [number, number, number] {
        if (this._blochVector) return [...this._blochVector]

        const aconj = this.a.conjugate()
        const x = 2 * aconj.multiply(this.b).real
        const y = 2 * aconj.multiply(this.b).imag
        const z = this.a.magnitude() ** 2 - this.b.magnitude() ** 2

        return [x, y, z]
    }

    toCoordinates(): [number, number, number] {
        const aconj = this.a.conjugate()
        const bconj = this.b.conjugate()

        if (this._blochVector) {
            const [x, y, z] = this._blochVector
            return [y, z, x]
        }

        const x = 2 * aconj.multiply(this.b).real
        const y = 2 * aconj.multiply(this.b).imag
        const z = this.a.magnitude() ** 2 - this.b.magnitude() ** 2

        return [y, z, x]
    }

    apply(gate: string): QuantumState {
        if (this._blochVector) {
            const rotate = gateBlochRotations[gate]
            if (rotate) {
                return new QuantumState(this.a, this.b, rotate(...this._blochVector))
            }
        }

        const g = quantumGates[gate as keyof typeof quantumGates].matrix
        const a = g[0][0].multiply(this.a).add(g[0][1].multiply(this.b))
        const b = g[1][0].multiply(this.a).add(g[1][1].multiply(this.b))

        return new QuantumState(a, b)
    }

    applyNoise(channel: string): QuantumState {
        const [x, y, z] = this.toBlochVector()
        const { transform } = noiseChannels[channel as keyof typeof noiseChannels]
        return new QuantumState(this.a, this.b, transform(x, y, z))
    }
}

export function formatComplexParts(value: Complex) {
    const real = Object.is(value.real, -0) ? 0 : value.real
    const imag = Object.is(value.imag, -0) ? 0 : value.imag

    return {
        realDigits: Math.abs(real).toFixed(4),
        realSign: real < 0 ? "-" : "+",
        imagDigits: `${Math.abs(imag).toFixed(4)}i`,
        imagSign: imag >= 0 ? "+" : "-",
    }
}

export const quantumGates = {
    X: {
        name: "Pauli-X",
        matrix: [
            [new Complex(0, 0), new Complex(1, 0)],
            [new Complex(1, 0), new Complex(0, 0)],
        ],
        color: "#ef4444",
    },
    Y: {
        name: "Pauli-Y",
        matrix: [
            [new Complex(0, 0), new Complex(0, -1)],
            [new Complex(0, 1), new Complex(0, 0)],
        ],
        color: "#f59e0b",
    },
    Z: {
        name: "Pauli-Z",
        matrix: [
            [new Complex(1, 0), new Complex(0, 0)],
            [new Complex(0, 0), new Complex(-1, 0)],
        ],
        color: "#3b82f6",
    },
    H: {
        name: "Hadamard",
        matrix: [
            [new Complex(1 / Math.sqrt(2), 0), new Complex(1 / Math.sqrt(2), 0)],
            [new Complex(1 / Math.sqrt(2), 0), new Complex(-1 / Math.sqrt(2), 0)],
        ],
        color: "#10b981",
    },
    S: {
        name: "S",
        matrix: [
            [new Complex(1, 0), new Complex(0, 0)],
            [new Complex(0, 0), new Complex(0, 1)],
        ],
        color: "#8b5cf6",
    },
    T: {
        name: "T(π/8)",
        matrix: [
            [new Complex(1, 0), new Complex(0, 0)],
            [new Complex(0, 0), new Complex(Math.cos(Math.PI / 4), Math.sin(Math.PI / 4))],
        ],
        color: "#f97316",
    },
}

export const noiseChannels = {
    DEP: {
        name: "Depolarizing",
        color: "#ec4899",
        transform: (x: number, y: number, z: number): [number, number, number] => {
            const scale = 2 / 3
            return [scale * x, scale * y, scale * z]
        },
    },
    PD: {
        name: "Phase Damping",
        color: "#06b6d4",
        transform: (x: number, y: number, z: number): [number, number, number] => {
            return [0.5 * x, 0.5 * y, z]
        },
    },
    AD: {
        name: "Amplitude Damping",
        color: "#84cc16",
        transform: (x: number, y: number, z: number): [number, number, number] => {
            const gamma = 0.5
            const sqrtFactor = Math.sqrt(1 - gamma)
            return [sqrtFactor * x, sqrtFactor * y, (1 - gamma) * z + gamma]
        },
    },
}
