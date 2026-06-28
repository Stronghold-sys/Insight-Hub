'use client'

import React, { useEffect } from 'react'
import { AlertTriangle, Info, Trash2, X } from 'lucide-react'

export type ConfirmDialogVariant = 'danger' | 'warning' | 'info'

interface ConfirmDialogProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmDialogVariant
}

export default function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  variant = 'danger',
}: ConfirmDialogProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  if (!isOpen) return null

  const isDanger = variant === 'danger'
  const isWarning = variant === 'warning'

  const iconBg = isDanger ? 'rgba(211,47,47,0.12)' : isWarning ? 'rgba(245,166,35,0.12)' : 'rgba(2,134,195,0.12)'
  const iconColor = isDanger ? 'var(--error)' : isWarning ? 'var(--warning)' : 'var(--brand-blue)'
  const btnBg = isDanger ? 'var(--error)' : isWarning ? 'var(--warning)' : 'var(--brand-blue)'

  const Icon = isDanger ? Trash2 : isWarning ? AlertTriangle : Info

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.18s ease',
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-modal)',
          width: '100%',
          maxWidth: '420px',
          padding: '28px 28px 24px',
          border: '1px solid var(--border)',
          animation: 'fadeInScale 0.2s ease',
          position: 'relative',
        }}
      >
        <button
          onClick={onCancel}
          aria-label="Tutup dialog"
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={16} />
        </button>

        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: iconBg, color: iconColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          <Icon size={22} />
        </div>

        <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
          {title}
        </h3>

        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 24px' }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} className="btn btn-secondary btn-sm" style={{ minWidth: 80 }}>
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="btn btn-sm"
            style={{ minWidth: 80, background: btnBg, color: '#fff', border: 'none' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
