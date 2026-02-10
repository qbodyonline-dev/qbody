/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  // ═══════════ SECURITY HEADERS ═══════════
  async headers() {
    return [
      {
        // Apply to ALL routes
        source: '/:path*',
        headers: [
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Prevent clickjacking — site cannot be embedded in iframes
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // XSS Protection (legacy browsers)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Control referrer info sent to other sites
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Disable browser features we don't need
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          // Force HTTPS for 1 year
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              // Default: only same origin
              "default-src 'self'",
              // Scripts: self + reCAPTCHA + inline (needed for JSON-LD & page builder)
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com",
              // Styles: self + inline (Tailwind + page builder inline styles)
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Images: self + Supabase storage + Unsplash + data URIs
              "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com",
              // Fonts: self + Google Fonts
              "font-src 'self' https://fonts.gstatic.com",
              // API connections: self + Supabase + Stripe
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://www.google.com",
              // Frames: only reCAPTCHA
              "frame-src https://www.google.com https://js.stripe.com",
              // Media: self + Supabase storage (video courses)
              "media-src 'self' https://*.supabase.co blob:",
              // Block all object/embed/applet
              "object-src 'none'",
              // Base URI: only self
              "base-uri 'self'",
              // Form submissions: only self + Stripe
              "form-action 'self' https://checkout.stripe.com",
              // Upgrade HTTP to HTTPS
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
      {
        // API routes — extra protection
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Prevent API responses from being cached by browsers
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
        ],
      },
    ]
  },

  // Disable X-Powered-By header (hides Next.js from attackers)
  poweredByHeader: false,
}

module.exports = nextConfig
