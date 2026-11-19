import { useLanguage } from '../i18n/useLanguage'
import { LANGUAGES } from '../i18n/languages'
import type { Language } from '../i18n/languages'

// Language picker in the header. Each option is written in its own language.
export function LanguageSelect() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <select
      className="language-select"
      value={language}
      aria-label={t('language.label')}
      onChange={(e) => setLanguage(e.target.value as Language)}
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code} lang={l.locale}>
          {l.name}
        </option>
      ))}
    </select>
  )
}
