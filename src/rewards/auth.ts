import { supabase } from '../lib/supabase'
import type { Session, User } from '@supabase/supabase-js'

export type RewardsSessionState = {
  session: Session | null
  user: User | null
  isSignedIn: boolean
  loading: boolean
}

/** Production email redirects always use the live domain (never preview/localhost). */
const PRODUCTION_ORIGIN = 'https://royalnordic.fi'

function rewardsSiteOrigin(): string {
  if (import.meta.env.PROD) return PRODUCTION_ORIGIN
  if (typeof window !== 'undefined' && window.location.origin) return window.location.origin
  return PRODUCTION_ORIGIN
}

export function rewardsAuthRedirect(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`
  return `${rewardsSiteOrigin()}${clean}`
}

export async function getRewardsSession(): Promise<Omit<RewardsSessionState, 'loading'>> {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  const session = data.session
  const user = session?.user ?? null
  return { session, user, isSignedIn: Boolean(user) }
}

export async function signUpRewards(email: string, password: string, displayName?: string) {
  const trimmed = email.trim().toLowerCase()
  const { data, error } = await supabase.auth.signUp({
    email: trimmed,
    password,
    options: {
      emailRedirectTo: rewardsAuthRedirect('/referralprogram/verify'),
      data: {
        display_name: displayName?.trim() || trimmed.split('@')[0],
      },
    },
  })
  if (error) throw new Error(error.message || 'Could not create account')
  return data
}

export async function signInRewards(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })
  if (error) throw new Error(error.message || 'Invalid email or password')
  if (!data.user) throw new Error('Invalid email or password')
  return data
}

export async function signOutRewards() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: rewardsAuthRedirect('/referralprogram/reset-password'),
  })
  if (error) throw new Error(error.message || 'Could not send reset email')
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw new Error(error.message || 'Could not update password')
}

export async function resendVerificationEmail(email: string) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo: rewardsAuthRedirect('/referralprogram/verify'),
    },
  })
  if (error) throw new Error(error.message || 'Could not resend email')
}

export function onRewardsAuthChange(callback: (state: Omit<RewardsSessionState, 'loading'>) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    const user = session?.user ?? null
    callback({ session, user, isSignedIn: Boolean(user) })
  })
  return () => data.subscription.unsubscribe()
}

export function authErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  const lower = msg.toLowerCase()
  if (lower.includes('already registered') || lower.includes('already been registered')) {
    return 'An account with this email already exists. Sign in instead.'
  }
  if (lower.includes('invalid login') || lower.includes('invalid credentials')) {
    return 'Invalid email or password.'
  }
  if (lower.includes('email not confirmed')) {
    return 'Confirm your email before signing in. Check your inbox for the link.'
  }
  if (lower.includes('password') && lower.includes('least')) {
    return 'Password must be at least 6 characters.'
  }
  if (lower.includes('rate limit') || lower.includes('too many')) {
    return 'Too many attempts. Please wait a moment and try again.'
  }
  return msg || 'Something went wrong. Please try again.'
}
