export const PLANS = {
  free: {
    name: 'Free',
    priceId: process.env.STRIPE_PRICE_FREE,
    price: 0,
    maxDocuments: 3,
    watermark: true,
    features: ['3 lifetime document saves', 'Watermarked PDF export'],
  },
  starter: {
    name: 'Starter',
    priceId: process.env.STRIPE_PRICE_STARTER,
    price: 49,
    maxDocuments: Infinity,
    watermark: false,
    features: ['Unlimited documents', 'No watermark', 'Priority support'],
  },
  enterprise: {
    name: 'Enterprise',
    priceId: process.env.STRIPE_PRICE_ENTERPRISE,
    price: 199,
    maxDocuments: Infinity,
    watermark: false,
    features: ['Everything in Starter', 'No watermark', 'Priority support', 'Custom branding'],
  },
} as const;

export type PlanType = keyof typeof PLANS;