import { prisma } from './db'

let started = false
function warm() {
  if (started) return
  started = true
  ;(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch {}
  })()
}

warm()

export {}