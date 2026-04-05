/* eslint-disable @next/next/no-img-element */

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DesktopControls } from '@/components/desktop-controls'
import { Complex, QuantumState, noiseChannels, quantumGates } from '@/lib/quantum'

vi.mock('next/image', () => ({
    default: (props: React.ComponentProps<'img'>) => {
        return <img {...props} alt={props.alt ?? 'GitHub'} />
    },
}))

const DEFAULT_QUANTUM_STATE = new QuantumState(
    new Complex(1, 2),
    new Complex(3, -4),
)

function createProps(overrides = {}) {
    return {
        applyGate: vi.fn(),
        applyNoise: vi.fn(),
        isDarkMode: false,
        quantumState: DEFAULT_QUANTUM_STATE,
        reset: vi.fn(),
        toggleDarkMode: vi.fn(),
        ...overrides,
    }
}

describe('DesktopControls', () => {
    it('renders gate controls, noise controls, and quantum state in light mode', () => {
        const props = createProps()
        const { container } = render(<DesktopControls {...props} />)

        expect(container.firstChild).toHaveClass('md:flex', 'hidden', 'absolute')
        expect(screen.getByText('Quantum Gate')).toBeInTheDocument()
        expect(screen.getByText('Noise Channel')).toBeInTheDocument()
        expect(screen.getByText('Quantum State')).toBeInTheDocument()
        expect(screen.getByTitle('Switch to Dark Mode')).toBeInTheDocument()

        const link = screen.getByRole('link')
        expect(link).toHaveClass('bg-background/90')

        Object.entries(quantumGates).forEach(([key, gate]) => {
            expect(screen.getAllByText(key).length).toBeGreaterThan(0)
            expect(screen.getByRole('button', { name: `${key}${gate.name}` })).toBeInTheDocument()
        })

        Object.entries(noiseChannels).forEach(([key, channel]) => {
            expect(screen.getByRole('button', { name: `${key}${channel.name}` })).toBeInTheDocument()
        })

        expect(screen.getByText('a =')).toBeInTheDocument()
        expect(screen.getByTestId('a-value')).toHaveTextContent('1.0000+2.0000i')
        expect(screen.getByText('b =')).toBeInTheDocument()
        expect(screen.getByTestId('b-value')).toHaveTextContent('3.0000-4.0000i')
    })

    it('shows negative real coefficients without hiding the real sign', () => {
        render(
            <DesktopControls
                {...createProps({
                    quantumState: new QuantumState(
                        new Complex(-1, 2),
                        new Complex(-3, -4),
                    ),
                })}
            />
        )

        const aRealSign = screen.getByTestId('a-value').querySelector('span')
        const bRealSign = screen.getByTestId('b-value').querySelector('span')

        expect(aRealSign).toHaveTextContent('-')
        expect(aRealSign).not.toHaveClass('invisible')
        expect(aRealSign).toHaveAttribute('aria-hidden', 'false')
        expect(screen.getByTestId('a-value')).toHaveTextContent('-1.0000+2.0000i')

        expect(bRealSign).toHaveTextContent('-')
        expect(bRealSign).not.toHaveClass('invisible')
        expect(bRealSign).toHaveAttribute('aria-hidden', 'false')
        expect(screen.getByTestId('b-value')).toHaveTextContent('-3.0000-4.0000i')
    })

    it('handles dark mode and button interactions', () => {
        const applyGate = vi.fn()
        const applyNoise = vi.fn()
        const reset = vi.fn()
        const toggleDarkMode = vi.fn()

        render(
            <DesktopControls
                {...createProps({
                    applyGate,
                    applyNoise,
                    isDarkMode: true,
                    reset,
                    toggleDarkMode,
                })}
            />
        )

        expect(screen.getByTitle('Switch to Light Mode')).toBeInTheDocument()
        expect(screen.getByRole('link')).toHaveClass('bg-gray-800/90')
        expect(screen.getByText('Quantum Gate')).toHaveClass('text-white')
        expect(screen.getByText('X').closest('button')).toHaveClass('bg-gray-800')

        fireEvent.click(screen.getByText('X').closest('button')!)
        fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
        fireEvent.click(screen.getByTitle('Switch to Light Mode'))

        expect(applyGate).toHaveBeenCalledWith('X')
        expect(reset).toHaveBeenCalledTimes(1)
        expect(toggleDarkMode).toHaveBeenCalledTimes(1)

        fireEvent.click(screen.getByRole('button', { name: 'DEPDepolarizing' }))
        expect(applyNoise).toHaveBeenCalledWith('DEP')
    })

    it('shows Bloch coordinates when the quantum state is mixed', () => {
        const mixedState = DEFAULT_QUANTUM_STATE.applyNoise('DEP')

        render(<DesktopControls {...createProps({ quantumState: mixedState })} />)

        expect(screen.getByText('Quantum State (Mixed)')).toBeInTheDocument()
        expect(screen.getByTestId('x-value')).toBeInTheDocument()
        expect(screen.getByTestId('y-value')).toBeInTheDocument()
        expect(screen.getByTestId('z-value')).toBeInTheDocument()
        expect(screen.queryByTestId('a-value')).not.toBeInTheDocument()
        expect(screen.queryByTestId('b-value')).not.toBeInTheDocument()
    })
})
