// ============================================
// EMAIL TEMPLATE UTILITIES
// ============================================

/** Escape HTML special characters to prevent XSS in email templates */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const baseStyles = `
  body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
  .header h1 { color: white; margin: 0; font-size: 24px; }
  .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
  .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none; }
  .footer p { color: #666; font-size: 12px; margin: 5px 0; }
  .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
  .button:hover { opacity: 0.9; }
  .info-box { background: #f0f4ff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 0 5px 5px 0; }
  .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 0 5px 5px 0; }
  .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 0 5px 5px 0; }
  .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
  .detail-label { color: #666; }
  .detail-value { font-weight: bold; }
  ul { padding-left: 20px; }
  li { margin: 8px 0; }
`

function wrapTemplate(content: string, siteName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${siteName}</title>
  <style>${baseStyles}</style>
</head>
<body style="background-color: #f4f4f4; margin: 0; padding: 20px;">
  <div class="container">
    ${content}
  </div>
</body>
</html>
`
}

// ============================================
// AUTHENTICATION TEMPLATES
// ============================================

interface WelcomeEmailParams {
  name: string
  siteName: string
  appUrl: string
  courseName?: string
}

export function getWelcomeEmailTemplate(params: WelcomeEmailParams): string {
  const { name, siteName, appUrl, courseName } = params
  const eName = escapeHtml(name)
  const eSiteName = escapeHtml(siteName)

  const courseSection = courseName ? `
    <div class="info-box">
      <p><strong>You registered for:</strong> ${escapeHtml(courseName)}</p>
      <p>Once you confirm your email, you'll have access to begin your journey.</p>
    </div>
  ` : ''

  return wrapTemplate(`
    <div class="header">
      <h1>Welcome to ${eSiteName}!</h1>
    </div>
    <div class="content">
      <p>Hello <strong>${eName}</strong>,</p>
      <p>Thank you for joining ${eSiteName}! We're excited to have you with us.</p>
      ${courseSection}
      <p>Here's what you can do next:</p>
      <ul>
        <li>Complete your profile setup</li>
        <li>Explore available courses and programs</li>
        <li>Connect with your trainer</li>
      </ul>
      <div style="text-align: center;">
        <a href="${appUrl}/client/home" class="button">Go to Dashboard</a>
      </div>
      <p>If you have any questions, feel free to reach out to us through the messaging feature in your dashboard.</p>
      <p>Best regards,<br>The ${eSiteName} Team</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${eSiteName}. All rights reserved.</p>
      <p>You received this email because you created an account on ${eSiteName}.</p>
    </div>
  `, siteName)
}

interface PasswordResetRequestParams {
  name: string
  resetLink: string
  siteName: string
}

export function getPasswordResetRequestTemplate(params: PasswordResetRequestParams): string {
  const { name, resetLink, siteName } = params
  const eName = escapeHtml(name)
  const eSiteName = escapeHtml(siteName)

  return wrapTemplate(`
    <div class="header">
      <h1>Password Reset Request</h1>
    </div>
    <div class="content">
      <p>Hello <strong>${eName}</strong>,</p>
      <p>We received a request to reset your password for your ${eSiteName} account.</p>
      <div style="text-align: center;">
        <a href="${resetLink}" class="button">Reset Password</a>
      </div>
      <div class="warning-box">
        <p><strong>Important:</strong> This link will expire in 1 hour.</p>
        <p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
      </div>
      <p>For security reasons, if you didn't make this request, please consider changing your password anyway.</p>
      <p>Best regards,<br>The ${eSiteName} Team</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${eSiteName}. All rights reserved.</p>
      <p>This is an automated security notification.</p>
    </div>
  `, siteName)
}

interface PasswordResetSuccessParams {
  name: string
  siteName: string
  appUrl: string
}

export function getPasswordResetSuccessTemplate(params: PasswordResetSuccessParams): string {
  const { name, siteName, appUrl } = params
  const eName = escapeHtml(name)
  const eSiteName = escapeHtml(siteName)

  return wrapTemplate(`
    <div class="header">
      <h1>Password Successfully Reset</h1>
    </div>
    <div class="content">
      <p>Hello <strong>${eName}</strong>,</p>
      <div class="success-box">
        <p>Your password has been successfully reset.</p>
      </div>
      <p>You can now log in to your account with your new password.</p>
      <div style="text-align: center;">
        <a href="${appUrl}/auth/login" class="button">Log In Now</a>
      </div>
      <div class="warning-box">
        <p><strong>Security Notice:</strong> If you did not make this change, please contact us immediately and reset your password again.</p>
      </div>
      <p>Best regards,<br>The ${eSiteName} Team</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${eSiteName}. All rights reserved.</p>
      <p>This is an automated security notification.</p>
    </div>
  `, siteName)
}

interface PasswordChangedByAdminParams {
  name: string
  temporaryPassword: string
  siteName: string
  appUrl: string
}

export function getPasswordChangedByAdminTemplate(params: PasswordChangedByAdminParams): string {
  const { name, temporaryPassword, siteName, appUrl } = params
  const eName = escapeHtml(name)
  const eSiteName = escapeHtml(siteName)

  return wrapTemplate(`
    <div class="header">
      <h1>Your Password Has Been Reset</h1>
    </div>
    <div class="content">
      <p>Hello <strong>${eName}</strong>,</p>
      <p>Your account password has been reset by an administrator.</p>
      <div class="info-box">
        <p><strong>Your new temporary password:</strong></p>
        <p style="font-size: 18px; font-family: monospace; background: #fff; padding: 10px; border-radius: 5px; text-align: center;">${escapeHtml(temporaryPassword)}</p>
      </div>
      <div class="warning-box">
        <p><strong>Important:</strong> For security, please change this password immediately after logging in.</p>
      </div>
      <div style="text-align: center;">
        <a href="${appUrl}/auth/login" class="button">Log In Now</a>
      </div>
      <p>If you did not request this password reset, please contact support immediately.</p>
      <p>Best regards,<br>The ${eSiteName} Team</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${eSiteName}. All rights reserved.</p>
      <p>This is an automated security notification.</p>
    </div>
  `, siteName)
}

// ============================================
// PAYMENT TEMPLATES
// ============================================

interface PaymentSuccessClientParams {
  name: string
  courseName: string
  courseSlug: string
  amount: number
  currency: string
  orderId: string
  siteName: string
  appUrl: string
}

export function getPaymentSuccessClientTemplate(params: PaymentSuccessClientParams): string {
  const { name, courseName, courseSlug, amount, currency, orderId, siteName, appUrl } = params
  const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100)
  const eName = escapeHtml(name)
  const eCourseName = escapeHtml(courseName)
  const eSiteName = escapeHtml(siteName)

  return wrapTemplate(`
    <div class="header">
      <h1>Payment Confirmed!</h1>
    </div>
    <div class="content">
      <p>Hello <strong>${eName}</strong>,</p>
      <div class="success-box">
        <p>Thank you for your purchase! Your payment has been successfully processed.</p>
      </div>
      <h3>Order Details</h3>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <div class="detail-row">
          <span class="detail-label">Order ID:</span>
          <span class="detail-value">${escapeHtml(orderId)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Course:</span>
          <span class="detail-value">${eCourseName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Amount Paid:</span>
          <span class="detail-value">${formattedAmount}</span>
        </div>
        <div class="detail-row" style="border-bottom: none;">
          <span class="detail-label">Date:</span>
          <span class="detail-value">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>
      <p>You now have full access to <strong>${eCourseName}</strong>. Start learning today!</p>
      <div style="text-align: center;">
        <a href="${appUrl}/client/courses/${courseSlug}" class="button">Start Learning</a>
      </div>
      <p>If you have any questions about your purchase, please don't hesitate to contact us.</p>
      <p>Best regards,<br>The ${eSiteName} Team</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${eSiteName}. All rights reserved.</p>
      <p>This is your payment confirmation receipt.</p>
    </div>
  `, siteName)
}

interface PaymentSuccessAdminParams {
  clientName: string
  clientEmail: string
  courseName: string
  amount: number
  currency: string
  orderId: string
  siteName: string
  appUrl: string
}

export function getPaymentSuccessAdminTemplate(params: PaymentSuccessAdminParams): string {
  const { clientName, clientEmail, courseName, amount, currency, orderId, siteName, appUrl } = params
  const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100)
  const eSiteName = escapeHtml(siteName)

  return wrapTemplate(`
    <div class="header">
      <h1>New Payment Received!</h1>
    </div>
    <div class="content">
      <div class="success-box">
        <p>A new payment has been successfully processed.</p>
      </div>
      <h3>Payment Details</h3>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <div class="detail-row">
          <span class="detail-label">Client:</span>
          <span class="detail-value">${escapeHtml(clientName)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email:</span>
          <span class="detail-value">${escapeHtml(clientEmail)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Course:</span>
          <span class="detail-value">${escapeHtml(courseName)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Amount:</span>
          <span class="detail-value">${formattedAmount}</span>
        </div>
        <div class="detail-row" style="border-bottom: none;">
          <span class="detail-label">Order ID:</span>
          <span class="detail-value">${escapeHtml(orderId)}</span>
        </div>
      </div>
      <div style="text-align: center;">
        <a href="${appUrl}/dashboard/clients" class="button">View Client</a>
      </div>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${eSiteName}. All rights reserved.</p>
      <p>This is an automated admin notification.</p>
    </div>
  `, siteName)
}

interface PaymentRefundedClientParams {
  name: string
  courseName: string
  amount: number
  currency: string
  siteName: string
}

export function getPaymentRefundedClientTemplate(params: PaymentRefundedClientParams): string {
  const { name, courseName, amount, currency, siteName } = params
  const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100)
  const eName = escapeHtml(name)
  const eCourseName = escapeHtml(courseName)
  const eSiteName = escapeHtml(siteName)

  return wrapTemplate(`
    <div class="header">
      <h1>Refund Processed</h1>
    </div>
    <div class="content">
      <p>Hello <strong>${eName}</strong>,</p>
      <div class="info-box">
        <p>Your refund has been successfully processed.</p>
      </div>
      <h3>Refund Details</h3>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <div class="detail-row">
          <span class="detail-label">Course:</span>
          <span class="detail-value">${eCourseName}</span>
        </div>
        <div class="detail-row" style="border-bottom: none;">
          <span class="detail-label">Refunded Amount:</span>
          <span class="detail-value">${formattedAmount}</span>
        </div>
      </div>
      <p>The refund will be credited to your original payment method within 5-10 business days, depending on your bank.</p>
      <div class="warning-box">
        <p><strong>Note:</strong> Your access to <strong>${eCourseName}</strong> has been revoked as part of this refund.</p>
      </div>
      <p>If you have any questions about this refund, please contact us.</p>
      <p>Best regards,<br>The ${eSiteName} Team</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${eSiteName}. All rights reserved.</p>
      <p>This is your refund confirmation.</p>
    </div>
  `, siteName)
}

interface PaymentRefundedAdminParams {
  clientName: string
  clientEmail: string
  courseName: string
  amount: number
  currency: string
  siteName: string
}

export function getPaymentRefundedAdminTemplate(params: PaymentRefundedAdminParams): string {
  const { clientName, clientEmail, courseName, amount, currency, siteName } = params
  const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100)
  const eSiteName = escapeHtml(siteName)

  return wrapTemplate(`
    <div class="header">
      <h1>Refund Processed</h1>
    </div>
    <div class="content">
      <div class="warning-box">
        <p>A refund has been processed. Course access has been automatically revoked.</p>
      </div>
      <h3>Refund Details</h3>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <div class="detail-row">
          <span class="detail-label">Client:</span>
          <span class="detail-value">${escapeHtml(clientName)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email:</span>
          <span class="detail-value">${escapeHtml(clientEmail)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Course:</span>
          <span class="detail-value">${escapeHtml(courseName)}</span>
        </div>
        <div class="detail-row" style="border-bottom: none;">
          <span class="detail-label">Refunded Amount:</span>
          <span class="detail-value">${formattedAmount}</span>
        </div>
      </div>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${eSiteName}. All rights reserved.</p>
      <p>This is an automated admin notification.</p>
    </div>
  `, siteName)
}

// ============================================
// COURSE ACCESS TEMPLATES
// ============================================

interface CourseAccessGrantedParams {
  name: string
  courseName: string
  courseSlug: string
  siteName: string
  appUrl: string
}

export function getCourseAccessGrantedTemplate(params: CourseAccessGrantedParams): string {
  const { name, courseName, courseSlug, siteName, appUrl } = params
  const eName = escapeHtml(name)
  const eCourseName = escapeHtml(courseName)
  const eSiteName = escapeHtml(siteName)

  return wrapTemplate(`
    <div class="header">
      <h1>Course Access Granted!</h1>
    </div>
    <div class="content">
      <p>Hello <strong>${eName}</strong>,</p>
      <div class="success-box">
        <p>Great news! You've been granted access to a new course.</p>
      </div>
      <div class="info-box">
        <p><strong>Course:</strong> ${eCourseName}</p>
      </div>
      <p>You can start learning right away. Log in to your account to access all course materials.</p>
      <div style="text-align: center;">
        <a href="${appUrl}/client/courses/${courseSlug}" class="button">Start Course</a>
      </div>
      <p>If you have any questions about the course content, feel free to reach out through the messaging feature.</p>
      <p>Best regards,<br>The ${eSiteName} Team</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${eSiteName}. All rights reserved.</p>
      <p>You received this email because you were granted access to a course.</p>
    </div>
  `, siteName)
}

interface CourseAccessRevokedParams {
  name: string
  courseName: string
  reason?: string
  siteName: string
  appUrl: string
}

export function getCourseAccessRevokedTemplate(params: CourseAccessRevokedParams): string {
  const { name, courseName, reason, siteName, appUrl } = params
  const eName = escapeHtml(name)
  const eCourseName = escapeHtml(courseName)
  const eSiteName = escapeHtml(siteName)

  const reasonSection = reason ? `
    <div class="info-box">
      <p><strong>Reason:</strong> ${escapeHtml(reason)}</p>
    </div>
  ` : ''

  return wrapTemplate(`
    <div class="header">
      <h1>Course Access Update</h1>
    </div>
    <div class="content">
      <p>Hello <strong>${eName}</strong>,</p>
      <div class="warning-box">
        <p>Your access to <strong>${eCourseName}</strong> has been revoked.</p>
      </div>
      ${reasonSection}
      <p>If you believe this is an error or would like to regain access, please contact us.</p>
      <div style="text-align: center;">
        <a href="${appUrl}/client/messages" class="button">Contact Us</a>
      </div>
      <p>Best regards,<br>The ${eSiteName} Team</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${eSiteName}. All rights reserved.</p>
      <p>This is an automated notification about your course access.</p>
    </div>
  `, siteName)
}

// ============================================
// MESSAGE TEMPLATES
// ============================================

interface NewMessageClientParams {
  clientName: string
  senderName: string
  messagePreview: string
  conversationId: string
  siteName: string
  appUrl: string
}

export function getNewMessageClientTemplate(params: NewMessageClientParams): string {
  const { clientName, senderName, messagePreview, conversationId, siteName, appUrl } = params
  const eSiteName = escapeHtml(siteName)
  const ePreview = escapeHtml(messagePreview.substring(0, 200)) + (messagePreview.length > 200 ? '...' : '')

  return wrapTemplate(`
    <div class="header">
      <h1>New Message</h1>
    </div>
    <div class="content">
      <p>Hello <strong>${escapeHtml(clientName)}</strong>,</p>
      <p>You have received a new message from <strong>${escapeHtml(senderName)}</strong>.</p>
      <div class="info-box">
        <p style="font-style: italic; color: #555;">"${ePreview}"</p>
      </div>
      <div style="text-align: center;">
        <a href="${appUrl}/client/messages?conversation=${conversationId}" class="button">View Message</a>
      </div>
      <p>Best regards,<br>The ${eSiteName} Team</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${eSiteName}. All rights reserved.</p>
      <p>You received this email because someone sent you a message.</p>
    </div>
  `, siteName)
}

interface NewMessageAdminParams {
  clientName: string
  clientEmail: string
  messagePreview: string
  conversationId: string
  siteName: string
  appUrl: string
}

export function getNewMessageAdminTemplate(params: NewMessageAdminParams): string {
  const { clientName, clientEmail, messagePreview, conversationId, siteName, appUrl } = params
  const eSiteName = escapeHtml(siteName)
  const ePreview = escapeHtml(messagePreview.substring(0, 300)) + (messagePreview.length > 300 ? '...' : '')

  return wrapTemplate(`
    <div class="header">
      <h1>New Client Message</h1>
    </div>
    <div class="content">
      <p>You have received a new message from a client.</p>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <div class="detail-row">
          <span class="detail-label">From:</span>
          <span class="detail-value">${escapeHtml(clientName)}</span>
        </div>
        <div class="detail-row" style="border-bottom: none;">
          <span class="detail-label">Email:</span>
          <span class="detail-value">${escapeHtml(clientEmail)}</span>
        </div>
      </div>
      <div class="info-box">
        <p><strong>Message:</strong></p>
        <p style="font-style: italic; color: #555;">"${ePreview}"</p>
      </div>
      <div style="text-align: center;">
        <a href="${appUrl}/dashboard/messages?conversation=${conversationId}" class="button">Reply Now</a>
      </div>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${eSiteName}. All rights reserved.</p>
      <p>This is an automated admin notification.</p>
    </div>
  `, siteName)
}

// ============================================
// CLIENT MANAGEMENT TEMPLATES
// ============================================

interface NewClientAdminParams {
  clientName: string
  clientEmail: string
  source?: string
  siteName: string
  appUrl: string
}

export function getNewClientAdminTemplate(params: NewClientAdminParams): string {
  const { clientName, clientEmail, source, siteName, appUrl } = params
  const eSiteName = escapeHtml(siteName)

  const sourceSection = source ? `
    <div class="detail-row">
      <span class="detail-label">Source:</span>
      <span class="detail-value">${escapeHtml(source)}</span>
    </div>
  ` : ''

  return wrapTemplate(`
    <div class="header">
      <h1>New Client Registration</h1>
    </div>
    <div class="content">
      <div class="success-box">
        <p>A new client has registered on ${eSiteName}!</p>
      </div>
      <h3>Client Details</h3>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <div class="detail-row">
          <span class="detail-label">Name:</span>
          <span class="detail-value">${escapeHtml(clientName)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email:</span>
          <span class="detail-value">${escapeHtml(clientEmail)}</span>
        </div>
        ${sourceSection}
        <div class="detail-row" style="border-bottom: none;">
          <span class="detail-label">Registered:</span>
          <span class="detail-value">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
      <div style="text-align: center;">
        <a href="${appUrl}/dashboard/clients" class="button">View Clients</a>
      </div>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${eSiteName}. All rights reserved.</p>
      <p>This is an automated admin notification.</p>
    </div>
  `, siteName)
}

interface ClientOnboardedParams {
  name: string
  temporaryPassword?: string
  assignedCourses?: string[]
  siteName: string
  appUrl: string
}

export function getClientOnboardedTemplate(params: ClientOnboardedParams): string {
  const { name, temporaryPassword, assignedCourses, siteName, appUrl } = params
  const eName = escapeHtml(name)
  const eSiteName = escapeHtml(siteName)

  const passwordSection = temporaryPassword ? `
    <div class="info-box">
      <p><strong>Your login credentials:</strong></p>
      <p style="font-size: 16px; font-family: monospace; background: #fff; padding: 10px; border-radius: 5px;">Password: ${escapeHtml(temporaryPassword)}</p>
      <p style="font-size: 12px; color: #666;">Please change this password after your first login.</p>
    </div>
  ` : ''

  const coursesSection = assignedCourses && assignedCourses.length > 0 ? `
    <h3>Your Assigned Courses</h3>
    <ul>
      ${assignedCourses.map(course => `<li>${escapeHtml(course)}</li>`).join('')}
    </ul>
  ` : ''

  return wrapTemplate(`
    <div class="header">
      <h1>Welcome to ${eSiteName}!</h1>
    </div>
    <div class="content">
      <p>Hello <strong>${eName}</strong>,</p>
      <p>Your account has been created and you're ready to start your fitness journey!</p>
      ${passwordSection}
      ${coursesSection}
      <p>Here's what you can do:</p>
      <ul>
        <li>Access your personalized courses and programs</li>
        <li>Track your progress</li>
        <li>Communicate directly with your trainer</li>
      </ul>
      <div style="text-align: center;">
        <a href="${appUrl}/auth/login" class="button">Log In to Your Account</a>
      </div>
      <p>If you have any questions, don't hesitate to reach out!</p>
      <p>Best regards,<br>The ${eSiteName} Team</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${eSiteName}. All rights reserved.</p>
      <p>You received this email because an account was created for you.</p>
    </div>
  `, siteName)
}

// ============================================
// ACCOUNT TEMPLATES
// ============================================

interface AccountDeletedParams {
  name: string
  siteName: string
}

export function getAccountDeletedTemplate(params: AccountDeletedParams): string {
  const { name, siteName } = params
  const eName = escapeHtml(name)
  const eSiteName = escapeHtml(siteName)

  return wrapTemplate(`
    <div class="header">
      <h1>Account Deleted</h1>
    </div>
    <div class="content">
      <p>Hello <strong>${eName}</strong>,</p>
      <p>Your ${eSiteName} account has been successfully deleted as requested.</p>
      <div class="info-box">
        <p>All your personal data has been removed from our systems in accordance with our privacy policy.</p>
      </div>
      <p>We're sorry to see you go. If you ever want to return, you're always welcome to create a new account.</p>
      <p>Thank you for being part of ${eSiteName}.</p>
      <p>Best regards,<br>The ${eSiteName} Team</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${eSiteName}. All rights reserved.</p>
      <p>This is a confirmation of your account deletion request.</p>
    </div>
  `, siteName)
}

// ============================================
// ACCOUNT DELETED (ADMIN) TEMPLATE
// ============================================

interface AccountDeletedAdminParams {
  clientName: string
  clientEmail: string
  siteName: string
}

export function getAccountDeletedAdminTemplate(params: AccountDeletedAdminParams): string {
  const { clientName, clientEmail, siteName } = params
  const eSiteName = escapeHtml(siteName)

  return wrapTemplate(`
    <div class="header">
      <h1>Account Deletion Notice</h1>
    </div>
    <div class="content">
      <p>A client has deleted their account:</p>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <div class="detail-row">
          <span class="detail-label">Name:</span>
          <span class="detail-value">${escapeHtml(clientName)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email:</span>
          <span class="detail-value">${escapeHtml(clientEmail)}</span>
        </div>
        <div class="detail-row" style="border-bottom: none;">
          <span class="detail-label">Date:</span>
          <span class="detail-value">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${eSiteName}. All rights reserved.</p>
      <p>This is an automated admin notification.</p>
    </div>
  `, siteName)
}
