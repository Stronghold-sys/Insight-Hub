'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MoodTambahPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/mood?tambah=true')
  }, [router])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner" style={{ borderColor: 'rgba(2,134,195,0.2)', borderTopColor: 'var(--brand-blue)', width: 36, height: 36, marginBottom: 12 }} />
      <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Membuka form mood...</p>
    </div>
  )
}
