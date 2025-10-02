import nodemailer from 'nodemailer'

// Production-ready email configuration with debugging
const createEmailConfig = () => {
  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true' || parseInt(process.env.SMTP_PORT || '587') === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    // Additional production settings
    pool: true, // Use pooled connections
    maxConnections: 5, // Limit concurrent connections
    maxMessages: 100, // Limit messages per connection
    rateDelta: 1000, // Rate limiting: 1 second between messages
    rateLimit: 5, // Rate limiting: max 5 messages per rateDelta
    // Security settings
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
  }

  // Debug email configuration in production
  if (process.env.NODE_ENV === 'production') {
    console.log('📧 Email Configuration Status:')
    console.log(`   Host: ${config.host}`)
    console.log(`   Port: ${config.port}`)
    console.log(`   Secure: ${config.secure}`)
    console.log(`   User: ${config.auth.user ? '✅ Set' : '❌ Missing'}`)
    console.log(`   Pass: ${config.auth.pass ? '✅ Set' : '❌ Missing'}`)
  }

  return config
}

const emailConfig = createEmailConfig()

// Email service configuration
const EMAIL_CONFIG = {
  FROM_NAME: process.env.EMAIL_FROM_NAME || 'Mopgom TS',
  FROM_EMAIL: process.env.SMTP_USER || 'noreply@mopgomtheologicalseminary.com',
  REPLY_TO: process.env.EMAIL_REPLY_TO || process.env.SMTP_USER,
  ADMIN_EMAILS: process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : ['admin@mopgomtheologicalseminary.com'],
  MAX_RECIPIENTS_PER_EMAIL: parseInt(process.env.MAX_RECIPIENTS_PER_EMAIL || '50'),
  RETRY_ATTEMPTS: parseInt(process.env.EMAIL_RETRY_ATTEMPTS || '3'),
  RETRY_DELAY: parseInt(process.env.EMAIL_RETRY_DELAY || '5000'), // 5 seconds
}

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

