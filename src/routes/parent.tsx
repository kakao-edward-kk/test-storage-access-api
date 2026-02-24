import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

const TOKEN_KEY = 'parent:session-token'

const PRESET_URLS = [
  'https://test-storage-access-api.netlify.app/landing',
  'https://test-storage-access-api.vercel.app/landing',
]

function getDefaultChildOrigin(): string {
  if (typeof window === 'undefined') return ''
  const { hostname } = window.location
  if (hostname.includes('vercel.app')) {
    return window.location.origin.replace('vercel.app', 'netlify.app')
  }
  if (hostname.includes('netlify.app')) {
    return window.location.origin.replace('netlify.app', 'vercel.app')
  }
  return ''
}

export const Route = createFileRoute('/parent')({
  component: ParentPage,
})

function ParentPage() {
  const [initUrlToken] = useState(() => {
    if (typeof window === 'undefined') return null
    return new URLSearchParams(window.location.search).get('token')
  })

  const [childOrigin, setChildOrigin] = useState(getDefaultChildOrigin)
  const [showIframe, setShowIframe] = useState(!!initUrlToken)
  const [token, setToken] = useState<string | null>(() => {
    if (initUrlToken) return initUrlToken
    if (typeof window === 'undefined') return null
    return localStorage.getItem(TOKEN_KEY)
  })
  const [autoOpened] = useState(!!initUrlToken)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (initUrlToken) {
      localStorage.setItem(TOKEN_KEY, initUrlToken)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [initUrlToken])

  // Listen for postMessage from iframe
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (!childOrigin) return
      if (e.origin !== childOrigin) return
      if (e.data?.type === 'SESSION_TOKEN' && e.data.token) {
        localStorage.setItem(TOKEN_KEY, e.data.token)
        setToken(e.data.token)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [childOrigin])

  const handleOpenIframe = () => {
    if (childOrigin.trim()) {
      setShowIframe(true)
    }
  }

  const handleClearToken = () => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
  }

  const iframeSrc = childOrigin
    ? `${childOrigin}/landing?token=${token ?? ''}&parent_origin=${encodeURIComponent(window.location.origin)}`
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
          {token && (
            <button className="url-list-clear" onClick={handleClearToken}>
              clear
            </button>
          )}
        </div>
      </div>

      <div className="iframe-controls">
        <input
          className="url-input"
          type="url"
          value={childOrigin}
          onChange={(e) => setChildOrigin(e.target.value)}
          placeholder="https://child-domain.netlify.app"
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
              onClick={() => setChildOrigin(url)}
            >
              <span className="url-list-item-text">{url}</span>
            </button>
          ))}
        </div>
      </div>

      {autoOpened && (
        <p className="xfo-notice">
          OAuth 완료 후 자동으로 iframe을 다시 열었습니다.
        </p>
      )}

      {showIframe && childOrigin && (
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
