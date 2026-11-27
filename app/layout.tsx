import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

export const metadata: Metadata = {
    title: 'Bloch Sphere',
    description: 'The geometric representation of quantum states and operations',
    icons: {
        icon: [
            {
                url: `${basePath}/icon-light-32x32.png`,
                media: '(prefers-color-scheme: light)',
            },
            {
                url: `${basePath}/icon-dark-32x32.png`,
                media: '(prefers-color-scheme: dark)',
            },
            {
                url: `${basePath}/icon.svg`,
                type: 'image/svg+xml',
            },
        ],
        apple: `${basePath}/apple-icon.png`,
    },
}

export const viewport: Viewport = {
    viewportFit: 'cover',
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
            <body className={GeistSans.className}>
                {children}

                {process.env.NODE_ENV === 'production' && (
                    <>
                        <Analytics />
                    </>
                )}
            </body>
        </html>
    )
}
