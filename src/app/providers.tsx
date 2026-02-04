'use client'

import React from 'react'
import { LocaleProvider } from '@/lib/i18n'
import { AuthProvider } from '@/lib/auth'
import { Toaster } from 'sonner'

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
        <div style={{ padding: 20, color: 'red', fontFamily: 'monospace' }}>
          <h2>App Error</h2>
          <pre>{this.state.error?.message}</pre>
          <pre>{this.state.error?.stack}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  console.log('[PROVIDERS] Rendering...')
  
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LocaleProvider>
          {children}
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
