import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: registrationId } = await params

    if (!registrationId) {
      return NextResponse.json(
        { error: 'Registration ID is required' },
        { status: 400 }
      )
    }

    // Check if registration exists
    const existingRegistration = await prisma.registration.findUnique({
      where: { id: registrationId },
      select: {
        id: true,
        fullName: true,
        emailAddress: true
      }
    })

    if (!existingRegistration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      )
    }

    // Also check if there's a corresponding user record with the same email
    const correspondingUser = await prisma.user.findFirst({
      where: { email: existingRegistration.emailAddress },
      select: { id: true, email: true, name: true }
    })

    // Delete the registration first
    await prisma.registration.delete({
      where: { id: registrationId }
    })

    // If there's a corresponding user record, delete it too to prevent future conflicts
    let deletedUser = null
    if (correspondingUser) {
      deletedUser = await prisma.user.delete({
        where: { id: correspondingUser.id }
      })
    }

    return NextResponse.json({
      success: true,
      message: `Registration for ${existingRegistration.fullName} has been deleted successfully${correspondingUser ? ' (including user account)' : ''}`,
      deletedRegistration: {
        id: existingRegistration.id,
        fullName: existingRegistration.fullName,
        emailAddress: existingRegistration.emailAddress
      },
      deletedUser: deletedUser ? {
        id: deletedUser.id,
        email: deletedUser.email,
        name: deletedUser.name
      } : null
    })

  } catch (error) {
    console.error('Delete registration error:', error)
    return NextResponse.json(
      { error: 'Failed to delete registration' },
      { status: 500 }
    )
  }
}
