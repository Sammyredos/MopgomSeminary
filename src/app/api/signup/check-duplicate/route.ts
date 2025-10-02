import { NextRequest, NextResponse } from 'next/server'
import { checkForDuplicates } from '@/lib/duplicate-check'

export async function POST(request: NextRequest) {
  try {
    const { surname, firstname, lastname, email, phone } = await request.json()

    if (!email && !phone && !firstname && !lastname && !surname) {
      return NextResponse.json(
        { error: 'At least one field is required for duplicate checking' },
        { status: 400 }
      )
    }

    // Use the unified duplicate check function
    const result = await checkForDuplicates({
      email,
      phone,
      surname,
      firstname,
      lastname
    })

    // Map similar names to the expected format for backward compatibility
    if (result.hasSimilarNames && !result.duplicateFields.includes('name')) {
      result.duplicateFields.push('similar_name')
      result.duplicateDetails.similar_name = result.similarRegistrations?.[0]
    }

    return NextResponse.json({
      isDuplicate: result.isDuplicate,
      duplicateFields: result.duplicateFields,
      duplicateDetails: result.duplicateDetails,
      hasSimilarNames: result.hasSimilarNames,
      similarRegistrations: result.similarRegistrations,
      message: result.isDuplicate 
        ? `Duplicate found in: ${result.duplicateFields.join(', ')}`
        : 'No duplicates found'
    })

  } catch (error) {
    console.error('Duplicate check error:', error)
    return NextResponse.json(
      { error: 'Failed to check for duplicates' },
      { status: 500 }
    )
  }
}