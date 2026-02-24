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

function IframeMode({ parentOrigin }: { parentOrigin: string }) {
  const [iframeUser, setIframeUser] = useState<SessionUser | null>(null)
  const [status, setStatus] = useState<'waiting' | 'verifying' | 'done' | 'expired'>(
    'waiting',
  )

  useEffect(() => {
    // Clean URL
    window.history.replaceState({}, '', window.location.pathname)

    // Send READY to parent
    window.parent.postMessage({ type: 'READY' }, parentOrigin)

    function handleMessage(e: MessageEvent) {
      if (e.origin !== parentOrigin) return

      if (e.data?.type === 'TOKEN') {
        const token = e.data.token as string
        setStatus('verifying')

        fetch(`/api/auth/session?token=${encodeURIComponent(token)}`)
          .then((r) => r.json())
          .then((data: { user: SessionUser | null }) => {
            if (data.user) {
              setIframeUser(data.user)
              setStatus('done')
              window.parent.postMessage(
                { type: 'ACK', user: data.user },
                parentOrigin,
              )
            } else {
              setStatus('expired')
              window.parent.postMessage({ type: 'TOKEN_EXPIRED' }, parentOrigin)
            }
          })
          .catch(() => {
            setStatus('expired')
            window.parent.postMessage({ type: 'TOKEN_EXPIRED' }, parentOrigin)
          })
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [parentOrigin])

  if (status === 'waiting') {
    return (
      <div className="app">
        <h1>토큰 대기 중...</h1>
        <p className="landing-subtitle">Parent에서 로그인해 주세요.</p>
      </div>
    )
  }

  if (status === 'verifying') {
    return (
      <div className="app">
        <h1>세션 확인 중...</h1>
      </div>
    )
  }

  if (status === 'done' && iframeUser) {
    return (
      <div className="app">
        <h1>로그인 완료</h1>
        <UserProfile user={iframeUser} />
      </div>
    )
  }

  return (
    <div className="app">
      <h1>토큰 만료</h1>
      <p className="landing-subtitle">Parent에서 다시 로그인해 주세요.</p>
    </div>
  )
}

const ALLOWED_PARENT_ORIGINS = new Set([
  'https://test-storage-access-api.netlify.app',
  'https://test-storage-access-api.vercel.app',
])

function LandingPage() {
  const { user } = Route.useRouteContext()

  const [parentOrigin] = useState(() => {
    if (typeof window === 'undefined') return null
    const raw = new URLSearchParams(window.location.search).get('parent_origin')
    if (!raw) return null
    // Allow same-origin (localhost dev) or known origins
    if (raw === window.location.origin) return raw
    if (ALLOWED_PARENT_ORIGINS.has(raw)) return raw
    return null
  })

  if (parentOrigin) {
    return <IframeMode parentOrigin={parentOrigin} />
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