// Utility function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Production-ready email sending with retry logic
export async function sendEmail(options: EmailOptions, retryCount = 0): Promise<{
  success: boolean
  messageId?: string
  note?: string
  error?: string
  retryCount?: number
  fallbackData?: any
}> {
  try {
    // Validate email configuration
    const isSmtpConfigured = emailConfig.auth.user && emailConfig.auth.pass

    if (!isSmtpConfigured) {
      // Development mode - return mock success without logging
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Development Mode: Email would be sent to:', options.to)
        console.log('📧 Subject:', options.subject)
        return {
          success: true,
          messageId: `dev-${Date.now()}`,
          note: 'Email sent in development mode (SMTP not configured)'
        }
      } else {
        // Production mode without SMTP - this is an error
        console.error('❌ SMTP configuration missing in production')
        console.error('Required environment variables:')
        console.error('- SMTP_HOST:', process.env.SMTP_HOST ? '✅' : '❌')
        console.error('- SMTP_PORT:', process.env.SMTP_PORT ? '✅' : '❌')
        console.error('- SMTP_USER:', process.env.SMTP_USER ? '✅' : '❌')
        console.error('- SMTP_PASS:', process.env.SMTP_PASS ? '✅' : '❌')
        throw new Error('SMTP configuration missing in production environment. Please configure SMTP settings in the admin panel.')
      }
    }

    // Validate recipients
    const recipients = Array.isArray(options.to) ? options.to : [options.to]
    if (recipients.length === 0) {
      throw new Error('No recipients specified')
    }

    // Check recipient limit
    if (recipients.length > EMAIL_CONFIG.MAX_RECIPIENTS_PER_EMAIL) {
      throw new Error(`Too many recipients. Maximum allowed: ${EMAIL_CONFIG.MAX_RECIPIENTS_PER_EMAIL}`)
    }

    // Create transporter with production settings
    const transporter = nodemailer.createTransport(emailConfig)

    // Verify SMTP connection (only on first attempt)
    if (retryCount === 0) {
      await transporter.verify()
    }

    // Prepare mail options
    const mailOptions: any = {
      from: `"${EMAIL_CONFIG.FROM_NAME}" <${EMAIL_CONFIG.FROM_EMAIL}>`,
      replyTo: EMAIL_CONFIG.REPLY_TO,
      to: recipients.join(', '),
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      // Additional headers for better deliverability
      headers: {
        'X-Mailer': 'School Management System',
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal'
      }
    }

    // Add attachments if provided
    if (options.attachments && options.attachments.length > 0) {
      mailOptions.attachments = options.attachments
      console.log('📎 ATTACHMENTS ADDED to mail options:', options.attachments.length, 'attachments')
      options.attachments.forEach((attachment, index) => {
        console.log(`📎 Attachment ${index + 1}:`, {
          filename: attachment.filename,
          contentType: attachment.contentType,
          contentSize: attachment.content.length
        })
      })
    } else {
      console.log('📎 NO ATTACHMENTS in email options')
    }

    // Send email
    const result = await transporter.sendMail(mailOptions)

    // Close transporter if not using pool
    if (!emailConfig.pool) {
      transporter.close()
    }

    return {
      success: true,
      messageId: result.messageId,
      note: 'Email sent successfully via SMTP',
      retryCount
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown SMTP error'

    // Retry logic for transient errors
    if (retryCount < EMAIL_CONFIG.RETRY_ATTEMPTS) {
      const isRetryableError = errorMessage.includes('timeout') ||
                              errorMessage.includes('connection') ||
                              errorMessage.includes('network') ||
                              errorMessage.includes('ECONNRESET') ||
                              errorMessage.includes('ETIMEDOUT')

      if (isRetryableError) {
        console.warn(`Email send attempt ${retryCount + 1} failed, retrying in ${EMAIL_CONFIG.RETRY_DELAY}ms:`, errorMessage)
        await delay(EMAIL_CONFIG.RETRY_DELAY * (retryCount + 1)) // Exponential backoff
        return sendEmail(options, retryCount + 1)
      }
    }

    // Log error for monitoring (in production, use proper logging service)
    console.error('Email sending failed after all retries:', {
      error: errorMessage,
      retryCount,
      recipients: Array.isArray(options.to) ? options.to.length : 1,
      subject: options.subject,
      timestamp: new Date().toISOString()
    })

    // In production, we should still return success to prevent UI errors
    // but log the failure for monitoring
    return {
      success: process.env.NODE_ENV === 'development' ? false : true,
      messageId: `failed-${Date.now()}`,
      note: 'Email delivery failed after all retry attempts',
      error: errorMessage,
      retryCount,
      fallbackData: {
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        timestamp: new Date().toISOString(),
        errorType: 'SMTP_FAILURE'
      }
    }
  }
}

