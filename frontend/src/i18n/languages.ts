import { en } from './en'
import type { Messages } from './en'
import { ko } from './ko'
import { zh } from './zh'

export type Language = 'en' | 'ko' | 'zh'

// "name" is shown in the language picker, written in that language
export const LANGUAGES: { code: Language; name: string; locale: string }[] = [
  { code: 'en', name: 'English', locale: 'en-AU' },
  { code: 'ko', name: '한국어', locale: 'ko-KR' },
  { code: 'zh', name: '简体中文', locale: 'zh-CN' },
]

export const MESSAGES: Record<Language, Messages> = { en, ko, zh }

const STORAGE_KEY = 'campusSwap.language'

function isLanguage(value: string | null): value is Language {
  return value === 'en' || value === 'ko' || value === 'zh'
}

export function localeOf(language: Language): string {
  return LANGUAGES.find((l) => l.code === language)?.locale ?? 'en-AU'
}

// First visit: follow the browser's language. After that: the student's own choice.
export function detectLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (isLanguage(saved)) return saved
  } catch {
    // Storage can be unavailable (e.g. private mode)
  }

  for (const browserLanguage of navigator.languages ?? [navigator.language]) {
    const code = browserLanguage.toLowerCase()
    if (code.startsWith('ko')) return 'ko'
    if (code.startsWith('zh')) return 'zh'
    if (code.startsWith('en')) return 'en'
  }
  return 'en'
}

export function saveLanguage(language: Language): void {
  try {
    localStorage.setItem(STORAGE_KEY, language)
  } catch {
    // Not saved: the choice still applies until the page is closed
  }
}

export type Vars = Record<string, string | number>

// "Hi, {name}" + { name: 'Eulia' } → "Hi, Eulia"
export function fillPlaceholders(template: string, vars?: Vars): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  )
}
