import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Lookup reset token in SystemConfig
    const configKey = `password_reset_token:${token}`;
    const tokenEntry = await prisma.systemConfig.findUnique({
      where: { key: configKey }
    });

    if (!tokenEntry) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    let tokenData: { userId: string; expiresAt: string };
    try {
      tokenData = JSON.parse(tokenEntry.value);
    } catch {
      return NextResponse.json(
        { error: 'Invalid reset token data' },
        { status: 400 }
      );
    }

    // Validate expiry
    if (new Date(tokenData.expiresAt) <= new Date()) {
      // Clean up expired entry
      await prisma.systemConfig.delete({ where: { key: configKey } }).catch(() => {});
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: tokenData.userId }
    });

    if (!user) {
      // Clean up invalid entry
      await prisma.systemConfig.delete({ where: { key: configKey } }).catch(() => {});
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword
      }
    });

    // Invalidate reset token
    await prisma.systemConfig.delete({ where: { key: configKey } }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}