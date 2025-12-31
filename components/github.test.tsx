/* eslint-disable @next/next/no-img-element */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { GitHubIcon } from '@/components/github'

vi.mock('next/image', () => ({
    default: (props: any) => {
        return <img {...props} alt="GitHub" />
    },
}))

describe('GitHubIcon', () => {
    it('renders correctly in light mode', () => {
        render(<GitHubIcon isDarkMode={false} />)

        const link = screen.getByRole('link')

        expect(link).toHaveAttribute(
            'href',
            'https://github.com/itsubaki/bloch'
        )
        expect(link).toHaveAttribute('title', 'View on GitHub')
        expect(link).toHaveAttribute('target', '_blank')
        expect(link).toHaveAttribute('rel', 'noopener noreferrer')

        // Light mode styles
        expect(link.className).toContain('bg-background')

        const image = screen.getByAltText('GitHub')
        expect(image).toBeInTheDocument()
        expect(image.className).not.toContain('invert')
    })

    it('renders correctly in dark mode', () => {
        render(<GitHubIcon isDarkMode={true} />)

        const link = screen.getByRole('link')

        expect(link.className).toContain('bg-gray-800')
        expect(link.className).toContain('text-white')

        const image = screen.getByAltText('GitHub')
        expect(image).toBeInTheDocument()
        expect(image.className).toContain('invert')
    })

    it('opens GitHub in a new tab', () => {
        render(<GitHubIcon isDarkMode={false} />)

        const link = screen.getByRole('link')

        expect(link).toHaveAttribute('target', '_blank')
        expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })
})
