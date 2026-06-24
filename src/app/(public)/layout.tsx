import type { Metadata } from 'next'
import PublicNavbar from '@/components/public/Navbar'
import PublicFooter from '@/components/public/Footer'

export const metadata: Metadata = {
  title: {
    default: "Insight Hub",
    template: "%s | Insight Hub",
  },
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicNavbar />
      <main>{children}</main>
      <PublicFooter />
    </>
  )
}
