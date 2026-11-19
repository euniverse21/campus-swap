import { Link, useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { useLanguage } from '../i18n/useLanguage'
import { LanguageSelect } from './LanguageSelect'
import './Header.css'

export function Header() {
  const { student, signOut } = useAuth()
  const { t } = useLanguage()
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
          <LanguageSelect />
          <Link to="/guidelines" className="site-header__link">
            {t('nav.guidelines')}
          </Link>
          {student ? (
            <>
              <span className="site-header__hello">{t('nav.hello', { name: student.displayName })}</span>
              <Link to="/my-listings" className="btn btn--ghost">
                {t('nav.myListings')}
              </Link>
              <Link to="/offers" className="btn btn--ghost">
                {t('nav.myOffers')}
              </Link>
              <Link to="/listings/new" className="btn btn--primary">
                {t('nav.listItem')}
              </Link>
              <button type="button" className="btn btn--ghost" onClick={handleSignOut}>
                {t('nav.signOut')}
              </button>
            </>
          ) : (
            <Link to="/verify" className="btn btn--primary">
              {t('nav.verify')}
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
