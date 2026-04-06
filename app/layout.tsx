import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next';
import { GoogleAnalytics } from '@next/third-parties/google'
import './globals.css'

export const metadata: Metadata = {
    title: 'Bloch Sphere',
    description: 'The geometric representation of quantum states and operations',
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
            </body>

            <Analytics />
            {process.env.NEXT_PUBLIC_GA_ID && (<GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />)}
        </html>
    )
}
