import { createFileRoute } from '@tanstack/react-router'
import { exchangeCode, getUserInfo } from '../../../../server/kakao'
import {
  createSession,
  upsertUser,
  sessionCookie,
  parseCookies,
} from '../../../../server/auth'

export const Route = createFileRoute('/api/auth/kakao/callback')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)

        const error = url.searchParams.get('error')
        if (error) {
          return new Response(null, {
            status: 302,
            headers: {
              Location: `/login?error=${encodeURIComponent(error)}`,
            },
          })
        }

        const code = url.searchParams.get('code')
        const state = url.searchParams.get('state')
        const cookieHeader = request.headers.get('cookie') ?? ''
        const cookies = parseCookies(cookieHeader)
        const expectedState = cookies['oauth_state']

        if (!code || !state || state !== expectedState) {
          return new Response(null, {
            status: 302,
            headers: { Location: '/login?error=invalid_state' },
          })
        }

        const isPopup = cookies['oauth_mode'] === 'popup'

        try {
          const accessToken = await exchangeCode(code)
          const kakaoUser = await getUserInfo(accessToken)

          const userId = await upsertUser({
            kakaoId: kakaoUser.id,
            nickname: kakaoUser.nickname,
            profileImage: kakaoUser.profileImage,
          })

          const sessionId = await createSession(userId)
          const cookie = sessionCookie(sessionId, 7 * 24 * 60 * 60)

          const clearCookies: [string, string][] = [
            ['Set-Cookie', cookie],
            ['Set-Cookie', 'oauth_state=; Max-Age=0; Path=/'],
          ]

          if (isPopup) {
            clearCookies.push([
              'Set-Cookie',
              'oauth_mode=; Max-Age=0; Path=/',
            ])

            // Validate UUID format before inserting into HTML
            const uuidRegex =
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            if (!uuidRegex.test(sessionId)) {
              return new Response(null, {
                status: 302,
                headers: { Location: '/login?error=invalid_session' },
              })
            }

            const html = `<!DOCTYPE html><html><body><script>
if(window.opener){window.opener.postMessage({type:"OAUTH_COMPLETE",token:"${sessionId}"},window.location.origin)}
window.close();
</script></body></html>`

            return new Response(html, {
              status: 200,
              headers: [
                ['Content-Type', 'text/html; charset=utf-8'],
                ...clearCookies,
              ],
            })
          }

          return new Response(null, {
            status: 302,
            headers: [['Location', '/landing'], ...clearCookies],
          })
        } catch {
          return new Response(null, {
            status: 302,
            headers: { Location: '/login?error=oauth_failed' },
          })
        }
      },
    },
  },
})
