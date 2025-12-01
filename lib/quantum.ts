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

export class QuantumState {
    constructor(
        public a: Complex,
        public b: Complex,
    ) { }

    toCoordinates(): [number, number, number] {
        const aconj = this.a.conjugate()
        const bconj = this.b.conjugate()

        const x = 2 * aconj.multiply(this.b).real
        const y = 2 * aconj.multiply(this.b).imag
        const z = this.a.magnitude() ** 2 - this.b.magnitude() ** 2

        return [y, z, x]
    }

    apply(gate: string): QuantumState {
        const g = quantumGates[gate as keyof typeof quantumGates].matrix
        const a = g[0][0].multiply(this.a).add(g[0][1].multiply(this.b))
        const b = g[1][0].multiply(this.a).add(g[1][1].multiply(this.b))

        return new QuantumState(a, b)
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
