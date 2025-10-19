import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Always return success to prevent email enumeration attacks
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in SystemConfig keyed by token
    const configKey = `password_reset_token:${resetToken}`;
    await prisma.systemConfig.upsert({
      where: { key: configKey },
      update: {
        value: JSON.stringify({ userId: user.id, expiresAt: resetTokenExpiry.toISOString() }),
        description: 'Password reset token'
      },
      create: {
        key: configKey,
        value: JSON.stringify({ userId: user.id, expiresAt: resetTokenExpiry.toISOString() }),
        description: 'Password reset token'
      }
    });

    // Create reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // Send reset email
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4f46e5; margin-bottom: 10px;">Password Reset Request</h1>
          <p style="color: #6b7280; font-size: 16px;">We received a request to reset your password</p>
        </div>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="color: #374151; margin-bottom: 15px;">
            Hello,
          </p>
          <p style="color: #374151; margin-bottom: 15px;">
            You requested a password reset for your account. Click the button below to reset your password:
          </p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${resetUrl}" 
               style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
              Reset Password
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">
            Or copy and paste this link into your browser:
          </p>
          <p style="color: #4f46e5; font-size: 14px; word-break: break-all;">
            ${resetUrl}
          </p>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">
            <strong>Important:</strong> This link will expire in 1 hour for security reasons.
          </p>
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">
            If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
          </p>
          <p style="color: #6b7280; font-size: 14px;">
            For security questions, please contact support.
          </p>
        </div>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html: emailContent
    });

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}