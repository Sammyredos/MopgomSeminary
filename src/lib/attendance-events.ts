import { Logger } from '@/lib/logger'

export interface AttendanceEvent {
  type: 'verification' | 'status_change' | 'new_scan'
  data: {
    registrationId: string
    fullName: string
    status: 'present' | 'absent' | 'late'
    timestamp: string
    scannerName?: string
    platoonName?: string
    roomName?: string
  }
}

type ConnectionMetadata = {
  userId: string
  createdAt: number
  lastHeartbeat: number
}

const logger = Logger('AttendanceEvents')

// Shared connection registry for SSE clients
const connections = new Map<ReadableStreamDefaultController, ConnectionMetadata>()

// Clean up stale connections every 2 minutes
setInterval(() => {
  const now = Date.now()
  const staleThreshold = 60000 // 1 minute without heartbeat
  const staleConnections: ReadableStreamDefaultController[] = []

  connections.forEach((metadata, controller) => {
    if (now - metadata.lastHeartbeat > staleThreshold) {
      staleConnections.push(controller)
    }
  })

  if (staleConnections.length > 0) {
    logger.info(`Cleaning up ${staleConnections.length} stale connections`)
    staleConnections.forEach(controller => {
      try {
        controller.close()
      } catch (error) {
        // Ignore errors when closing stale connections
      }
      connections.delete(controller)
    })
  }
}, 120000)

export function registerConnection(controller: ReadableStreamDefaultController, userId: string) {
  const now = Date.now()
  connections.set(controller, {
    userId,
    createdAt: now,
    lastHeartbeat: now
  })
}

export function updateHeartbeat(controller: ReadableStreamDefaultController) {
  const meta = connections.get(controller)
  if (meta) {
    meta.lastHeartbeat = Date.now()
  }
}

export function removeConnection(controller: ReadableStreamDefaultController) {
  connections.delete(controller)
}

export function getConnectionsSize() {
  return connections.size
}

export function broadcastAttendanceEvent(event: AttendanceEvent) {
  const eventData = `data: ${JSON.stringify(event)}\n\n`

  logger.info('Broadcasting attendance event', {
    type: event.type,
    registrationId: event.data.registrationId,
    fullName: event.data.fullName,
    connections: connections.size,
    timestamp: event.data.timestamp
  })

  if (connections.size === 0) {
    logger.warn('No active SSE connections to broadcast to')
    return
  }

  let successCount = 0
  let failureCount = 0
  const failedConnections: ReadableStreamDefaultController[] = []

  connections.forEach((metadata, controller) => {
    try {
      controller.enqueue(new TextEncoder().encode(eventData))
      successCount++
      updateHeartbeat(controller)
    } catch (error) {
      logger.error('Failed to send event to client', error)
      failedConnections.push(controller)
      failureCount++
    }
  })

  failedConnections.forEach(controller => {
    connections.delete(controller)
  })

  logger.info('Event broadcast completed', {
    successCount,
    failureCount,
    remainingConnections: connections.size
  })

  if (failureCount > 0) {
    logger.warn(`${failureCount} connections failed during broadcast`)
  }
}