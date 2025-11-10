// Program mapping utilities shared across API and UI
// Keeps normalization consistent between admin tabs and student resolution

export type ProgramKey = 'general' | 'diploma' | 'bachelor' | 'master'

// Normalize various free-text inputs into one of our program keys.
// Be permissive: many registrations store partial names (e.g., "Diploma",
// "General Theology", "Undergraduate", etc.). We map common variants.
export function normalizeProgram(input?: string | null): ProgramKey | null {
  if (!input) return null
  const val = input.toLowerCase().trim()
  const tokens = val.split(/[^a-z0-9]+/).filter(Boolean)

  // Synonym sets
  const isGeneral = tokens.includes('general') || val.includes('general certificate') || val.includes('certificate')
  const isDiploma = tokens.includes('diploma') || val.includes('diploma certificate')
  const isBachelor = tokens.includes('bachelor') || tokens.includes("bsc") || val.includes("undergraduate") || val.includes("bachelor's")
  const isMaster = tokens.includes('master') || tokens.includes('masters') || tokens.includes('msc') || tokens.includes('ma') || val.includes('postgraduate')

  if (isMaster) return 'master'
  if (isBachelor) return 'bachelor'
  if (isDiploma) return 'diploma'
  if (isGeneral) return 'general'
  return null
}

export function programLabel(program: ProgramKey | null): string | null {
  if (!program) return null
  switch (program) {
    case 'general':
      return 'General Certificate'
    case 'diploma':
      return 'Diploma Certificate'
    case 'bachelor':
      return "Bachelor's Degree"
    case 'master':
      return "Master's Degree"
  }
}

// Build robust subjectArea filtering aligned with admin UI logic
// Mirrors admin CourseList program filters so students see the same subjects
// as presented under admin tabs (e.g., general-certificate).
export function subjectAreaWhere(program: ProgramKey) {
  switch (program) {
    case 'general':
      // Legacy data may store just "General" or "General Theology" without "Certificate".
      // We include general but exclude diploma/bachelor/master entries.
      return {
        AND: [
          { subjectArea: { contains: 'general' } }
        ],
        NOT: [
          { subjectArea: { contains: 'diploma' } },
          { subjectArea: { contains: 'bachelor' } },
          { subjectArea: { contains: 'master' } }
        ]
      }
    case 'diploma':
      // Accept any subjectArea mentioning "Diploma" (with or without "Certificate")
      return {
        AND: [
          { subjectArea: { contains: 'diploma' } }
        ]
      }
    case 'bachelor':
      // Include common bachelor synonyms
      return {
        OR: [
          { subjectArea: { contains: 'bachelor' } },
          { subjectArea: { contains: 'undergraduate' } },
          { subjectArea: { contains: "b.sc" } },
          { subjectArea: { contains: "bsc" } }
        ]
      }
    case 'master':
      // Include master/masters and common abbreviations
      return {
        OR: [
          { subjectArea: { contains: 'master' } },
          { subjectArea: { contains: 'masters' } },
          { subjectArea: { contains: 'msc' } },
          { subjectArea: { contains: 'ma' } },
          { subjectArea: { contains: 'postgraduate' } }
        ]
      }
  }
}