import { supabase } from './supabase'
import type { Session, User } from '@supabase/supabase-js'

export type AdminSessionState = {
  session: Session | null
  user: User | null
  isSignedIn: boolean
}

export async function getAdminSession(): Promise<AdminSessionState> {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  const session = data.session
  const user = session?.user ?? null
  return { session, user, isSignedIn: Boolean(user) }
}

export async function signInAdmin(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })
  if (error) {
    throw new Error(error.message || 'Invalid credentials')
  }
  if (!data.user) {
    throw new Error('Invalid credentials')
  }
  return data
}

export async function signOutAdmin() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export function onAdminAuthChange(callback: (state: AdminSessionState) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    const user = session?.user ?? null
    callback({ session, user, isSignedIn: Boolean(user) })
  })
  return () => data.subscription.unsubscribe()
}
