import { useState } from 'react'
import { useStorageAccessInfo } from './hooks/useStorageAccessInfo'
import './App.css'

// https://mystore.kakao.com
const DEFAULT_URL = 'https://business.kakao.com/dashboard'

function StatusBadge({ supported }: { supported: boolean }) {
  return (
    <span className={supported ? 'status-supported' : 'status-unsupported'}>
      {supported ? 'supported' : 'unsupported'}
    </span>
  )
}

function App() {
  const [showIframe, setShowIframe] = useState(false)
  const [iframeUrl, setIframeUrl] = useState(DEFAULT_URL)
  const info = useStorageAccessInfo()

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

      <div className="iframe-controls">
        <input
          className="url-input"
          type="url"
          value={iframeUrl}
          onChange={(e) => setIframeUrl(e.target.value)}
          placeholder="https://example.com"
        />
        <button className="open-iframe-btn" onClick={() => setShowIframe(true)}>
          iframe 띄우기
        </button>
      </div>

      <p className="xfo-notice">
        대상 서버가 <code>X-Frame-Options: SAMEORIGIN</code> 또는{' '}
        <code>frame-ancestors</code> CSP를 설정한 경우 iframe 로드가 차단됩니다.
      </p>

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
