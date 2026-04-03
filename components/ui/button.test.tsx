import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button, buttonVariants } from '@/components/ui/button'

describe('Button', () => {
    it('renders a button with default styles and custom class names', () => {
        render(<Button className="custom-class">Click me</Button>)

        const button = screen.getByRole('button', { name: 'Click me' })

        expect(button).toBeInTheDocument()
        expect(button).toHaveClass('inline-flex')
        expect(button).toHaveClass('bg-primary')
        expect(button).toHaveClass('h-10')
        expect(button).toHaveClass('custom-class')
    })

    it('applies variant and size classes', () => {
        const className = buttonVariants({
            variant: 'destructive',
            size: 'lg',
            className: 'extra-class',
        })

        expect(className).toContain('bg-red-500')
        expect(className).toContain('hover:bg-red-600')
        expect(className).toContain('h-11')
        expect(className).toContain('px-8')
        expect(className).toContain('extra-class')
    })

    it('renders its child element when asChild is true', () => {
        render(
            <Button asChild>
                <a href="/docs">Read docs</a>
            </Button>
        )

        const link = screen.getByRole('link', { name: 'Read docs' })

        expect(link).toBeInTheDocument()
        expect(link).toHaveAttribute('href', '/docs')
        expect(link).toHaveClass('inline-flex')
        expect(link).toHaveClass('bg-primary')
    })
})
