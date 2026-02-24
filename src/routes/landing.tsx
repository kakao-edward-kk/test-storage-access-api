import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useEffect, useState } from 'react'
import { getSession } from '../../server/auth'

const fetchUser = createServerFn({ method: 'GET' }).handler(async () => {
  return await getSession()
})

export const Route = createFileRoute('/landing')({
  beforeLoad: async () => {
    const user = await fetchUser()
    return { user }
  },
  component: LandingPage,
})

interface SessionUser {
  id: string
  kakaoId: string
  nickname: string | null
  profileImage: string | null
}

function UserProfile({ user }: { user: SessionUser }) {
  return (
    <>
      <form method="POST" action="/api/auth/logout" style={{ marginBottom: 24 }}>
        <button type="submit" className="btn">
          로그아웃
        </button>
      </form>
      <div className="diagnostics">
        {user.profileImage && (
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <img
              src={user.profileImage}
              alt="프로필"
              style={{ width: 80, height: 80, borderRadius: '50%' }}
            />
          </div>
        )}
        <div className="diagnostics-row">
          <span>닉네임</span>
          <span className="status-value">{user.nickname ?? '-'}</span>
        </div>
        <div className="diagnostics-row">
          <span>Kakao ID</span>
          <span className="status-value">{user.kakaoId}</span>
        </div>
      </div>
    </>
  )
}

function LandingPage() {
  const { user } = Route.useRouteContext()

  const [initParams] = useState(() => {
    if (typeof window === 'undefined') return { token: null, origin: null }
    const params = new URLSearchParams(window.location.search)
    return {
      token: params.get('token'),
      origin: params.get('parent_origin'),
    }
  })

  const iframeMode = !!initParams.origin
  const [iframeUser, setIframeUser] = useState<SessionUser | null>(null)
  const [verifying, setVerifying] = useState(
    () => !!initParams.token && !!initParams.origin,
  )

  useEffect(() => {
    const { token, origin } = initParams

    if (token || origin) {
      window.history.replaceState({}, '', window.location.pathname)
    }

    if (token && origin) {
      fetch(`/api/auth/session?token=${encodeURIComponent(token)}`)
        .then((r) => r.json())
        .then((data: { user: SessionUser | null }) => {
          if (data.user) {
            setIframeUser(data.user)
            window.parent.postMessage(
              { type: 'SESSION_TOKEN', token },
              origin,
            )
          }
        })
        .finally(() => setVerifying(false))
    } else if (!token && origin) {
      window.top!.location.href = `${window.location.origin}/api/auth/kakao?parent_origin=${encodeURIComponent(origin)}`
    }
  }, [initParams])

  // Iframe mode: show verification result or loading
  if (iframeMode) {
    if (verifying) {
      return (
        <div className="app">
          <h1>세션 확인 중...</h1>
        </div>
      )
    }

    if (iframeUser) {
      return (
        <div className="app">
          <h1>로그인 완료</h1>
          <UserProfile user={iframeUser} />
        </div>
      )
    }

    // Redirecting to OAuth...
    return (
      <div className="app">
        <h1>로그인으로 이동 중...</h1>
      </div>
    )
  }

  // Normal (non-iframe) mode
  return (
    <div className="app">
      <h1>Kakao Login Test</h1>
      <p className="landing-subtitle">
        카카오 OAuth 로그인 및 세션 동작을 테스트합니다.
      </p>
      {user ? (
        <UserProfile user={user} />
      ) : (
        <a
          href="/api/auth/kakao"
          className="btn"
          style={{ textDecoration: 'none', display: 'inline-block' }}
        >
          카카오 로그인
        </a>
      )}
    </div>
  )
}
