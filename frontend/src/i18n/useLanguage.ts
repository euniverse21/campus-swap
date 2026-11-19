import { useContext } from 'react'
import { LanguageContext } from './LanguageContext'

export function useLanguage() {
  const language = useContext(LanguageContext)
  if (!language) throw new Error('useLanguage must be used inside <LanguageProvider>')
  return language
}
