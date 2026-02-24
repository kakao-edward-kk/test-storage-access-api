import { createFileRoute } from '@tanstack/react-router'
import {
  destroySession,
  sessionCookie,
  parseCookies,
} from '../../../../server/auth'

export const Route = createFileRoute('/api/auth/logout')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const origin = request.headers.get('origin')
        const expected = new URL(request.url).origin
        if (origin && origin !== expected) {
          return new Response('Forbidden', { status: 403 })
        }

        const cookieHeader = request.headers.get('cookie') ?? ''
        const cookies = parseCookies(cookieHeader)
        const sessionId = cookies['session_id']
        if (sessionId) {
          await destroySession(sessionId)
        }

        const expiredCookie = sessionCookie('', 0)

        return new Response(null, {
          status: 302,
          headers: {
            Location: '/',
            'Set-Cookie': expiredCookie,
          },
        })
      },
    },
  },
})
