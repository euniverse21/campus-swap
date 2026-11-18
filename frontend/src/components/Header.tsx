import { Link, useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth'
import './Header.css'

export function Header() {
  const { student, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/" className="site-header__logo">
          Campus Swap
        </Link>

        <nav className="site-header__nav">
          {student ? (
            <>
              <span className="site-header__hello">Hi, {student.displayName}</span>
              <Link to="/listings/new" className="btn btn--primary">
                List an item
              </Link>
              <button type="button" className="btn btn--ghost" onClick={handleSignOut}>
                Sign out
              </button>
            </>
          ) : (
            <Link to="/verify" className="btn btn--primary">
              Verify student email
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
