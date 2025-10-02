const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkRateLimitSettings() {
  try {
    console.log('🔍 Checking current rate limit settings...\n')
    
    // Get rate limit settings from systemConfig
    const rateLimitSettings = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: [
            'rateLimitLoginAttemptsLimit',
            'rateLimitLoginAttemptsWindow',
            'rateLimitEnabled',
            'rateLimitBurstAllowance'
          ]
        }
      }
    })
    
    console.log('📊 Rate Limit Settings:')
    rateLimitSettings.forEach(setting => {
      console.log(`  ${setting.key}: ${setting.value}`)
    })
    
    // Also check security settings for comparison
    console.log('\n🔒 Security Settings for comparison:')
    const securitySettings = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: ['maxLoginAttempts', 'lockoutDuration']
        }
      }
    })
    
    securitySettings.forEach(setting => {
      console.log(`  ${setting.key}: ${setting.value}`)
    })
    
    // Calculate effective rate limit with burst allowance
    const loginLimit = rateLimitSettings.find(s => s.key === 'rateLimitLoginAttemptsLimit')
    const burstAllowance = rateLimitSettings.find(s => s.key === 'rateLimitBurstAllowance')
    
    if (loginLimit && burstAllowance) {
      const effectiveLimit = Math.floor(parseInt(loginLimit.value) * (parseInt(burstAllowance.value) / 100))
      console.log(`\n💡 Effective login rate limit (with ${burstAllowance.value}% burst): ${effectiveLimit} attempts per minute`)
    }
    
  } catch (error) {
    console.error('❌ Error checking rate limit settings:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkRateLimitSettings()