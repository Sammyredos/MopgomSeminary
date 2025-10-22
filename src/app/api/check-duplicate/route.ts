import { NextResponse } from 'next/server'
import { checkForDuplicates } from '@/lib/duplicate-check'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    // Accept both 'phone' and 'phoneNumber' to support existing clients
    const email: string | undefined = body.email
    const phone: string | undefined = body.phone || body.phoneNumber
    const surname: string | undefined = body.surname
    const firstname: string | undefined = body.firstname
    const lastname: string | undefined = body.lastname
    const fullName: string | undefined = body.fullName

    if (!email && !phone && !fullName && !(surname && firstname && lastname)) {
      return NextResponse.json(
        { error: 'At least one of email, phone, or name is required' },
        { status: 400 }
      )
    }

    const result = await checkForDuplicates({ email, phone, surname, firstname, lastname, fullName })

    return NextResponse.json({
      isDuplicate: result.isDuplicate,
      duplicateFields: result.duplicateFields,
      duplicateDetails: result.duplicateDetails,
      hasSimilarNames: result.hasSimilarNames,
      similarRegistrations: result.similarRegistrations
    })
  } catch (error) {
    console.error('Error checking duplicates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}