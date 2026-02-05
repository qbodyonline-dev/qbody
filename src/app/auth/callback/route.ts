import { NextResponse } from 'next/server'

// Redirect to client-side page that can handle hash fragments
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  
  // If we have a code, redirect to client page with the code
  if (code) {
    const targetUrl = new URL('/auth/callback/handle', requestUrl.origin)
    targetUrl.searchParams.set('code', code)
    if (type) targetUrl.searchParams.set('type', type)
    return NextResponse.redirect(targetUrl)
  }
  
  // If no code, still redirect to client page to handle hash tokens
  return NextResponse.redirect(new URL('/auth/callback/handle', requestUrl.origin))
}
