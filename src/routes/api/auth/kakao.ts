import { createFileRoute } from '@tanstack/react-router'
import { getAuthUrl } from '../../../../server/kakao'

export const Route = createFileRoute('/api/auth/kakao')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const reqUrl = new URL(request.url)
        const mode = reqUrl.searchParams.get('mode')

        const state = crypto.randomUUID()
        const url = getAuthUrl(state)

        const setCookies: [string, string][] = [
          [
            'Set-Cookie',
            `oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600`,
          ],
        ]

        if (mode === 'popup') {
          setCookies.push([
            'Set-Cookie',
            `oauth_mode=popup; HttpOnly; SameSite=Lax; Path=/; Max-Age=600`,
          ])
        }

        return new Response(null, {
          status: 302,
          headers: [['Location', url], ...setCookies],
        })
      },
    },
  },
})
