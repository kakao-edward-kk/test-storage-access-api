import { useState } from 'react'
import { useStorageAccessInfo } from './hooks/useStorageAccessInfo'
import './App.css'

const PRESET_URLS = [
  'https://mystore.kakao.com/',
  'https://business.kakao.com/dashboard',
  'https://accounts.kakao.com/login/?continue=https%3A%2F%2Fbusiness.kakao.com%2Fm%2Fmystore',
]

const HISTORY_KEY = 'saa-test:url-history'
const MAX_HISTORY = 10

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveToHistory(url: string): string[] {
  const history = loadHistory().filter((u) => u !== url)
  const next = [url, ...history].slice(0, MAX_HISTORY)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  return next
}

function StatusBadge({ supported }: { supported: boolean }) {
  return (
    <span className={supported ? 'status-supported' : 'status-unsupported'}>
      {supported ? 'supported' : 'unsupported'}
    </span>
  )
}

function App() {
  const [showIframe, setShowIframe] = useState(false)
  const [iframeUrl, setIframeUrl] = useState(PRESET_URLS[1])
  const [urlHistory, setUrlHistory] = useState(loadHistory)
  const info = useStorageAccessInfo()

  const handleOpenIframe = () => {
    if (iframeUrl.trim()) {
      setUrlHistory(saveToHistory(iframeUrl.trim()))
      setShowIframe(true)
    }
  }

  const handleSelectUrl = (url: string) => {
    setIframeUrl(url)
  }

  const handleDeleteHistory = (url: string) => {
    const next = urlHistory.filter((u) => u !== url)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
    setUrlHistory(next)
  }

  const handleClearHistory = () => {
    localStorage.removeItem(HISTORY_KEY)
    setUrlHistory([])
  }

  return (
    <div className="app">
      <h1>Storage Access API Test</h1>

      <div className="diagnostics">
        <div className="diagnostics-row">
          <span>hasStorageAccess()</span>
          <StatusBadge supported={info.hasStorageAccessSupported} />
        </div>
        <div className="diagnostics-row">
          <span>requestStorageAccess()</span>
          <StatusBadge supported={info.requestStorageAccessSupported} />
        </div>
        <div className="diagnostics-row">
          <span>requestStorageAccessFor()</span>
          <StatusBadge supported={info.requestStorageAccessForSupported} />
        </div>
        <div className="diagnostics-row">
          <span>현재 hasStorageAccess() 결과</span>
          <span className="status-value">
            {info.currentHasAccess === null ? 'N/A' : String(info.currentHasAccess)}
          </span>
        </div>
        <div className="diagnostics-ua">
          <span className="ua-label">UserAgent</span>
          <span className="ua-value">{info.userAgent}</span>
        </div>
      </div>

      <button className="btn" onClick={() => document.requestStorageAccess()} style={{marginBottom: '2rem'}}>
        requestStorageAccess
      </button>

      <div className="iframe-controls">
        <input
          className="url-input"
          type="url"
          value={iframeUrl}
          onChange={(e) => setIframeUrl(e.target.value)}
          placeholder="https://example.com"
        />
        <button className="btn" onClick={handleOpenIframe}>
          iframe 띄우기
        </button>
      </div>

      <p className="xfo-notice">
        대상 서버가 <code>X-Frame-Options: SAMEORIGIN</code> 또는{' '}
        <code>frame-ancestors</code> CSP를 설정한 경우 iframe 로드가 차단됩니다.
      </p>

      <div className="url-list">
        <div className="url-list-section">
          <span className="url-list-label">Presets</span>
          {PRESET_URLS.map((url) => (
            <button
              key={url}
              className="url-list-item"
              onClick={() => handleSelectUrl(url)}
            >
              <span className="url-list-item-text">{url}</span>
            </button>
          ))}
        </div>

        {urlHistory.length > 0 && (
          <div className="url-list-section">
            <div className="url-list-header">
              <span className="url-list-label">History</span>
              <button className="url-list-clear" onClick={handleClearHistory}>
                clear history
              </button>
            </div>
            {urlHistory.map((url) => (
              <button
                key={url}
                className="url-list-item"
                onClick={() => handleSelectUrl(url)}
              >
                <span className="url-list-item-text">{url}</span>
                <span
                  className="url-list-item-delete"
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteHistory(url)
                  }}
                >
                  &times;
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {showIframe && (
        <div className="overlay">
          <div className="overlay-header">
            <span className="overlay-url">{iframeUrl}</span>
            <button className="close-btn" onClick={() => setShowIframe(false)}>
              &times;
            </button>
          </div>
          <iframe
            className="overlay-iframe"
            src={iframeUrl}
            allow="storage-access"
          />
        </div>
      )}
    </div>
  )
}

export default App
