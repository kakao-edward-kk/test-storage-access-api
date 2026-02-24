import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'
import { db } from '../../../../db'
import { sessions, users } from '../../../../db/schema'

export const Route = createFileRoute('/api/auth/session')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const token = url.searchParams.get('token')

        if (!token) {
          return Response.json({ user: null })
        }

        const result = await db
          .select({
            expiresAt: sessions.expiresAt,
            userId: users.id,
            kakaoId: users.kakaoId,
            nickname: users.nickname,
            profileImage: users.profileImage,
          })
          .from(sessions)
          .innerJoin(users, eq(sessions.userId, users.id))
          .where(eq(sessions.id, token))
          .limit(1)

        const row = result[0]
        if (!row || row.expiresAt < new Date()) {
          return Response.json({ user: null })
        }

        return Response.json({
          user: {
            id: row.userId,
            kakaoId: row.kakaoId,
            nickname: row.nickname,
            profileImage: row.profileImage,
          },
        })
      },
    },
  },
})
