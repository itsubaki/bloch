import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vitest"
import RootLayout, { metadata, viewport } from "@/app/layout"

vi.mock("geist/font/sans", () => ({
    GeistSans: {
        variable: "font-sans-variable",
        className: "font-sans-class",
    },
}))

vi.mock("geist/font/mono", () => ({
    GeistMono: {
        variable: "font-mono-variable",
    },
}))

vi.mock("@vercel/analytics/next", () => ({
    Analytics: () => <div data-testid="analytics" />,
}))

vi.mock("@next/third-parties/google", () => ({
    GoogleAnalytics: ({ gaId }: { gaId: string }) => <div data-testid="ga">{gaId}</div>,
    GoogleTagManager: ({ gtmId }: { gtmId: string }) => <div data-testid="gtm">{gtmId}</div>,
}))

describe("app/layout", () => {
    const originalEnv = {
        NEXT_PUBLIC_GTM_ID: process.env.NEXT_PUBLIC_GTM_ID,
        NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
    }

    afterEach(() => {
        process.env.NEXT_PUBLIC_GTM_ID = originalEnv.NEXT_PUBLIC_GTM_ID
        process.env.NEXT_PUBLIC_GA_ID = originalEnv.NEXT_PUBLIC_GA_ID
    })

    it("exports metadata and renders the base layout without optional analytics tags", () => {
        delete process.env.NEXT_PUBLIC_GTM_ID
        delete process.env.NEXT_PUBLIC_GA_ID

        const markup = renderToStaticMarkup(
            <RootLayout>
                <main>content</main>
            </RootLayout>,
        )

        expect(metadata).toMatchObject({
            title: "Bloch Sphere",
            description: "The geometric representation of quantum states and operations",
        })
        expect(viewport).toMatchObject({ viewportFit: "cover" })
        expect(markup).toContain('<html lang="en" class="font-sans-variable font-mono-variable">')
        expect(markup).toContain('<body class="font-sans-class"><main>content</main>')
        expect(markup).toContain('data-testid="analytics"')
        expect(markup).not.toContain('data-testid="gtm"')
        expect(markup).not.toContain('data-testid="ga"')
    })

    it("renders optional Google analytics integrations when ids are present", () => {
        process.env.NEXT_PUBLIC_GTM_ID = "GTM-TEST"
        process.env.NEXT_PUBLIC_GA_ID = "GA-TEST"

        const markup = renderToStaticMarkup(
            <RootLayout>
                <main>content</main>
            </RootLayout>,
        )

        expect(markup).toContain('data-testid="gtm">GTM-TEST</div>')
        expect(markup).toContain('data-testid="ga">GA-TEST</div>')
    })
})