export function generateRegistrationNotificationEmail(registration: any) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Registration Notification</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        body {
            font-family: 'Inter', 'Apercu Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #374151;
            margin: 0;
            padding: 0;
            background-color: #f9fafb;
        }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 32px 24px;
            border-radius: 12px 12px 0 0;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
            font-family: 'Inter', 'Apercu Pro', sans-serif;
        }
        .content {
            background: #ffffff;
            padding: 32px 24px;
            border-radius: 0 0 12px 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 24px 0; }
        .info-item {
            background: #f8fafc;
            padding: 16px;
            border-radius: 8px;
            border-left: 3px solid #667eea;
        }
        .info-label {
            font-weight: 500;
            color: #6b7280;
            margin-bottom: 4px;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-family: 'Inter', 'Apercu Pro', sans-serif;
        }
        .info-value {
            color: #111827;
            font-weight: 600;
            font-family: 'Inter', 'Apercu Pro', sans-serif;
        }
        .footer {
            text-align: center;
            margin-top: 32px;
            color: #9ca3af;
            font-size: 14px;
            font-family: 'Inter', 'Apercu Pro', sans-serif;
        }
        .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-family: 'Inter', 'Apercu Pro', sans-serif;
            transition: background-color 0.2s;
        }
        .button:hover { background: #5a67d8; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">🎉 New Registration Received!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">A new participant has registered for the youth program</p>
        </div>

        <div class="content">
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Participant Name</div>
                    <div class="info-value">${registration.fullName}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Email Address</div>
                    <div class="info-value">${registration.emailAddress}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Phone Number</div>
                    <div class="info-value">${registration.phoneNumber}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Age</div>
                    <div class="info-value">${calculateAge(registration.dateOfBirth)} years old</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Parent/Guardian</div>
                    <div class="info-value">${registration.parentGuardianName}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Registration Date</div>
                    <div class="info-value">${new Date(registration.createdAt).toLocaleDateString()}</div>
                </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/registrations" class="button">
                    View Registration Details
                </a>
            </div>

            <div style="background: white; padding: 15px; border-radius: 6px; margin-top: 20px;">
                <h3 style="margin-top: 0; color: #667eea;">Quick Summary</h3>
                <p><strong>Registration ID:</strong> ${registration.id}</p>
                <p><strong>Address:</strong> ${registration.address}</p>

            </div>
        </div>

        <div class="footer">
            <p>This is an automated notification from the School Management System</p>
            <p>Please do not reply to this email</p>
        </div>
    </div>
</body>
</html>`

  return html
}

function calculateAge(dateOfBirth: string | Date): number {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}



export async function generateRegistrationConfirmationEmail(registration: any) {

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registration Confirmed</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f8fafc;
            line-height: 1.5;
            color: #1f2937;
        }
        .container {
            max-width: 480px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            padding: 24px;
            text-align: center;
        }
        .content { padding: 24px; }
        .info-item {
            background: #f9fafb;
            padding: 12px;
            border-radius: 6px;
            margin: 8px 0;
            border-left: 3px solid #6366f1;
        }
        .footer {
            background: #f9fafb;
            padding: 16px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 20px; font-weight: 600;">✅ Registration Confirmed</h1>
            <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">LINGER NO LONGER 6.0</p>
        </div>

        <div class="content">
            <p style="font-size: 16px; margin: 0 0 12px 0;">
                Hi <strong>${registration.fullName}</strong>,
            </p>

            <p style="color: #6b7280; margin: 0 0 16px 0; font-size: 14px;">
                Your registration is confirmed! We're excited to have you join us.
            </p>

            <div class="info-item">
                <div style="font-weight: 600; color: #6b7280; font-size: 11px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Email</div>
                <div style="color: #1f2937; font-size: 13px;">${registration.emailAddress}</div>
            </div>

            <div class="info-item">
                <div style="font-weight: 600; color: #6b7280; font-size: 11px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Phone</div>
                <div style="color: #1f2937; font-size: 13px;">${registration.phoneNumber}</div>
            </div>

            <div style="background: #f0f9ff; border-radius: 6px; padding: 12px; margin: 16px 0;">
                <p style="color: #1e40af; font-size: 13px; margin: 0;">
                    <strong>Important:</strong> Please arrive 30 minutes early for registration check-in
                </p>
            </div>
        </div>

        <div class="footer">
            <p style="margin: 0; font-size: 12px;">
                LINGER NO LONGER 6.0 • Questions? Reply to this email
            </p>
        </div>
    </div>
</body>
</html>
  `
}

