import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-helpers'
import { z } from 'zod'
import { settingsService } from '@/lib/settings-service'

// Dynamic security settings schema that fetches validation rules from database
const createSecuritySettingsSchema = async () => {
  try {
    // Get current settings to determine validation ranges
    const currentSettings = await settingsService.getSecuritySettings()
    
    return z.object({
      sessionTimeout: z.number().min(1).max(10080).default(currentSettings.sessionTimeout || 60), // 1 minute to 1 week
      maxLoginAttempts: z.number().min(1).max(100).default(currentSettings.maxLoginAttempts || 5), // 1 to 100 attempts
      lockoutDuration: z.number().min(1).max(10080).default(currentSettings.lockoutDuration || 15), // 1 minute to 1 week
      passwordMinLength: z.number().min(1).max(128).default(currentSettings.passwordMinLength || 8), // 1 to 128 characters
      requireStrongPassword: z.boolean().default(currentSettings.requireStrongPassword ?? true),
      twoFactorAuth: z.boolean().default(currentSettings.twoFactorAuth ?? false),
      encryptSensitiveData: z.boolean().default(currentSettings.encryptSensitiveData ?? false),
      enableAuditLog: z.boolean().default(currentSettings.enableAuditLog ?? false),
      anonymizeData: z.boolean().default(currentSettings.anonymizeData ?? false),
      gdprCompliance: z.boolean().default(currentSettings.gdprCompliance ?? false),
      dataRetentionPolicy: z.boolean().default(currentSettings.dataRetentionPolicy ?? false),
      apiRateLimit: z.number().min(1).max(100000).default(currentSettings.apiRateLimit || 100), // 1 to 100k requests
      apiKeyRequired: z.boolean().default(currentSettings.apiKeyRequired ?? true),
      corsEnabled: z.boolean().default(currentSettings.corsEnabled ?? false),
      ipWhitelist: z.string().default(currentSettings.ipWhitelist || '')
    })
  } catch (error) {
    console.error('Failed to create dynamic schema, using fallback:', error)
    // Fallback schema with very permissive ranges
    return z.object({
      sessionTimeout: z.number().min(1).max(10080).default(60),
      maxLoginAttempts: z.number().min(1).max(100).default(5),
      lockoutDuration: z.number().min(1).max(10080).default(15),
      passwordMinLength: z.number().min(1).max(128).default(8),
      requireStrongPassword: z.boolean().default(true),
      twoFactorAuth: z.boolean().default(false),
      encryptSensitiveData: z.boolean().default(false),
      enableAuditLog: z.boolean().default(false),
      anonymizeData: z.boolean().default(false),
      gdprCompliance: z.boolean().default(false),
      dataRetentionPolicy: z.boolean().default(false),
      apiRateLimit: z.number().min(1).max(100000).default(100),
      apiKeyRequired: z.boolean().default(true),
      corsEnabled: z.boolean().default(false),
      ipWhitelist: z.string().default('')
    })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 })
    }

    // Get security settings from database
    const securitySettings = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: [
            'sessionTimeout', 'maxLoginAttempts', 'lockoutDuration', 'passwordMinLength',
            'requireStrongPassword', 'twoFactorAuth', 'encryptSensitiveData', 'enableAuditLog',
            'anonymizeData', 'gdprCompliance', 'dataRetentionPolicy', 'apiRateLimit',
            'apiKeyRequired', 'corsEnabled', 'ipWhitelist'
          ]
        }
      }
    })

    // Convert to object format
    const settings: Record<string, any> = {}
    securitySettings.forEach(setting => {
      let value: any = setting.value

      // Convert string booleans to actual booleans FIRST (before number conversion)
      if (value === 'true') {
        value = true
      } else if (value === 'false') {
        value = false
      } else if (!isNaN(Number(value)) && value !== '' && value !== 'true' && value !== 'false') {
        // Only convert to number if it's not a boolean string
        value = Number(value)
      }

      settings[setting.key] = value
    })

    return NextResponse.json({
      success: true,
      settings
    })

  } catch (error) {
    console.error('Security settings GET error:', error)
    return NextResponse.json({
      error: 'Failed to fetch security settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Security API POST request received')
    
    // Authenticate user
    const authResult = await authenticateRequest(request)
    if (!authResult.success || !authResult.user) {
      console.log('❌ Authentication failed:', authResult.error)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('👤 Authenticated user:', {
      email: authResult.user.email,
      role: authResult.user.role?.name
    })

    // Check if user has permission (Super Admin or Admin)
const allowedRoles = ['Super Admin', 'Admin']
if (!allowedRoles.includes(authResult.user.role?.name || '')) {
  console.log('❌ Permission denied - insufficient role for security settings')
  return NextResponse.json({
    error: 'Only Super Admin or Admin can modify security settings'
  }, { status: 403 })
}

    const body = await request.json()
    console.log('📥 Request body received:', body)
    
    // Create dynamic schema and validate the request body
    console.log('🔍 Creating dynamic schema and validating settings...')
    const securitySettingsSchema = await createSecuritySettingsSchema()
    const validatedSettings = securitySettingsSchema.parse(body)
    console.log('✅ Settings validation passed:', validatedSettings)

    // Save each setting to database
    const updatePromises = Object.entries(validatedSettings).map(([key, value]) =>
      prisma.systemConfig.upsert({
        where: { key },
        update: { 
          value: String(value),
          updatedAt: new Date()
        },
        create: {
          key,
          value: String(value),
          description: getSettingDescription(key)
        }
      })
    )

    await Promise.all(updatePromises)

    return NextResponse.json({
      success: true,
      message: 'Security settings updated successfully',
      settings: validatedSettings
    })

  } catch (error) {
    console.error('❌ Security settings POST error:', error)
    
    if (error instanceof z.ZodError) {
      console.error('🚫 Validation errors:', error.errors)
      return NextResponse.json({
        error: 'Invalid security settings',
        details: error.errors
      }, { status: 400 })
    }

    console.error('💥 Unexpected error:', error)
    return NextResponse.json({
      error: 'Failed to update security settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function getSettingDescription(key: string): string {
  const descriptions: Record<string, string> = {
    sessionTimeout: 'Minutes before auto-logout',
    maxLoginAttempts: 'Failed attempts before lockout',
    lockoutDuration: 'Minutes to lock account after failed attempts',
    passwordMinLength: 'Minimum characters required',
    requireStrongPassword: 'Enforce uppercase, lowercase, numbers, symbols',
    twoFactorAuth: 'Enable 2FA for admin accounts',
    encryptSensitiveData: 'Encrypt personal information in database',
    enableAuditLog: 'Log all admin actions for security auditing',
    anonymizeData: 'Anonymize data for analytics and reporting',
    gdprCompliance: 'Enable GDPR compliance features',
    dataRetentionPolicy: 'Automatically delete old data based on policy',
    apiRateLimit: 'Requests per minute per IP',
    apiKeyRequired: 'Require API keys for external access',
    corsEnabled: 'Allow cross-origin requests',
    ipWhitelist: 'Comma-separated list of allowed IPs'
  }
  return descriptions[key] || 'Security setting'
}
