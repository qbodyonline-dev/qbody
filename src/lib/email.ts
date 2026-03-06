import { Resend } from 'resend'
import {
  getWelcomeEmailTemplate,
  getPasswordResetRequestTemplate,
  getPasswordResetSuccessTemplate,
  getPasswordChangedByAdminTemplate,
  getPaymentSuccessClientTemplate,
  getPaymentSuccessAdminTemplate,
  getPaymentRefundedClientTemplate,
  getPaymentRefundedAdminTemplate,
  getCourseAccessGrantedTemplate,
  getCourseAccessRevokedTemplate,
  getNewMessageClientTemplate,
  getNewMessageAdminTemplate,
  getNewClientAdminTemplate,
  getAccountDeletedTemplate,
  getClientOnboardedTemplate,
} from './email-templates'

let _resend: Resend | null = null
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'Qbody <noreply@qbody.fit>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@qbody.fit'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://qbody.fit'
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Qbody by Khavanskaia'

interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}

async function sendEmail({ to, subject, html, replyTo }: SendEmailOptions) {
  try {
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      replyTo,
    })

    if (error) {
      console.error('Email send error:', error)
      return { success: false, error }
    }

    console.log('Email sent successfully:', data?.id)
    return { success: true, data }
  } catch (error) {
    console.error('Email send exception:', error)
    return { success: false, error }
  }
}

// ============================================
// AUTHENTICATION EMAILS
// ============================================

export async function sendWelcomeEmail(
  email: string,
  name: string,
  courseName?: string
) {
  return sendEmail({
    to: email,
    subject: `Welcome to ${SITE_NAME}!`,
    html: getWelcomeEmailTemplate({
      name,
      siteName: SITE_NAME,
      appUrl: APP_URL,
      courseName,
    }),
  })
}

export async function sendPasswordResetRequest(
  email: string,
  name: string,
  resetLink: string
) {
  return sendEmail({
    to: email,
    subject: 'Password Reset Request',
    html: getPasswordResetRequestTemplate({
      name,
      resetLink,
      siteName: SITE_NAME,
    }),
  })
}

export async function sendPasswordResetSuccess(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: 'Password Successfully Reset',
    html: getPasswordResetSuccessTemplate({
      name,
      siteName: SITE_NAME,
      appUrl: APP_URL,
    }),
  })
}

export async function sendPasswordChangedByAdmin(
  email: string,
  name: string,
  temporaryPassword: string
) {
  return sendEmail({
    to: email,
    subject: 'Your Password Has Been Reset',
    html: getPasswordChangedByAdminTemplate({
      name,
      temporaryPassword,
      siteName: SITE_NAME,
      appUrl: APP_URL,
    }),
  })
}

// ============================================
// PAYMENT EMAILS
// ============================================

export async function sendPaymentSuccessClient(
  email: string,
  name: string,
  data: {
    courseName: string
    courseSlug: string
    amount: number
    currency: string
    orderId: string
  }
) {
  return sendEmail({
    to: email,
    subject: `Payment Confirmed - ${data.courseName}`,
    html: getPaymentSuccessClientTemplate({
      name,
      courseName: data.courseName,
      courseSlug: data.courseSlug,
      amount: data.amount,
      currency: data.currency,
      orderId: data.orderId,
      siteName: SITE_NAME,
      appUrl: APP_URL,
    }),
  })
}

export async function sendPaymentSuccessAdmin(data: {
  clientName: string
  clientEmail: string
  courseName: string
  amount: number
  currency: string
  orderId: string
}) {
  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `New Payment Received - ${data.courseName}`,
    html: getPaymentSuccessAdminTemplate({
      ...data,
      siteName: SITE_NAME,
      appUrl: APP_URL,
    }),
  })
}

export async function sendPaymentRefundedClient(
  email: string,
  name: string,
  data: {
    courseName: string
    amount: number
    currency: string
  }
) {
  return sendEmail({
    to: email,
    subject: 'Payment Refunded',
    html: getPaymentRefundedClientTemplate({
      name,
      courseName: data.courseName,
      amount: data.amount,
      currency: data.currency,
      siteName: SITE_NAME,
    }),
  })
}

