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

function createProps(overrides = {}) {
    return {
        applyGate: vi.fn(),
        bottomOffset: 24,
        isDarkMode: false,
        quantumState: new QuantumState(new Complex(0, 0), new Complex(1, 0)),
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
        expect(screen.getByText(/a = 0\.0000 \+ 0\.0000i/)).toBeInTheDocument()
        expect(screen.getByText(/b = 1\.0000 \+ 0\.0000i/)).toBeInTheDocument()
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
