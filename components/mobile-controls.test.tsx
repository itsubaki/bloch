/* eslint-disable @next/next/no-img-element */

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MobileControls } from '@/components/mobile-controls'
import { Complex, QuantumState, quantumGates } from '@/lib/quantum'

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
        bottomOffset: 24,
        isDarkMode: false,
        quantumState: DEFAULT_QUANTUM_STATE,
        reset: vi.fn(),
        toggleDarkMode: vi.fn(),
        ...overrides,
    }
}

describe('MobileControls', () => {
    it('renders mobile controls, offset, and quantum state in light mode', () => {
        const props = createProps()
        const { container } = render(<MobileControls {...props} />)

        expect(container.firstChild).toHaveClass('md:hidden')
        expect(screen.getByTitle('Switch to Dark Mode')).toBeInTheDocument()
        expect(screen.getByRole('link')).toHaveClass('bg-background/90')
        expect(container.querySelector('.fixed')).toHaveStyle({ bottom: '24px' })

        Object.keys(quantumGates).forEach((key) => {
            expect(screen.getByRole('button', { name: key })).toBeInTheDocument()
        })

        expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument()
        expect(screen.getByText('a =')).toBeInTheDocument()
        expect(screen.getByTestId('a-value')).toHaveTextContent('1.0000+2.0000i')
        expect(screen.getByText('b =')).toBeInTheDocument()
        expect(screen.getByTestId('b-value')).toHaveTextContent('3.0000-4.0000i')
    })

    it('shows negative real coefficients without hiding the real sign', () => {
        render(
            <MobileControls
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

    it('handles dark mode and mobile actions', () => {
        const applyGate = vi.fn()
        const reset = vi.fn()
        const toggleDarkMode = vi.fn()
        const { container } = render(
            <MobileControls
                {...createProps({
                    applyGate,
                    bottomOffset: 0,
                    isDarkMode: true,
                    reset,
                    toggleDarkMode,
                })}
            />
        )

        expect(screen.getByTitle('Switch to Light Mode')).toBeInTheDocument()
        expect(screen.getByRole('link')).toHaveClass('bg-gray-800/90')
        expect(screen.getByRole('button', { name: 'X' })).toHaveClass('bg-gray-700')
        expect(container.querySelector('.fixed')).toHaveClass('bg-gray-800/95')

        fireEvent.click(screen.getByRole('button', { name: 'X' }))
        fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
        fireEvent.click(screen.getByTitle('Switch to Light Mode'))

        expect(applyGate).toHaveBeenCalledWith('X')
        expect(reset).toHaveBeenCalledTimes(1)
        expect(toggleDarkMode).toHaveBeenCalledTimes(1)
    })
})
