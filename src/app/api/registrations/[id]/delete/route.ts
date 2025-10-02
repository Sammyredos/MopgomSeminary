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

    // Use a transaction to handle both deletions safely
    const result = await prisma.$transaction(async (tx) => {
      // Delete the registration first
      const deletedRegistration = await tx.registration.delete({
        where: { id: registrationId }
      })

      // If there's a corresponding user record, try to delete it
      let deletedUser = null
      if (correspondingUser) {
        try {
          // Check if user has any dependencies that would prevent deletion
          const userDependencies = await Promise.all([
            // Check for any other relationships that might prevent deletion
            tx.student.findFirst({ where: { emailAddress: correspondingUser.email } }),
            // Add other dependency checks as needed
          ])

          const hasBlockingDependencies = userDependencies.some(dep => dep !== null)

          if (!hasBlockingDependencies) {
            deletedUser = await tx.user.delete({
              where: { id: correspondingUser.id }
            })
          } else {
            console.log(`User ${correspondingUser.email} has dependencies, skipping deletion`)
          }
        } catch (userDeleteError) {
          console.error('Error deleting user:', userDeleteError)
          // Continue with registration deletion even if user deletion fails
          // This prevents the entire operation from failing
        }
      }

      return { deletedRegistration, deletedUser }
    })

    return NextResponse.json({
      success: true,
      message: `Registration for ${result.deletedRegistration.fullName} has been deleted successfully${result.deletedUser ? ' (including user account)' : ''}`,
      deletedRegistration: {
        id: result.deletedRegistration.id,
        fullName: result.deletedRegistration.fullName,
        emailAddress: result.deletedRegistration.emailAddress
      },
      deletedUser: result.deletedUser ? {
        id: result.deletedUser.id,
        email: result.deletedUser.email,
        name: result.deletedUser.name
      } : null
    })

  } catch (error) {
    console.error('Delete registration error:', error)
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    // Check if it's a Prisma error
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('Prisma error code:', (error as any).code)
      console.error('Prisma error meta:', (error as any).meta)
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to delete registration',
        details: error instanceof Error ? error.message : 'Unknown error',
        code: error && typeof error === 'object' && 'code' in error ? (error as any).code : 'UNKNOWN'
      },
      { status: 500 }
    )
  }
}
