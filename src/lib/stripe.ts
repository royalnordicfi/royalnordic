import { loadStripe } from '@stripe/stripe-js'

// Load Stripe only if API key is available
const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null

export interface CheckoutSessionData {
  amount: number
  currency: string
  tour_name: string
  tour_date: string
  metadata: {
    tour_id: string
    tour_date_id: string
    customer_name: string
    customer_email: string
    adults: string
    children: string
    total_price: string
  }
}

// Create Stripe Checkout Session using Supabase Edge Function
export async function createCheckoutSession(checkoutData: CheckoutSessionData) {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(checkoutData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create checkout session')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw error
  }
}

// Redirect to Stripe Checkout
export async function redirectToCheckout(sessionId: string) {
  if (!stripePromise) {
    throw new Error('Stripe is not configured. Please add VITE_STRIPE_PUBLISHABLE_KEY to your .env file')
  }
  
  const stripe = await stripePromise
  if (!stripe) {
    throw new Error('Stripe failed to load')
  }

  const { error } = await stripe.redirectToCheckout({
    sessionId: sessionId,
  })

  if (error) {
    throw error
  }
}

// Alternative: Use Stripe Elements for embedded checkout
export async function confirmPayment(clientSecret: string, paymentMethod: any) {
  if (!stripePromise) {
    throw new Error('Stripe is not configured. Please add VITE_STRIPE_PUBLISHABLE_KEY to your .env file')
  }
  
  const stripe = await stripePromise
  if (!stripe) {
    throw new Error('Stripe failed to load')
  }

  const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
    payment_method: paymentMethod,
  })

  if (error) {
    throw error
  }

  return paymentIntent
}
