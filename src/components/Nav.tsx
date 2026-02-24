import { Link } from '@tanstack/react-router'

export function Nav() {
  return (
    <nav className="nav">
      <Link to="/">Home</Link>
      <Link to="/landing">Landing</Link>
    </nav>
  )
}
