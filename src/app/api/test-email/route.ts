import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const testEmail = searchParams.get('email')
  
  if (!testEmail) {
    return NextResponse.json({ 
      error: 'Add ?email=your@email.com to test',
      config: {
        RESEND_API_KEY: process.env.RESEND_API_KEY ? 
          `${process.env.RESEND_API_KEY.substring(0, 10)}...` : 'NOT SET',
        EMAIL_FROM: process.env.EMAIL_FROM || 'NOT SET',
        ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'NOT SET',
      }
    }, { status: 400 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Qbody <onboarding@resend.dev>',
      to: [testEmail],
      subject: 'Test Email from Qbody',
      html: `
        <h1>Test Email</h1>
        <p>If you see this, email is working!</p>
        <p>Sent at: ${new Date().toISOString()}</p>
        <hr>
        <p><strong>Config:</strong></p>
        <ul>
          <li>FROM: ${process.env.EMAIL_FROM}</li>
          <li>API Key: ${process.env.RESEND_API_KEY?.substring(0, 10)}...</li>
        </ul>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ 
        success: false, 
        error: error,
        config: {
          RESEND_API_KEY: process.env.RESEND_API_KEY ? 
            `${process.env.RESEND_API_KEY.substring(0, 10)}...` : 'NOT SET',
          EMAIL_FROM: process.env.EMAIL_FROM || 'NOT SET',
        }
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: `Test email sent to ${testEmail}` 
    })
  } catch (err: any) {
    console.error('Exception:', err)
    return NextResponse.json({ 
      success: false, 
      error: err.message,
      stack: err.stack,
      config: {
        RESEND_API_KEY: process.env.RESEND_API_KEY ? 
          `${process.env.RESEND_API_KEY.substring(0, 10)}...` : 'NOT SET',
        EMAIL_FROM: process.env.EMAIL_FROM || 'NOT SET',
      }
    }, { status: 500 })
  }
}
