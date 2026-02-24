import { Link } from '@tanstack/react-router'

interface NavProps {
  user: { nickname: string | null } | null
}

export function Nav({ user }: NavProps) {
  return (
    <nav
      style={{
        display: 'flex',
        gap: '1rem',
        padding: '0.8rem 1rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        fontSize: '0.9rem',
      }}
    >
      <Link to="/">Home</Link>
      <Link to="/storage-access">Storage Access</Link>
      {user ? (
        <Link to="/profile" style={{ marginLeft: 'auto' }}>
          {user.nickname ?? '프로필'}
        </Link>
      ) : (
        <Link to="/login" style={{ marginLeft: 'auto' }}>
          로그인
        </Link>
      )}
    </nav>
  )
}
