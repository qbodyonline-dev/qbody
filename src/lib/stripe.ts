import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
  typescript: true,
})

// Course product definitions
// These map to Stripe Products created on first checkout
export const COURSES = {
  'breast-augmentation-recovery': {
    name: 'Recovery after Breast Augmentation',
    nameSecondary: 'Восстановление после увеличения груди',
    price: 9900, // cents
    currency: 'usd',
  },
  'cesarean-recovery': {
    name: 'Recovery after C-Section',
    nameSecondary: 'Восстановление после кесарева сечения',
    price: 9900, // cents
    currency: 'usd',
  },
} as const

export type CourseSlug = keyof typeof COURSES
