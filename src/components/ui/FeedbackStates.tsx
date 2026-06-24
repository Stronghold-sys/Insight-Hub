'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, FileQuestion } from 'lucide-react'

// ==========================================
// 1. LOADING STATE ANIMATION
// ==========================================
export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 80, height: 80, marginBottom: 16 }}>
        {/* Orbital Neon Ring 1 */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '2px solid transparent',
            borderTopColor: 'var(--brand-blue)',
            borderBottomColor: 'var(--teal)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
        {/* Orbital Neon Ring 2 */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 8,
            borderRadius: '50%',
            border: '2px solid transparent',
            borderLeftColor: '#7C3AED',
            borderRightColor: '#EC4899',
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        />
        {/* Pulsing Core */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 22,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--brand-blue), var(--teal))',
            boxShadow: '0 0 15px rgba(2, 134, 195, 0.5)',
          }}
          animate={{
            scale: [0.85, 1.15, 0.85],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <motion.p
        style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {message}
      </motion.p>
    </div>
  )
}

// ==========================================
// 2. SUCCESS STATE ANIMATION
// ==========================================
export function SuccessState({ message = 'Berhasil!', onComplete }: { message?: string, onComplete?: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 72, height: 72, marginBottom: 16 }}>
        {/* Concentric Ripple Ring */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
          }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: [1, 1.3], opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'easeOut' }}
        />
        {/* Draw checkmark circle */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '2px solid #10B981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 150 }}
        >
          {/* Checkmark SVG drawing */}
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <motion.path
              d="M20 6L9 17L4 12"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.25, duration: 0.45, ease: 'easeInOut' }}
            />
          </svg>
        </motion.div>

        {/* Floating confetti dots */}
        {[...Array(6)].map((_, i) => {
          const angle = (i * 360) / 6
          const rad = (angle * Math.PI) / 180
          const x = Math.cos(rad) * 40
          const y = Math.sin(rad) * 40
          return (
            <motion.div
              key={i}
              style={{
                position: 'absolute',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: i % 2 === 0 ? '#10B981' : '#34D399',
                left: 'calc(50% - 3px)',
                top: 'calc(50% - 3px)',
              }}
              initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
              animate={{ scale: [0, 1.2, 0], x, y, opacity: [1, 1, 0] }}
              transition={{ delay: 0.2, duration: 0.7, ease: 'easeOut' }}
            />
          )
        })}
      </div>
      <motion.h3
        style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {message}
      </motion.h3>
    </div>
  )
}

// ==========================================
// 3. ERROR STATE ANIMATION
// ==========================================
export function ErrorState({ message = 'Ada kesalahan nih...', onRetry }: { message?: string, onRetry?: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
      <motion.div
        style={{ position: 'relative', width: 72, height: 72, marginBottom: 16 }}
        animate={{
          x: [0, -6, 6, -6, 6, 0],
        }}
        transition={{ duration: 0.45, ease: 'easeInOut' }}
      >
        {/* Pulsing warning aura */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Error icon circle */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '2px solid #EF4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* Shaking cross drawing */}
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <motion.path
              d="M18 6L6 18M6 6l12 12"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            />
          </svg>
        </div>
      </motion.div>
      <motion.h3
        style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px' }}
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {message}
      </motion.h3>
      {onRetry && (
        <motion.button
          onClick={onRetry}
          className="btn btn-secondary btn-sm"
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Coba Lagi
        </motion.button>
      )}
    </div>
  )
}

// ==========================================
// 4. EMPTY STATE ANIMATION
// ==========================================
export function EmptyState({ title = 'Belum ada data', message = 'Halaman ini kosong, coba tambah data baru ya.' }: { title?: string, message?: string }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 96, height: 96, marginBottom: 16 }}>
        {/* Floating background shape */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 8,
            borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(2, 134, 195, 0.08), rgba(23, 184, 151, 0.08))',
            border: '1px dashed var(--border)',
          }}
          animate={{
            y: [0, -8, 0],
            rotate: [0, 4, 0],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Floating magnifying glass icon */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
          }}
          animate={{
            y: [-4, 4, -4],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <FileQuestion size={44} strokeWidth={1.5} />
        </motion.div>

        {/* Drifting particle dots */}
        <motion.div
          style={{ position: 'absolute', top: 12, right: 12, width: 4, height: 4, borderRadius: '50%', background: 'var(--brand-blue)' }}
          animate={{ y: [0, -16, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
        />
        <motion.div
          style={{ position: 'absolute', bottom: 12, left: 12, width: 4, height: 4, borderRadius: '50%', background: 'var(--teal)' }}
          animate={{ y: [0, -12, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 1 }}
        />
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>{title}</h3>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, maxWidth: 320, lineHeight: 1.5 }}>{message}</p>
    </div>
  )
}

// ==========================================
// 5. ONBOARDING MOTION / STEP CONTAINER
// ==========================================
export function OnboardingMotion({ children, stepKey }: { children: React.ReactNode, stepKey: string | number }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepKey}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        style={{ width: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// ==========================================
// 6. MICRO-INTERACTION WRAPPERS
// ==========================================
export function BouncyButton({ children, className, style, onClick, disabled, type = 'button' }: { children: React.ReactNode, className?: string, style?: React.CSSProperties, onClick?: (e: any) => void, disabled?: boolean, type?: 'button' | 'submit' }) {
  return (
    <motion.button
      type={type}
      className={className}
      style={{ ...style, border: 'none', background: 'none', padding: 0 }}
      whileHover={{ scale: disabled ? 1 : 1.02, translateY: disabled ? 0 : -1 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </motion.button>
  )
}

export function HoverTiltCard({ children, className, style, onClick }: { children: React.ReactNode, className?: string, style?: React.CSSProperties, onClick?: () => void }) {
  return (
    <motion.div
      className={className}
      style={style}
      whileHover={{
        y: -4,
        scale: 1.005,
        boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.08)',
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}
