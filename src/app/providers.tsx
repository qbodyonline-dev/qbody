'use client'

import { LocaleProvider } from '@/lib/i18n'
import { AuthProvider } from '@/lib/auth'
import { Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
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
  )
}
