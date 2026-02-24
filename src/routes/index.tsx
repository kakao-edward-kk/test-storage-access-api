import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div className="app">
      <h1>Storage Access API Test</h1>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 300, width: '100%' }}>
        <Link to="/storage-access" className="btn" style={{ textAlign: 'center' }}>
          Storage Access 진단
        </Link>
        <Link to="/login" className="btn" style={{ textAlign: 'center' }}>
          카카오 로그인
        </Link>
      </nav>
    </div>
  )
}
