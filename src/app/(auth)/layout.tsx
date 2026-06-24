import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Masuk',
    template: '%s | Insight Hub',
  },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}
