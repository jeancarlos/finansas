import type { Metadata, Viewport } from 'next'
import { Roboto, JetBrains_Mono } from 'next/font/google'
import { Providers } from '@/components/providers'
import './globals.css'

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-roboto',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '700', '800'],
  variable: '--font-jetbrains',
})

export const metadata: Metadata = {
  title: 'finansas',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#f8fafc',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${roboto.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
