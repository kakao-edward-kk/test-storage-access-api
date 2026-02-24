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

        const parentOrigin = cookies['oauth_parent_origin']

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

          if (parentOrigin) {
            clearCookies.push([
              'Set-Cookie',
              'oauth_parent_origin=; Max-Age=0; Path=/',
            ])
            return new Response(null, {
              status: 302,
              headers: [
                ['Location', `${parentOrigin}/parent?token=${sessionId}`],
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
