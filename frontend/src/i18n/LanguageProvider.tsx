import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { en } from './en'
import type { MessageKey } from './en'
import { LanguageContext } from './LanguageContext'
import { MESSAGES, detectLanguage, fillPlaceholders, localeOf, saveLanguage } from './languages'
import type { Language, Vars } from './languages'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectLanguage)
  const locale = localeOf(language)

  // Tell the browser (and screen readers) which language the page is in
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLanguage = useCallback((next: Language) => {
    saveLanguage(next)
    setLanguageState(next)
  }, [])

  const t = useCallback(
    (key: MessageKey, vars?: Vars) => fillPlaceholders(MESSAGES[language][key] ?? en[key], vars),
    [language],
  )

  // Splits "listed by {name}" around the placeholder so {name} can be any React element.
  // Each language can put the placeholder wherever its word order needs it.
  const tRich = useCallback(
    (key: MessageKey, vars: Record<string, ReactNode>) => {
      const template = MESSAGES[language][key] ?? en[key]
      return template.split(/(\{\w+\})/g).map((part, index) => {
        const name = /^\{(\w+)\}$/.exec(part)?.[1]
        return name !== undefined && name in vars ? <Fragment key={index}>{vars[name]}</Fragment> : part
      })
    },
    [language],
  )

  const value = useMemo(
    () => ({ language, locale, setLanguage, t, tRich }),
    [language, locale, setLanguage, t, tRich],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
