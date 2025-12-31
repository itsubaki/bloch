import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next';
import { GoogleTagManager, GoogleAnalytics } from '@next/third-parties/google'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bloch',
  description: 'Created with v0',
  generator: 'v0.dev',
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
      {process.env.NEXT_PUBLIC_GTM_ID && (<GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />)}
      {process.env.NEXT_PUBLIC_GA_ID && (<GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />)}
    </html>
  )
}
