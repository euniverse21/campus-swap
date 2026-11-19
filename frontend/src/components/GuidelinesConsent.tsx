import { useLanguage } from '../i18n/useLanguage'

// Required tick box shown before publishing a listing or sending an offer.
// "required" makes the browser block the form until it is ticked.
export function GuidelinesConsent() {
  const { t, tRich } = useLanguage()

  return (
    <label className="consent">
      <input type="checkbox" required />
      <span>
        {tRich('consent.text', {
          link: (
            <a href="/guidelines" target="_blank" rel="noopener noreferrer">
              {t('consent.link')}
            </a>
          ),
        })}
      </span>
    </label>
  )
}
