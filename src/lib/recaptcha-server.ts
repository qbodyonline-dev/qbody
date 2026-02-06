const SECRET_KEY = '6LdXxWIsAAAAAGNcKiMqwxNigRv-3aMZmWWlsOnw'

export async function verifyRecaptcha(token: string): Promise<{ success: boolean; score: number }> {
  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${SECRET_KEY}&response=${token}`,
    })
    const data = await res.json()
    return { success: data.success === true && (data.score ?? 0) >= 0.5, score: data.score ?? 0 }
  } catch {
    return { success: false, score: 0 }
  }
}
