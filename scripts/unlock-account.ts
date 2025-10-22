import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function unlockAccount() {
  const emailArg = process.argv[2]
  const ipArg = process.argv[3] // optional

  if (!emailArg) {
    console.error('Usage: npx tsx scripts/unlock-account.ts <email> [ip]')
    process.exit(1)
  }

  const email = String(emailArg).toLowerCase().trim()
  const ip = ipArg ? String(ipArg).trim() : null

  try {
    console.log(`Unlocking account for email: ${email}${ip ? `, IP: ${ip}` : ''}`)

    if (ip) {
      // Reset a specific email+IP lock record
      const existing = await prisma.loginAttempt.findUnique({
        where: { email_ip: { email, ipAddress: ip } }
      })

      if (!existing) {
        console.log('No lock record found for specified email and IP.')
      } else {
        await prisma.loginAttempt.delete({
          where: { email_ip: { email, ipAddress: ip } }
        })
        console.log('Deleted lock record for email+IP.')
      }
    } else {
      // Remove all lock records for this email across IPs
      const deleted = await prisma.loginAttempt.deleteMany({
        where: { email }
      })
      console.log(`Deleted ${deleted.count} lock record(s) for email.`)
    }

    console.log('Account unlock complete. You can try logging in again.')
  } catch (error) {
    console.error('Error unlocking account:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

unlockAccount()