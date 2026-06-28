import type { Metadata } from 'next'
import PublicNavbar from '@/components/public/Navbar'
import PublicFooter from '@/components/public/Footer'
import { getSessionUser } from '@/lib/auth'

export const metadata: Metadata = {
  title: {
    default: "Insight Hub",
    template: "%s | Insight Hub",
  },
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  return (
    <>
      <PublicNavbar initialUser={user} />
      <main>{children}</main>
      <PublicFooter />
    </>
  )
}
