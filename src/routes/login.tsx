import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getSession } from '../../server/auth'

const getUser = createServerFn({ method: 'GET' }).handler(async () => {
  return await getSession()
})

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const user = await getUser()
    if (user) throw redirect({ to: '/' })
  },
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className="app">
      <h1>로그인</h1>
      <a href="/api/auth/kakao" className="btn" style={{ textDecoration: 'none', display: 'inline-block' }}>
        카카오 로그인
      </a>
    </div>
  )
}
