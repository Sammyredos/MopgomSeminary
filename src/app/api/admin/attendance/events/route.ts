/**
 * Real-Time Attendance Events API
 * GET /api/admin/attendance/events
 * Server-Sent Events for real-time attendance updates
 */

import { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/auth-helpers'
import { Logger } from '@/lib/logger'
import { registerConnection, updateHeartbeat, removeConnection, getConnectionsSize } from '@/lib/attendance-events'

const logger = Logger('AttendanceEvents')

// Event types
// Broadcast logic moved to shared lib to avoid route export violations

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return new Response('Unauthorized', { status: 401 })
    }

    const currentUser = authResult.user!

    // Check permissions (include Staff level)
    if (!['Super Admin', 'School Administrator', 'Admin', 'Lecturer', 'Manager', 'Student', 'Staff'].includes(currentUser.role?.name || '')) {
      return new Response('Insufficient permissions', { status: 403 })
    }

    logger.info('New SSE connection established', { 
      userId: currentUser.id,
      role: currentUser.role?.name 
    })

    let streamController: ReadableStreamDefaultController | null = null
    // Create readable stream for SSE
    const stream = new ReadableStream({
      start(controller) {
        streamController = controller
        const now = Date.now()

        // Register connection in shared registry
        registerConnection(controller, currentUser.id)

          logger.info('New SSE connection established', {
            userId: currentUser.id,
            totalConnections: getConnectionsSize()
          })

        // Send initial connection message
        const welcomeEvent = `data: ${JSON.stringify({
          type: 'connected',
          data: {
            message: 'Real-time attendance updates connected',
            timestamp: new Date().toISOString()
          }
        })}\n\n`

        controller.enqueue(new TextEncoder().encode(welcomeEvent))

        // Send heartbeat with configurable interval
        const heartbeatInterval = parseInt(process.env.SSE_HEARTBEAT_INTERVAL || '15000', 10)
        const heartbeat = setInterval(() => {
          try {
            const heartbeatEvent = `data: ${JSON.stringify({
              type: 'heartbeat',
              data: { timestamp: new Date().toISOString() }
            })}\n\n`
            controller.enqueue(new TextEncoder().encode(heartbeatEvent))

            // Update last heartbeat time in shared registry
            updateHeartbeat(controller)
          } catch (error) {
            logger.error('Heartbeat failed, cleaning up connection', error)
            clearInterval(heartbeat)
            removeConnection(controller)
          }
        }, heartbeatInterval)

        // Cleanup on close
        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeat)
          removeConnection(controller)
          controller.close()
          logger.info('SSE connection closed', {
            userId: currentUser.id,
            remainingConnections: getConnectionsSize()
          })
        })
      },

      cancel(reason?: any) {
        if (streamController) {
          removeConnection(streamController)
          try {
            streamController.close()
          } catch {}
        }
        logger.info('SSE connection cancelled', {
          userId: currentUser.id,
          remainingConnections: getConnectionsSize(),
          reason: typeof reason === 'string' ? reason : undefined
        })
      }
    })

    // Enhanced headers for production SSE reliability
    const headers: Record<string, string> = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control, Authorization, Content-Type',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Credentials': 'true',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
      'X-Content-Type-Options': 'nosniff'
    }

    // Add production-specific headers
    if (process.env.NODE_ENV === 'production') {
      headers['X-Robots-Tag'] = 'noindex, nofollow'
      headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    }

    return new Response(stream, { headers })

  } catch (error) {
    logger.error('Error in attendance events endpoint', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
