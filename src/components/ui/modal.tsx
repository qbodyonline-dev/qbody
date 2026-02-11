'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-6xl',
}

export function Modal({ isOpen, onClose, title, description, children, size = 'md' }: ModalProps) {
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = React.useState(false)

  // Only render portal on client
  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setTimeout(() => {
        if (contentRef.current) contentRef.current.scrollTop = 0
      }, 10)
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen || !mounted) return null

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal box */}
      <div className={cn(
        'relative w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl',
        'animate-in fade-in zoom-in-95 duration-200',
        'max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-3rem)]',
        'flex flex-col',
        sizeClasses[size]
      )}>
        {/* Header — fixed at top */}
        {(title || description) && (
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-700 flex-shrink-0 rounded-t-2xl bg-white dark:bg-zinc-900">
            <div className="min-w-0 flex-1 mr-4">
              {title && <h2 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>}
              {description && <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{description}</p>}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
              <X className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* Close button if no header */}
        {!title && !description && (
          <div className="absolute top-3 right-3 z-10">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        )}
        
        {/* Content — scrollable */}
        <div ref={contentRef} className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  )

  // Portal to body — escapes ALL parent stacking contexts
  return createPortal(modalContent, document.body)
}
