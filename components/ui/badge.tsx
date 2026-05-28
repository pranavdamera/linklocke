import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:     'border-transparent bg-primary text-primary-foreground',
        secondary:   'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline:     'text-foreground',
        alive:     'bg-green-500/15  text-green-400  border-green-500/30',
        active:    'bg-blue-500/15   text-blue-400   border-blue-500/30',
        boxed:     'bg-gray-500/15   text-gray-400   border-gray-500/30',
        missed:    'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
        dead:      'bg-red-500/15    text-red-400    border-red-500/30',
        champion:  'bg-yellow-400/15 text-yellow-300 border-yellow-400/30',
        caught:    'bg-blue-500/15   text-blue-400   border-blue-500/30',
        shiny:     'bg-yellow-300/15 text-yellow-200 border-yellow-300/30',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
