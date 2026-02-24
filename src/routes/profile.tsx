import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getSession } from '../../server/auth'

const getUser = createServerFn({ method: 'GET' }).handler(async () => {
  return await getSession()
})

export const Route = createFileRoute('/profile')({
  beforeLoad: async () => {
    const user = await getUser()
    if (!user) throw redirect({ to: '/login' })
    return { user }
  },
  component: ProfilePage,
})

function ProfilePage() {
  const { user } = Route.useRouteContext()

  return (
    <div className="app">
      <h1>프로필</h1>
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
      <form method="POST" action="/api/auth/logout">
        <button type="submit" className="btn">로그아웃</button>
      </form>
    </div>
  )
}
