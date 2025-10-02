import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import { NotificationService } from '@/lib/notifications'

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify token
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Determine user type from token
    const userType = payload.type || 'admin'

    let currentUser
    if (userType === 'admin') {
      currentUser = await prisma.admin.findUnique({
        where: { id: payload.adminId },
        include: { role: true }
      })
    } else {
      currentUser = await prisma.user.findUnique({
        where: { id: payload.adminId },
        include: { role: true }
      })
    }

    if (!currentUser || !currentUser.isActive) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 })
    }

    // Check permissions - only Super Admin, Admin, and Manager can send bulk emails
    const allowedRoles = ['Super Admin', 'School Administrator', 'Admin', 'Lecturer', 'Manager']

    if (!allowedRoles.includes(currentUser.role?.name || '')) {
      return NextResponse.json({
        error: 'Insufficient permissions',
        message: 'Only Super Admins, Admins, and Managers can send bulk emails',
        userRole: currentUser.role?.name,
        allowedRoles
      }, { status: 403 })
    }

    const body = await request.json()
    const { recipients, subject, message, includeNames } = body

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({
        error: 'Recipients required',
        message: 'Please provide at least one email recipient'
      }, { status: 400 })
    }

    if (!subject || !message) {
      return NextResponse.json({
        error: 'Subject and message required',
        message: 'Please provide both subject and message for the email'
      }, { status: 400 })
    }

    // Get registration data for personalization if needed
    let registrationData = []
    if (includeNames) {
      registrationData = await prisma.registration.findMany({
        where: {
          emailAddress: {
            in: recipients
          }
        },
        select: {
          id: true,
          emailAddress: true,
          fullName: true,
          dateOfBirth: true,
          gender: true,
          phoneNumber: true,
          createdAt: true
        }
      })
    }

    console.log(`🚀 Preparing to send ${recipients.length} emails in batches...`)

    // Process emails in smaller batches to prevent Gmail rate limiting
    const BATCH_SIZE = 5 // Smaller batches for better reliability
    const BATCH_DELAY = 2000 // 2 seconds between batches
    const results: any[] = []

    console.log(`📧 Processing ${recipients.length} emails in ${Math.ceil(recipients.length / BATCH_SIZE)} batches`)
    console.log(`⏱️ Estimated time: ${Math.ceil(recipients.length / BATCH_SIZE) * (BATCH_DELAY / 1000)} seconds`)

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE)
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1
      const totalBatches = Math.ceil(recipients.length / BATCH_SIZE)

      console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} emails)`)

      const batchPromises = batch.map(async (email) => {
      try {
        let personalizedMessage = message
        let personalizedSubject = subject
        let currentRegistration = null

        if (includeNames) {
          currentRegistration = registrationData.find(r => r.emailAddress === email)
          if (currentRegistration) {
            // Handle registration information template
            if (message.includes('[Registration ID]') || message.includes('[Date of Birth]') || message.includes('[Gender]') || message.includes('[Phone Number]') || message.includes('[Email Address]') || message.includes('[Registration Date]')) {
              personalizedMessage = message
                .replace(/\[Name\]/g, currentRegistration.fullName)
                .replace(/\[Your Name\]/g, currentRegistration.fullName)
                .replace(/\[Registration ID\]/g, currentRegistration.id)
                .replace(/\[Date of Birth\]/g, currentRegistration.dateOfBirth ? new Date(currentRegistration.dateOfBirth).toLocaleDateString() : 'Not provided')
                .replace(/\[Gender\]/g, currentRegistration.gender || 'Not specified')
                .replace(/\[Phone Number\]/g, currentRegistration.phoneNumber || 'Not provided')
                .replace(/\[Email Address\]/g, currentRegistration.emailAddress)
                .replace(/\[Registration Date\]/g, currentRegistration.createdAt ? new Date(currentRegistration.createdAt).toLocaleDateString() : 'Unknown')
            } else {
              // Standard personalization
              personalizedMessage = `Dear ${currentRegistration.fullName},\n\n${message}`
            }
            personalizedSubject = subject.replace(/\[Name\]/g, currentRegistration.fullName)
          }
        }

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${personalizedSubject}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
              body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f8fafc; }
              .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 32px; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
              .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 32px; border-radius: 12px; text-align: center; margin: -32px -32px 32px -32px; }
              .content { padding: 24px 0; }
              .message { white-space: pre-wrap; margin: 24px 0; font-size: 16px; line-height: 1.7; }
              .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; text-align: center; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 24px;">${personalizedSubject}</h1>
              </div>
              <div class="content">
                <div class="message">${personalizedMessage}</div>
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

        // Prepare email options
        const emailOptions: any = {
          to: email,
          subject: personalizedSubject,
          html: emailHtml
        }

        const result = await sendEmail(emailOptions)

        return {
          email,
          success: result,
          messageId: result ? `sent-${Date.now()}` : null
        }

      } catch (error) {
        return {
          email,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
      })

      // Process this batch
      const batchResults = await Promise.allSettled(batchPromises)
      results.push(...batchResults)

      // Add delay between batches to respect Gmail rate limits
      if (i + BATCH_SIZE < recipients.length) {
        console.log(`⏳ Waiting ${BATCH_DELAY / 1000} seconds before next batch...`)
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY))
      }
    }

    console.log(`📧 All batches completed: ${results.length} emails processed`)

    // Process results
    const successfulResults = []
    const errors = []

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          successfulResults.push(result.value)
        } else {
          errors.push({
            email: recipients[index],
            error: result.value.error || 'Email sending failed'
          })
        }
      } else {
        errors.push({
          email: recipients[index],
          error: result.reason?.message || 'Promise rejected'
        })
      }
    })

    console.log(`✅ Bulk email completed: ${successfulResults.length}/${recipients.length} sent successfully`)

    // Detailed error reporting for failed emails
    if (errors.length > 0) {
      console.log(`❌ Failed emails (${errors.length}):`)

      // Group errors by type for better analysis
      const errorTypes = {}
      errors.forEach(error => {
        const errorType = error.error.includes('timeout') ? 'Timeout' :
                         error.error.includes('connection') ? 'Connection' :
                         error.error.includes('authentication') ? 'Authentication' :
                         error.error.includes('rate') ? 'Rate Limit' :
                         error.error.includes('invalid') ? 'Invalid Email' :
                         'Other'

        if (!errorTypes[errorType]) errorTypes[errorType] = []
        errorTypes[errorType].push(error.email)
      })

      Object.entries(errorTypes).forEach(([type, emails]) => {
        console.log(`  ${type}: ${emails.length} emails`)
        emails.slice(0, 3).forEach(email => console.log(`    - ${email}`))
        if (emails.length > 3) console.log(`    ... and ${emails.length - 3} more`)
      })
    }

    // Create notification for bulk email sent
    try {
      await NotificationService.create({
        type: 'bulk_email_sent',
        title: 'Bulk Email Sent',
        message: `Bulk email "${subject}" sent to ${successfulResults.length} recipients`,
        priority: 'medium',
        authorizedBy: currentUser.name || currentUser.email,
        authorizedByEmail: currentUser.email,
        metadata: {
          sender: currentUser.email,
          subject,
          recipientCount: recipients.length,
          successCount: successfulResults.length,
          errorCount: errors.length
        }
      })
    } catch {
      // Don't fail the request if notification creation fails
    }

    return NextResponse.json({
      success: true,
      message: `Bulk email sent successfully`,
      results: {
        total: recipients.length,
        successful: successfulResults.length,
        failed: errors.length,
        details: successfulResults,
        errors: errors.length > 0 ? errors : undefined
      }
    })

  } catch (error) {
    console.error('Bulk email error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to send bulk email',
      message: 'An error occurred while sending the bulk email. Please try again or contact support.',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
