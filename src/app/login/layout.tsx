import type { Viewport } from 'next'

export const viewport: Viewport = {
  themeColor: '#4f46e5',
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
