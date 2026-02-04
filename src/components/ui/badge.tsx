import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-teal-500/10 text-teal-600',
        secondary: 'bg-zinc-100 text-zinc-600',
        success: 'bg-green-500/10 text-green-600',
        warning: 'bg-yellow-500/10 text-yellow-600',
        destructive: 'bg-red-500/10 text-red-600',
        outline: 'border border-zinc-200 text-zinc-600',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
