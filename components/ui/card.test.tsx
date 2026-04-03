import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'

describe('Card', () => {
    it('renders composed card content with default and custom classes', () => {
        render(
            <Card className="card-custom" data-testid="card">
                <CardHeader className="header-custom" data-testid="header">
                    <CardTitle className="title-custom">Quantum State</CardTitle>
                </CardHeader>
                <CardContent className="content-custom">
                    Bloch sphere controls
                </CardContent>
            </Card>
        )

        expect(screen.getByTestId('card')).toHaveClass(
            'rounded-lg',
            'border',
            'shadow-sm',
            'card-custom'
        )
        expect(screen.getByTestId('header')).toHaveClass(
            'flex',
            'flex-col',
            'p-6',
            'header-custom'
        )
        expect(screen.getByText('Quantum State')).toHaveClass(
            'text-2xl',
            'font-semibold',
            'title-custom'
        )
        expect(screen.getByText('Bloch sphere controls')).toHaveClass(
            'p-6',
            'pt-0',
            'content-custom'
        )
    })

    it('forwards refs for card subcomponents', () => {
        const cardRef = createRef<HTMLDivElement>()
        const headerRef = createRef<HTMLDivElement>()
        const titleRef = createRef<HTMLDivElement>()
        const contentRef = createRef<HTMLDivElement>()

        render(
            <Card ref={cardRef}>
                <CardHeader ref={headerRef}>
                    <CardTitle ref={titleRef}>Title</CardTitle>
                </CardHeader>
                <CardContent ref={contentRef}>Content</CardContent>
            </Card>
        )

        expect(cardRef.current).toBeInstanceOf(HTMLDivElement)
        expect(headerRef.current).toBeInstanceOf(HTMLDivElement)
        expect(titleRef.current).toBeInstanceOf(HTMLDivElement)
        expect(contentRef.current).toBeInstanceOf(HTMLDivElement)
    })
})
