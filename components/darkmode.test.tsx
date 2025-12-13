import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DarkModeButton } from '@/components/darkmode'

describe('DarkModeButton', () => {
    it('light mode', () => {
        render(
            <DarkModeButton
                isDarkMode={false}
                toggleDarkMode={vi.fn()}
            />
        )

        const button = screen.getByRole('button')

        expect(button).toHaveAttribute('title', 'Switch to Dark Mode')
        expect(button.className).toContain('bg-background')
    })

    it('dark mode', () => {
        render(
            <DarkModeButton
                isDarkMode={true}
                toggleDarkMode={vi.fn()}
            />
        )

        const button = screen.getByRole('button')

        expect(button).toHaveAttribute('title', 'Switch to Light Mode')
        expect(button.className).toContain('bg-gray-800')
        expect(button.className).toContain('text-white')
    })

    it('switch dark mode', () => {
        const toggleDarkMode = vi.fn()

        render(
            <DarkModeButton
                isDarkMode={false}
                toggleDarkMode={toggleDarkMode}
            />
        )

        fireEvent.click(screen.getByRole('button'))

        expect(toggleDarkMode).toHaveBeenCalledTimes(1)
    })

    it('svg', () => {
        render(
            <DarkModeButton
                isDarkMode={false}
                toggleDarkMode={vi.fn()}
            />
        )

        const svg = screen.getByRole('button').querySelector('svg')
        expect(svg).toBeInTheDocument()
    })
})
