import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'baru aja'
  if (diffMins < 60) return `${diffMins} menit lalu`
  if (diffHours < 24) return `${diffHours} jam lalu`
  if (diffDays < 7) return `${diffDays} hari lalu`
  return formatDate(date)
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str
  return str.slice(0, len) + '...'
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Scoring helpers
export function calculateConfidenceScore(answeredCount: number, totalCount: number): number {
  const ratio = answeredCount / totalCount
  if (ratio >= 0.9) return 95
  if (ratio >= 0.8) return 80
  if (ratio >= 0.7) return 65
  if (ratio >= 0.5) return 50
  return 30
}

export function getScoreCategory(score: number): {
  label: string
  description: string
  color: string
} {
  if (score >= 80) return { label: 'Sangat Kuat', description: 'Pola ini sangat dominan di kamu', color: 'var(--teal)' }
  if (score >= 60) return { label: 'Cukup Kuat', description: 'Pola ini cukup sering muncul', color: 'var(--brand-blue)' }
  if (score >= 40) return { label: 'Sedang', description: 'Pola ini muncul tapi tidak dominan', color: 'var(--warning)' }
  return { label: 'Rendah', description: 'Pola ini jarang atau tidak terdeteksi', color: 'var(--error)' }
}

export function getMoodColor(mood: string): string {
  const colors: Record<string, string> = {
    happy: '#F5A623',
    calm: '#17B897',
    anxious: '#E67E22',
    sad: '#3498DB',
    frustrated: '#D32F2F',
    neutral: '#8DA4BE',
    excited: '#9B59B6',
    grateful: '#2ECC71',
    overwhelmed: '#E74C3C',
    hopeful: '#1ABC9C',
  }
  return colors[mood] || '#8DA4BE'
}

export function formatCurrency(amount: number, currency = 'IDR'): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validatePassword(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  if (password.length < 8) errors.push('Minimal 8 karakter')
  if (!/[A-Z]/.test(password)) errors.push('Harus ada huruf kapital')
  if (!/[0-9]/.test(password)) errors.push('Harus ada angka')
  return { valid: errors.length === 0, errors }
}
