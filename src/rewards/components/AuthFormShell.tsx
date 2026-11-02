import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Props = {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

export default function AuthFormShell({ title, subtitle, children, footer }: Props) {
  return (
    <div className="rn-rewards-auth mx-auto w-full max-w-md">
      <p className="rn-eyebrow text-aurora-soft">Royal Nordic Rewards</p>
      <h1 className="mt-2 font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] text-white sm:text-[2rem]">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-2 text-sm leading-relaxed text-[var(--rn-text-muted)]">{subtitle}</p>
      ) : null}
      <div className="mt-8 space-y-4">{children}</div>
      {footer ? <div className="mt-8 text-sm text-[var(--rn-text-muted)]">{footer}</div> : null}
      <p className="mt-6 text-center text-xs text-[var(--rn-text-dim)]">
        <Link to="/referralprogram" className="underline-offset-2 hover:text-white hover:underline">
          ← Back to Rewards
        </Link>
      </p>
    </div>
  )
}

export function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--rn-text-muted)]">
      {children}
    </label>
  )
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-[var(--rn-radius-sm)] border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
      {message}
    </p>
  )
}

export function FormSuccess({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="status" className="rounded-[var(--rn-radius-sm)] border border-aurora/30 bg-aurora/10 px-3 py-2 text-sm text-aurora-soft">
      {message}
    </p>
  )
}
