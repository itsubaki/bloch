import { describe, expect, it } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn', () => {
    it('joins class names and omits falsy values', () => {
        expect(cn('px-2', false && 'hidden', 'py-1')).toBe('px-2 py-1')
    })

    it('merges conflicting tailwind classes', () => {
        expect(cn('px-2 text-sm', 'px-4', ['text-lg'])).toBe('px-4 text-lg')
    })
})