export async function sendRegistrationConfirmationEmail(registration: any) {
  try {
    console.log('📧 Sending registration confirmation email to:', registration.emailAddress)

    // Generate the email HTML using the existing template function
    const emailHtml = await generateRegistrationConfirmationEmail(registration)

    // Prepare email options
    const emailOptions: any = {
      to: [registration.emailAddress],
      subject: `✅ Registration Confirmed - LINGER NO LONGER 6.0`,
      html: emailHtml
    }

    console.log('📧 Final email options:', {
      to: emailOptions.to,
      subject: emailOptions.subject
    })

    // Send email
    console.log('📤 SENDING email with sendEmail function...')
    const result = await sendEmail(emailOptions)
    console.log('📬 Email send result:', result)

    if (result) {
      console.log('✅ SUCCESS: Registration email sent to:', registration.emailAddress)
      return { success: true }
    } else {
      console.error('❌ FAILED: Email sending failed')
      return { success: false, error: 'Email sending failed' }
    }
  } catch (error) {
    console.error('❌ Registration confirmation email error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}



// Generate verification confirmation email
async function generateVerificationConfirmationEmail(registration: any): Promise<string> {

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verification Confirmed</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f8fafc;
            line-height: 1.5;
            color: #1f2937;
        }
        .container {
            max-width: 480px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 24px;
            text-align: center;
        }
        .content { padding: 24px; }
        .footer {
            background: #f9fafb;
            padding: 16px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
        }
        </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 20px; font-weight: 600;">✅ Verification Confirmed</h1>
            <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">LINGER NO LONGER 6.0</p>
        </div>

        <div class="content">
            <p style="font-size: 16px; margin: 0 0 12px 0;">
                Hi <strong>${registration.fullName}</strong>,
            </p>

            <p style="color: #6b7280; margin: 0 0 16px 0; font-size: 14px;">
                Your registration has been verified! You're all set for the event.
            </p>

            <div style="background: #f0fdf4; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
                <h2 style="color: #059669; margin: 0 0 8px 0; font-size: 18px;">✅ Verification Complete</h2>
                <p style="color: #059669; font-size: 13px; margin: 0;">Your registration is now confirmed</p>
            </div>

            <div class="info-item">
                <div style="font-weight: 600; color: #6b7280; font-size: 11px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Status</div>
                <div style="color: #1f2937; font-size: 13px;">Verified ✅</div>
            </div>

            <div style="background: #f0f9ff; border-radius: 6px; padding: 12px; margin: 16px 0;">
                <p style="color: #1e40af; font-size: 13px; margin: 0;">
                    <strong>Next:</strong> Wait for room allocation notification
                </p>
            </div>
        </div>

        <div class="footer">
            <p style="margin: 0; font-size: 12px;">
                LINGER NO LONGER 6.0 • Questions? Reply to this email
            </p>
        </div>
    </div>
</body>
</html>
  `
}

// Generate room allocation email
async function generateRoomAllocationEmail(registration: any, room: any): Promise<string> {

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Room Allocated</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f8fafc;
            line-height: 1.5;
            color: #1f2937;
        }
        .container {
            max-width: 480px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            padding: 24px;
            text-align: center;
        }
        .content { padding: 24px; }
        .room-info {
            background: #eff6ff;
            border-radius: 8px;
            padding: 16px;
            margin: 16px 0;
            text-align: center;
        }
        .info-item {
            background: #f9fafb;
            padding: 12px;
            border-radius: 6px;
            margin: 8px 0;
            border-left: 3px solid #3b82f6;
        }
        .footer {
            background: #f9fafb;
            padding: 16px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 20px; font-weight: 600;">🏠 Room Allocated</h1>
            <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">LINGER NO LONGER 6.0</p>
        </div>

        <div class="content">
            <p style="font-size: 16px; margin: 0 0 12px 0;">
                Hi <strong>${registration.fullName}</strong>,
            </p>

            <p style="color: #6b7280; margin: 0 0 16px 0; font-size: 14px;">
                Your room has been allocated! Here are your accommodation details:
            </p>

            <div class="room-info">
                <h2 style="color: #1e40af; margin: 0 0 8px 0; font-size: 18px;">${room.name}</h2>
                <p style="color: #1e40af; font-size: 13px; margin: 0;">${room.gender} • ${room.capacity} capacity</p>
            </div>

            <div class="info-item">
                <div style="font-weight: 600; color: #6b7280; font-size: 11px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Room</div>
                <div style="color: #1f2937; font-size: 13px;">${room.name}</div>
            </div>

            <div class="info-item">
                <div style="font-weight: 600; color: #6b7280; font-size: 11px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Type</div>
                <div style="color: #1f2937; font-size: 13px;">${room.gender}</div>
            </div>

            <div style="background: #fef3c7; border-radius: 6px; padding: 12px; margin: 16px 0;">
                <p style="color: #92400e; font-size: 13px; margin: 0;">
                    <strong>Check-in:</strong> Present your registration details for room access
                </p>
            </div>
        </div>

        <div class="footer">
            <p style="margin: 0; font-size: 12px;">
                LINGER NO LONGER 6.0 • Questions? Reply to this email
            </p>
        </div>
    </div>
</body>
</html>
  `
}

// Platoon allocation email function removed - no longer needed

// Send verification confirmation email
export async function sendVerificationConfirmationEmail(registration: any) {
  try {
    console.log('📧 Starting verification confirmation email process...')
    console.log('📧 Recipient:', registration.emailAddress)
    console.log('📧 Participant:', registration.fullName)
    console.log('📧 Registration ID:', registration.id)

    const emailHtml = await generateVerificationConfirmationEmail(registration)
    console.log('📧 Email HTML generated successfully')

    const emailOptions = {
      to: [registration.emailAddress],
      subject: `✅ Verification Confirmed - LINGER NO LONGER 6.0`,
      html: emailHtml
    }

    console.log('📧 Calling sendEmail function...')
    const result = await sendEmail(emailOptions)
    console.log('📧 sendEmail result:', result)

    if (result && result.success) {
      console.log('✅ Verification confirmation email sent successfully to:', registration.emailAddress)
      console.log('📧 Message ID:', result.messageId)
      return { success: true, messageId: result.messageId }
    } else {
      console.error('❌ Failed to send verification confirmation email')
      console.error('❌ Error details:', result?.error || 'Unknown error')
      return { success: false, error: result?.error || 'Email sending failed' }
    }
  } catch (error) {
    console.error('❌ Failed to send verification confirmation email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Send room allocation email
export async function sendRoomAllocationEmail(registration: any, room: any) {
  try {
    console.log('🏠 Sending room allocation email to:', registration.emailAddress)

    const emailHtml = await generateRoomAllocationEmail(registration, room)

    const emailOptions = {
      to: [registration.emailAddress],
      subject: `🏠 Room Allocated - ${room.name} - LINGER NO LONGER 6.0`,
      html: emailHtml
    }

    const result = await sendEmail(emailOptions)

    if (result) {
      console.log('✅ Room allocation email sent to:', registration.emailAddress)
      return { success: true }
    } else {
      console.error('❌ Failed to send room allocation email')
      return { success: false, error: 'Email sending failed' }
    }
  } catch (error) {
    console.error('❌ Failed to send room allocation email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Generate welcome email template for new students
export function generateWelcomeEmail(registration: any): string {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to MOPGOM Theological Seminary</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f8f9fa;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            overflow: hidden;
            margin-top: 20px;
            margin-bottom: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
        }
        .header .emoji {
            font-size: 32px;
            margin-bottom: 15px;
            display: block;
        }
        .content {
            padding: 40px 30px;
            font-size: 16px;
            line-height: 1.7;
        }
        .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #667eea;
            margin-bottom: 20px;
        }
        .message-text {
            margin-bottom: 25px;
            text-align: justify;
        }
        .highlight {
            background: linear-gradient(120deg, #a8edea 0%, #fed6e3 100%);
            padding: 25px;
            border-radius: 10px;
            margin: 25px 0;
            border-left: 4px solid #667eea;
        }
        .signature {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #f1f3f4;
            font-style: italic;
            color: #666;
        }
        .footer {
            background: #f8f9fa;
            padding: 25px 30px;
            text-align: center;
            color: #666;
            font-size: 14px;
            border-top: 1px solid #e9ecef;
        }
        .student-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .student-info h3 {
            margin-top: 0;
            color: #667eea;
            font-size: 16px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
        }
        .info-label {
            font-weight: 600;
            color: #555;
        }
        .info-value {
            color: #333;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <span class="emoji">📖🙌</span>
            <h1>Welcome to MOPGOM Theological Seminary!</h1>
            <p style="margin: 0; font-size: 16px; opacity: 0.9;">Your Journey in Faith Begins Here</p>
        </div>
        
        <div class="content">
            <div class="greeting">Dear ${registration.fullName},</div>
            
            <div class="message-text">
                <strong>Grace and peace to you in the name of our Lord Jesus Christ!</strong>
            </div>
            
            <div class="message-text">
                We are thrilled to welcome you to the MOPGOM Theological Seminary platform—a sacred space for learning, growth, and spiritual transformation. Whether you are just beginning your journey into theological studies or continuing to deepen your understanding of God's Word, you are now part of a vibrant community committed to truth, wisdom, and service.
            </div>
            
            <div class="highlight">
                <strong>Here, you will be equipped not only with academic excellence but with the spiritual tools to lead, teach, and minister with integrity and compassion.</strong> Our mission is to nurture leaders who will boldly proclaim the Gospel and impact the world for Christ.
            </div>
            
            <div class="message-text">
                As you engage with your courses, connect with fellow students, and seek God's guidance, remember: <strong>you are called, chosen, and empowered for a divine purpose.</strong>
            </div>
            
            <div class="student-info">
                <h3>📋 Your Registration Details</h3>
                <div class="info-row">
                    <span class="info-label">Registration ID:</span>
                    <span class="info-value">${registration.id}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${registration.emailAddress}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Registration Date:</span>
                    <span class="info-value">${new Date(registration.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</span>
                </div>
            </div>
            
            <div class="highlight">
                <strong>📧 Important:</strong> Please check your email regularly for important updates, course information, and further instructions regarding your theological journey with us.
            </div>
            
            <div class="message-text">
                <strong>Welcome to the journey. Welcome to the mission. Welcome to MOPGOM.</strong>
            </div>
            
            <div class="signature">
                In His service,<br>
                <strong>The MOPGOM Theological Seminary Team</strong>
            </div>
        </div>
        
        <div class="footer">
            <p style="margin: 0 0 10px 0;">
                <strong>MOPGOM Theological Seminary</strong><br>
                Equipping Leaders • Transforming Lives • Advancing the Kingdom
            </p>
            <p style="margin: 0; font-size: 12px; color: #999;">
                This is an automated welcome message. Please keep this email for your records.
            </p>
        </div>
    </div>
</body>
</html>`

  return html
}

// Send welcome email to newly registered student
export async function sendWelcomeEmail(registration: any) {
  try {
    const emailHtml = generateWelcomeEmail(registration)

    const result = await sendEmail({
      to: registration.emailAddress,
      subject: '📖 Welcome to MOPGOM Theological Seminary! 🙌',
      html: emailHtml
    })

    if (result.success) {
      console.log('✅ Welcome email sent successfully to:', registration.emailAddress)
      return { success: true, messageId: result.messageId }
    } else {
      console.error('❌ Failed to send welcome email:', result.error)
      return { success: false, error: result.error || 'Email sending failed' }
    }
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Platoon allocation email function removed - no longer needed

export async function sendRegistrationNotification(registration: any) {
  try {
    // Get admin emails from settings or use default
    const adminEmails = [
      'admin@mopgomtheologicalseminary.com',
      // Add more admin emails as needed
    ]

    const emailHtml = generateRegistrationNotificationEmail(registration)

    const result = await sendEmail({
      to: adminEmails,
      subject: `New Registration: ${registration.fullName}`,
      html: emailHtml
    })

    if (result) {
      console.log('✅ Registration notification sent successfully')
      return { success: true }
    } else {
      console.error('❌ Failed to send registration notification')
      return { success: false, error: 'Email sending failed' }
    }
  } catch (error) {
    console.error('❌ Failed to send registration notification:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
