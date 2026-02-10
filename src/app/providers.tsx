'use client'

import React from 'react'
import { LocaleProvider } from '@/lib/i18n'
import { AuthProvider } from '@/lib/auth'
import { Toaster } from 'sonner'
import { CookieConsent } from '@/components/cookie-consent'

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[PROVIDERS] Error caught:', error.message, error.stack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center', fontFamily: 'system-ui' }}>
          <h2 style={{ color: '#ef4444', marginBottom: 8 }}>Something went wrong</h2>
          <p style={{ color: '#71717a' }}>Please refresh the page or try again later.</p>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: 16, padding: '8px 24px', borderRadius: 8, background: '#14b8a6', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            Refresh Page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LocaleProvider>
          {children}
          <CookieConsent />
          <Toaster 
            position="top-right" 
            toastOptions={{
              style: {
                background: '#18181b',
                color: '#fff',
                border: '1px solid #27272a',
              },
            }}
          />
        </LocaleProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