export async function sendPaymentRefundedAdmin(data: {
  clientName: string
  clientEmail: string
  courseName: string
  amount: number
  currency: string
}) {
  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `Refund Processed - ${data.courseName}`,
    html: getPaymentRefundedAdminTemplate({
      ...data,
      siteName: SITE_NAME,
    }),
  })
}

// ============================================
// COURSE ACCESS EMAILS
// ============================================

export async function sendCourseAccessGranted(
  email: string,
  name: string,
  data: {
    courseName: string
    courseSlug: string
  }
) {
  return sendEmail({
    to: email,
    subject: `Access Granted - ${data.courseName}`,
    html: getCourseAccessGrantedTemplate({
      name,
      courseName: data.courseName,
      courseSlug: data.courseSlug,
      siteName: SITE_NAME,
      appUrl: APP_URL,
    }),
  })
}

export async function sendCourseAccessRevoked(
  email: string,
  name: string,
  data: {
    courseName: string
    reason?: string
  }
) {
  return sendEmail({
    to: email,
    subject: `Course Access Update - ${data.courseName}`,
    html: getCourseAccessRevokedTemplate({
      name,
      courseName: data.courseName,
      reason: data.reason,
      siteName: SITE_NAME,
      appUrl: APP_URL,
    }),
  })
}

// ============================================
// MESSAGE EMAILS
// ============================================

export async function sendNewMessageToClient(
  email: string,
  clientName: string,
  data: {
    senderName: string
    messagePreview: string
    conversationId: string
  }
) {
  return sendEmail({
    to: email,
    subject: `New Message from ${data.senderName}`,
    html: getNewMessageClientTemplate({
      clientName,
      senderName: data.senderName,
      messagePreview: data.messagePreview,
      conversationId: data.conversationId,
      siteName: SITE_NAME,
      appUrl: APP_URL,
    }),
  })
}

export async function sendNewMessageToAdmin(data: {
  clientName: string
  clientEmail: string
  messagePreview: string
  conversationId: string
}) {
  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `New Message from ${data.clientName}`,
    html: getNewMessageAdminTemplate({
      ...data,
      siteName: SITE_NAME,
      appUrl: APP_URL,
    }),
  })
}

// ============================================
// CLIENT MANAGEMENT EMAILS
// ============================================

export async function sendNewClientNotification(data: {
  clientName: string
  clientEmail: string
  source?: string
}) {
  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `New Client Registration - ${data.clientName}`,
    html: getNewClientAdminTemplate({
      ...data,
      siteName: SITE_NAME,
      appUrl: APP_URL,
    }),
  })
}

export async function sendClientOnboarded(
  email: string,
  name: string,
  data: {
    temporaryPassword?: string
    assignedCourses?: string[]
  }
) {
  return sendEmail({
    to: email,
    subject: `Welcome to ${SITE_NAME}!`,
    html: getClientOnboardedTemplate({
      name,
      temporaryPassword: data.temporaryPassword,
      assignedCourses: data.assignedCourses,
      siteName: SITE_NAME,
      appUrl: APP_URL,
    }),
  })
}

// ============================================
// ACCOUNT EMAILS
// ============================================

export async function sendAccountDeleted(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: 'Account Deleted',
    html: getAccountDeletedTemplate({
      name,
      siteName: SITE_NAME,
    }),
  })
}

export async function sendAccountDeletedAdmin(data: {
  clientName: string
  clientEmail: string
}) {
  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `Account Deleted - ${data.clientName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Account Deletion Notice</h2>
        <p>A client has deleted their account:</p>
        <ul>
          <li><strong>Name:</strong> ${data.clientName}</li>
          <li><strong>Email:</strong> ${data.clientEmail}</li>
          <li><strong>Date:</strong> ${new Date().toISOString()}</li>
        </ul>
        <p style="color: #666; font-size: 12px;">This is an automated notification from ${SITE_NAME}.</p>
      </div>
    `,
  })
}
