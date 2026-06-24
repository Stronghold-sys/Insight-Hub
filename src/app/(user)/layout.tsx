import UserLayout from '@/components/user/UserLayout'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Dashboard',
    template: '%s | Insight Hub',
  },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <UserLayout>{children}</UserLayout>
}
