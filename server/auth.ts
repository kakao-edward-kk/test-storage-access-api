import { eq } from 'drizzle-orm'
import { db } from '../db'
import { sessions, users } from '../db/schema'
import { getRequestHeader } from '@tanstack/react-start/server'

const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000 // 7 days

function generateId(): string {
  return crypto.randomUUID()
}

export function parseCookies(header: string): Record<string, string> {
  const cookies: Record<string, string> = {}
  for (const pair of header.split(';')) {
    const [key, ...rest] = pair.split('=')
    if (key) cookies[key.trim()] = rest.join('=').trim()
  }
  return cookies
}

export function sessionCookie(
  sessionId: string,
  maxAge: number,
): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `session_id=${sessionId}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`
}

export async function createSession(userId: string): Promise<string> {
  const id = generateId()
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE)

  await db.insert(sessions).values({ id, userId, expiresAt })

  return id
}

interface SessionUser {
  id: string
  kakaoId: string
  nickname: string | null
  profileImage: string | null
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieHeader = getRequestHeader('cookie')
  if (!cookieHeader) return null

  const cookies = parseCookies(cookieHeader)
  const sessionId = cookies['session_id']
  if (!sessionId) return null

  const result = await db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      userId: users.id,
      kakaoId: users.kakaoId,
      nickname: users.nickname,
      profileImage: users.profileImage,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionId))
    .limit(1)

  const row = result[0]
  if (!row) return null

  if (row.expiresAt < new Date()) {
    await db.delete(sessions).where(eq(sessions.id, sessionId))
    return null
  }

  return {
    id: row.userId,
    kakaoId: row.kakaoId,
    nickname: row.nickname,
    profileImage: row.profileImage,
  }
}

export async function destroySession(sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId))
}

export async function upsertUser(data: {
  kakaoId: string
  nickname: string | null
  profileImage: string | null
}): Promise<string> {
  const id = generateId()
  const result = await db
    .insert(users)
    .values({
      id,
      kakaoId: data.kakaoId,
      nickname: data.nickname,
      profileImage: data.profileImage,
    })
    .onConflictDoUpdate({
      target: users.kakaoId,
      set: { nickname: data.nickname, profileImage: data.profileImage },
    })
    .returning({ id: users.id })

  return result[0].id
}
