#!/usr/bin/env tsx

/**
 * Production Database Setup Script
 * Simple and reliable database setup for production deployment
 */

import { execSync } from 'child_process'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'

async function setupProductionDatabase() {
  console.log('🗄️ Setting up production database...')

  try {
    // Step 1: Generate Prisma client
    console.log('🔧 Generating Prisma client...')
    execSync('npx prisma generate', { stdio: 'inherit' })
    console.log('✅ Prisma client generated!')

    // Step 2: Push schema to database (most reliable for production)
    console.log('📋 Pushing database schema...')
    execSync('npx prisma db push', { stdio: 'inherit' })
    console.log('✅ Database schema deployed!')

    // Platoon email history table setup removed - no longer needed

    console.log('🎉 Production database setup completed successfully!')
    return true

  } catch (error) {
    console.error('❌ Production database setup failed:', error)
    
    // Log environment info for debugging
    console.log('🔍 Environment debugging info:')
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set (PostgreSQL)' : 'Not set')
    console.log('NODE_ENV:', process.env.NODE_ENV || 'not set')
    
    return false
  }
}

if (require.main === module) {
  setupProductionDatabase()
    .then((success) => {
      if (success) {
        console.log('✅ Database setup completed successfully!')
        process.exit(0)
      } else {
        console.error('❌ Database setup failed!')
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('❌ Database setup error:', error)
      process.exit(1)
    })
}

export { setupProductionDatabase }
