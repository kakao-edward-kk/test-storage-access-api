import { createFileRoute } from '@tanstack/react-router'
import { getAuthUrl } from '../../../../server/kakao'

export const Route = createFileRoute('/api/auth/kakao')({
  server: {
    handlers: {
      GET: async () => {
        const state = crypto.randomUUID()
        const url = getAuthUrl(state)
        return new Response(null, {
          status: 302,
          headers: [
            ['Location', url],
            [
              'Set-Cookie',
              `oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600`,
            ],
          ],
        })
      },
    },
  },
})
