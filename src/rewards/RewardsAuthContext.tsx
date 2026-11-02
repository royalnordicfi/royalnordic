import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { getRewardsSession, onRewardsAuthChange } from './auth'

type Ctx = {
  session: Session | null
  user: User | null
  isSignedIn: boolean
  loading: boolean
}

const RewardsAuthContext = createContext<Ctx>({
  session: null,
  user: null,
  isSignedIn: false,
  loading: true,
})

export function RewardsAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    getRewardsSession()
      .then((s) => {
        if (!alive) return
        setSession(s.session)
        setUser(s.user)
      })
      .catch(() => {
        if (!alive) return
        setSession(null)
        setUser(null)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    const unsub = onRewardsAuthChange((s) => {
      setSession(s.session)
      setUser(s.user)
      setLoading(false)
    })

    return () => {
      alive = false
      unsub()
    }
  }, [])

  return (
    <RewardsAuthContext.Provider
      value={{ session, user, isSignedIn: Boolean(user), loading }}
    >
      {children}
    </RewardsAuthContext.Provider>
  )
}

export function useRewardsAuth() {
  return useContext(RewardsAuthContext)
}
