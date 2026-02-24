import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'

const PRESET_URLS = [
  'https://test-storage-access-api.netlify.app/landing',
  'https://test-storage-access-api.vercel.app/landing',
]

function getDefaultChildUrl(): string {
  if (typeof window === 'undefined') return ''
  const { hostname } = window.location
  if (hostname.includes('vercel.app')) {
    return window.location.origin.replace('vercel.app', 'netlify.app') + '/landing'
  }
  if (hostname.includes('netlify.app')) {
    return window.location.origin.replace('netlify.app', 'vercel.app') + '/landing'
  }
  return ''
}

interface SessionUser {
  id: string
  kakaoId: string
  nickname: string | null
  profileImage: string | null
}

export const Route = createFileRoute('/parent')({
  component: ParentPage,
})

function ParentPage() {
  const [childUrl, setChildUrl] = useState(getDefaultChildUrl)
  const [showIframe, setShowIframe] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<SessionUser | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const iframeReadyRef = useRef(false)
  const tokenRef = useRef<string | null>(null)

  const sendTokenToIframe = useCallback(
    (t: string) => {
      const iframe = iframeRef.current
      if (!iframe?.contentWindow || !childUrl) return
      const childOrigin = new URL(childUrl).origin
      iframe.contentWindow.postMessage({ type: 'TOKEN', token: t }, childOrigin)
    },
    [childUrl],
  )

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      const { data } = e

      // OAUTH_COMPLETE from popup (same origin)
      if (data?.type === 'OAUTH_COMPLETE' && e.origin === window.location.origin) {
        const t = data.token as string
        tokenRef.current = t
        setToken(t)
        if (iframeReadyRef.current) {
          sendTokenToIframe(t)
        }
        return
      }

      // Messages from iframe (child origin)
      if (!childUrl) return
      const childOrigin = new URL(childUrl).origin
      if (e.origin !== childOrigin) return

      if (data?.type === 'READY') {
        iframeReadyRef.current = true
        if (tokenRef.current) {
          sendTokenToIframe(tokenRef.current)
        }
      } else if (data?.type === 'ACK') {
        setUser(data.user as SessionUser)
      } else if (data?.type === 'TOKEN_EXPIRED') {
        tokenRef.current = null
        setToken(null)
        setUser(null)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [childUrl, sendTokenToIframe])

  const handleLogin = () => {
    const popup = window.open(
      '/api/auth/kakao?mode=popup',
      'kakao-oauth',
      'width=480,height=700',
    )
    if (!popup) {
      alert('팝업이 차단되었습니다. 팝업 차단을 해제해 주세요.')
    }
  }

  const handleOpenIframe = () => {
    if (childUrl.trim()) {
      iframeReadyRef.current = false
      setUser(null)
      setShowIframe(true)
    }
  }

  const handleClearToken = () => {
    tokenRef.current = null
    setToken(null)
    setUser(null)
  }

  const iframeSrc = childUrl
    ? `${childUrl}${childUrl.includes('?') ? '&' : '?'}parent_origin=${encodeURIComponent(window.location.origin)}`
    : ''

  return (
    <div className="app">
      <h1>Parent (iframe Host)</h1>
      <p className="landing-subtitle">
        Cross-domain iframe에 session token을 전달합니다.
      </p>

      <div className="parent-token-status">
        <span className="url-list-label">Token</span>
        <div className="parent-token-row">
          <code className="parent-token-value">
            {token ? `${token.slice(0, 8)}...` : 'none'}
          </code>
          {token ? (
            <button className="url-list-clear" onClick={handleClearToken}>
              clear
            </button>
          ) : (
            <button className="btn" onClick={handleLogin}>
              카카오 로그인
            </button>
          )}
        </div>
      </div>

      {user && (
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
      )}

      <div className="iframe-controls">
        <input
          className="url-input"
          type="url"
          value={childUrl}
          onChange={(e) => setChildUrl(e.target.value)}
          placeholder="https://child-domain.netlify.app/landing"
        />
        <button className="btn" onClick={handleOpenIframe}>
          iframe 열기
        </button>
      </div>

      <div className="url-list">
        <div className="url-list-section">
          <span className="url-list-label">Presets</span>
          {PRESET_URLS.map((url) => (
            <button
              key={url}
              className="url-list-item"
              onClick={() => setChildUrl(url)}
            >
              <span className="url-list-item-text">{url}</span>
            </button>
          ))}
        </div>
      </div>

      {showIframe && childUrl && (
        <div className="overlay">
          <div className="overlay-header">
            <span className="overlay-url">{iframeSrc}</span>
            <button className="close-btn" onClick={() => setShowIframe(false)}>
              &times;
            </button>
          </div>
          <iframe
            ref={iframeRef}
            className="overlay-iframe"
            src={iframeSrc}
            allow="storage-access"
          />
        </div>
      )}
    </div>
  )
}
