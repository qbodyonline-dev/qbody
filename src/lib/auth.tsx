'use client'

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { createClient } from '@/lib/supabase'
import { User, Session, SupabaseClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

type Profile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  role: 'admin' | 'trainer' | 'client'
  onboarding_completed?: boolean
}

type AuthContextType = {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  isAdmin: boolean
  isTrainer: boolean
  isClient: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  
  const supabaseRef = useRef<SupabaseClient | null>(null)
  
  if (typeof window !== 'undefined' && !supabaseRef.current) {
    try {
      supabaseRef.current = createClient()
    } catch (e) {
      console.error('Auth: failed to create client:', e)
    }
  }

  const fetchProfile = async (userId: string) => {
    if (!supabaseRef.current) return
    try {
      const { data, error } = await supabaseRef.current
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) {
        // Profile fetch failed silently
        return
      }
      if (data) setProfile(data as Profile)
    } catch (e) {
      // Profile fetch exception
    }
  }

  useEffect(() => {
    setMounted(true)

    if (!supabaseRef.current) {
      setLoading(false)
      return
    }

    const supabase = supabaseRef.current

    const timeout = setTimeout(() => {
      // Auth timeout — forcing loading=false
      setLoading(false)
    }, 3000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        clearTimeout(timeout)
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }

        setLoading(false)
      }
    )

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        clearTimeout(timeout)
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchProfile(session.user.id)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Auth: getSession error:', err)
        clearTimeout(timeout)
        setLoading(false)
      })

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!supabaseRef.current) return { error: 'No client' }
    const { error } = await supabaseRef.current.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!supabaseRef.current) return { error: 'No client' }
    const { error } = await supabaseRef.current.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    })
    return { error: error?.message ?? null }
  }

  const signOut = async () => {
    if (!supabaseRef.current) return
    await supabaseRef.current.auth.signOut()
    setUser(null)
    setProfile(null)
    setSession(null)
    router.push('/')
    router.refresh()
  }

  return (
    <AuthContext.Provider value={{
      user, profile, session, loading,
      signIn, signUp, signOut,
      isAdmin: profile?.role === 'admin',
      isTrainer: profile?.role === 'trainer',
      isClient: profile?.role === 'client',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
