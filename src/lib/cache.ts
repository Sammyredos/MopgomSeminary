import Redis from 'ioredis'

type CacheValue = string
type InMemoryEntry = { v: CacheValue; e: number }

const m: Map<string, InMemoryEntry> = new Map()
let r: Redis | null = null

if (process.env.REDIS_URL) {
  try {
    r = new Redis(process.env.REDIS_URL)
  } catch {}
}

function now() {
  return Date.now()
}

export async function getCache(key: string): Promise<CacheValue | null> {
  if (r) {
    try {
      const v = await r.get(key)
      return v ?? null
    } catch {}
  }
  const e = m.get(key)
  if (!e) return null
  if (e.e && e.e < now()) {
    m.delete(key)
    return null
  }
  return e.v
}

export async function setCache(key: string, value: CacheValue, ttlSeconds?: number): Promise<void> {
  if (r) {
    try {
      if (ttlSeconds && ttlSeconds > 0) {
        await r.set(key, value, 'EX', ttlSeconds)
      } else {
        await r.set(key, value)
      }
      return
    } catch {}
  }
  const e = ttlSeconds && ttlSeconds > 0 ? now() + ttlSeconds * 1000 : Number.POSITIVE_INFINITY
  m.set(key, { v: value, e })
}

export async function delCache(key: string): Promise<void> {
  if (r) {
    try {
      await r.del(key)
    } catch {}
  }
  m.delete(key)
}

export async function withCache(key: string, ttlSeconds: number, fn: () => Promise<CacheValue>): Promise<CacheValue> {
  const c = await getCache(key)
  if (c !== null) return c
  const v = await fn()
  await setCache(key, v, ttlSeconds)
  return v
}
