/**
 * Server-side reCAPTCHA verification
 * Secret key loaded from environment variable (NEVER hardcode!)
 */

export async function verifyRecaptcha(token: string): Promise<{ success: boolean; score: number }> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY
  
  if (!secretKey) {
    console.error('RECAPTCHA_SECRET_KEY is not set in environment variables')
    return { success: false, score: 0 }
  }

  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secretKey}&response=${token}`,
    })
    const data = await res.json()
    return { 
      success: data.success === true && (data.score ?? 0) >= 0.5, 
      score: data.score ?? 0 
    }
  } catch (err) {
    console.error('reCAPTCHA verification error:', err)
    return { success: false, score: 0 }
  }
}
