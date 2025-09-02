// Crypto payment integration with Coinbase Commerce

export interface CryptoCheckoutData {
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
    phone?: string
    special_requests?: string
  }
}

export interface CryptoCheckoutResponse {
  success: boolean
  hosted_url?: string
  charge_id?: string
  error?: string
}

export const createCryptoCheckout = async (checkoutData: CryptoCheckoutData): Promise<CryptoCheckoutResponse> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-crypto-checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(checkoutData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create crypto checkout')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Crypto checkout error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Crypto checkout failed'
    }
  }
}

export const redirectToCryptoCheckout = (hostedUrl: string) => {
  if (hostedUrl) {
    window.location.href = hostedUrl
  }
}
