import { NextResponse } from 'next/server'

// Redirect to client-side page that can handle hash fragments
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  
  // If we have a code, redirect to client page with the code
  if (code) {
    // ✅ SANITIZE: Only allow alphanumeric + hyphens in auth code
    const cleanCode = code.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 500)
    if (!cleanCode) {
      return NextResponse.redirect(new URL('/auth/login?error=invalid_code', requestUrl.origin))
    }
    
    // ✅ VALIDATE: Only allow known auth types
    const allowedTypes = ['recovery', 'signup', 'magiclink', 'invite']
    const cleanType = type && allowedTypes.includes(type) ? type : null
    
    const targetUrl = new URL('/auth/callback/handle', requestUrl.origin)
    targetUrl.searchParams.set('code', cleanCode)
    if (cleanType) targetUrl.searchParams.set('type', cleanType)
    return NextResponse.redirect(targetUrl)
  }
  
  // If no code, still redirect to client page to handle hash tokens
  return NextResponse.redirect(new URL('/auth/callback/handle', requestUrl.origin))
}
