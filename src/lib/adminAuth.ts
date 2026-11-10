import { supabase } from './supabase'
import type { Session, User } from '@supabase/supabase-js'

export type AdminSessionState = {
  session: Session | null
  user: User | null
  isSignedIn: boolean
}

function toState(session: Session | null): AdminSessionState {
  const user = session?.user ?? null
  return { session, user, isSignedIn: Boolean(user && session) }
}

export async function getAdminSession(): Promise<AdminSessionState> {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return toState(data.session)
}

/**
 * Wait until auth has finished initializing and return the current session.
 * Prefer this over a bare getSession() on first paint / route remounts.
 */
export async function waitForAuthSession(): Promise<AdminSessionState> {
  const current = await getAdminSession()
  if (current.isSignedIn) return current

  return await new Promise<AdminSessionState>((resolve) => {
    let settled = false
    const finish = (state: AdminSessionState) => {
      if (settled) return
      settled = true
      subscription.unsubscribe()
      resolve(state)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        event === 'INITIAL_SESSION' ||
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED'
      ) {
        finish(toState(session))
      }
    })

    // Fallback: don't hang the UI if events are delayed.
    window.setTimeout(() => {
      void getAdminSession().then(finish)
    }, 2500)
  })
}

/** Ensure the client has a concrete in-memory session before privileged auth calls. */
export async function requireAuthSession(): Promise<Session> {
  const waited = await waitForAuthSession()
  if (!waited.session) {
    throw new Error('Your session expired. Please sign in again.')
  }

  const { data: setData, error: setError } = await supabase.auth.setSession({
    access_token: waited.session.access_token,
    refresh_token: waited.session.refresh_token,
  })
  if (setError) {
    throw new Error(setError.message || 'Your session expired. Please sign in again.')
  }
  if (!setData.session) {
    throw new Error('Your session expired. Please sign in again.')
  }

  // Verify with the Auth server (not only local storage).
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Your session expired. Please sign in again.')
  }

  return setData.session
}

export async function signInAdmin(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })
  if (error) {
    throw new Error(error.message || 'Invalid credentials')
  }
  if (!data.user || !data.session) {
    throw new Error('Signed in, but session was not ready. Please try again.')
  }
  return data
}

/**
 * Update password using a verified session. Surfaces expired-session clearly.
 * Does not touch must_change_password — caller must complete the server RPC after success.
 */
export async function updateAdminPassword(password: string) {
  await requireAuthSession()
  const { data, error } = await supabase.auth.updateUser({ password })
  if (error) {
    const msg = error.message || 'Could not update password'
    if (/auth session missing/i.test(msg) || /session/i.test(msg)) {
      throw new Error('Your session expired. Please sign in again.')
    }
    throw new Error(msg)
  }
  return data
}

export async function signOutAdmin() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export function onAdminAuthChange(callback: (state: AdminSessionState) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(toState(session))
  })
  return () => data.subscription.unsubscribe()
}

export function isExpiredSessionMessage(message: string): boolean {
  return /session expired|auth session missing|not[_ ]authenticated|sign in again/i.test(message)
}
