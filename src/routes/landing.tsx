import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/landing')({
  component: LandingPage,
})

function LandingPage() {
  const { user } = Route.useRouteContext()

  return (
    <div className="app">
      <h1>Kakao Login Test</h1>
      <p className="landing-subtitle">
        카카오 OAuth 로그인 및 세션 동작을 테스트합니다.
      </p>
      <a
        href="/api/auth/kakao"
        className="btn"
        style={{ textDecoration: 'none', display: 'inline-block' }}
      >
        카카오 로그인
      </a>
      {user && (
        <Link to="/profile" className="landing-profile-link">
          프로필 보기
        </Link>
      )}
    </div>
  )
}
