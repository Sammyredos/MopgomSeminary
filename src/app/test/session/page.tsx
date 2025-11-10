'use client'

import { SessionTimeout } from '@/components/SessionTimeout'

export default function SessionTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow p-6 w-full max-w-md">
        <h1 className="text-xl font-apercu-bold text-gray-900 mb-2">Session Timeout Test</h1>
        <p className="text-sm text-gray-600 mb-1">
          This page mounts the session timeout modal without authentication.
        </p>
        <p className="text-sm text-gray-600">
          Use query params to simulate timers: <code className="font-mono">?sessionTest=1&expireSec=90&warnSec=60</code>
        </p>
      </div>

      {/* Mount the SessionTimeout component; dev-only overrides read from URL params */}
      <SessionTimeout sessionTimeoutHours={1} />
    </div>
  )
}