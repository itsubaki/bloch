/* eslint-disable @next/next/no-img-element */

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DesktopControls } from '@/components/desktop-controls'
import { Complex, QuantumState, quantumGates } from '@/lib/quantum'

vi.mock('next/image', () => ({
    default: (props: React.ComponentProps<'img'>) => {
        return <img {...props} alt={props.alt ?? 'GitHub'} />
    },
}))

function createProps(overrides = {}) {
    return {
        applyGate: vi.fn(),
        isDarkMode: false,
        quantumState: new QuantumState(new Complex(1, 2), new Complex(3, -4)),
        reset: vi.fn(),
        toggleDarkMode: vi.fn(),
        ...overrides,
    }
}

describe('DesktopControls', () => {
    it('renders gate controls and quantum state in light mode', () => {
        const props = createProps()
        const { container } = render(<DesktopControls {...props} />)

        expect(container.firstChild).toHaveClass('md:flex', 'hidden', 'absolute')
        expect(screen.getByText('Quantum Gate')).toBeInTheDocument()
        expect(screen.getByText('Quantum State')).toBeInTheDocument()
        expect(screen.getByTitle('Switch to Dark Mode')).toBeInTheDocument()

        const link = screen.getByRole('link')
        expect(link).toHaveClass('bg-background/90')

        Object.entries(quantumGates).forEach(([key, gate]) => {
            expect(screen.getAllByText(key).length).toBeGreaterThan(0)
            expect(screen.getByRole('button', { name: `${key}${gate.name}` })).toBeInTheDocument()
        })

        expect(screen.getByText(/a = 1\.0000 \+ 2\.0000i/)).toBeInTheDocument()
        expect(screen.getByText(/b = 3\.0000 - 4\.0000i/)).toBeInTheDocument()
    })

    it('handles dark mode and button interactions', () => {
        const applyGate = vi.fn()
        const reset = vi.fn()
        const toggleDarkMode = vi.fn()

        render(
            <DesktopControls
                {...createProps({
                    applyGate,
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
    })
})
