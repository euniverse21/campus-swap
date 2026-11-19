import { createContext } from 'react'
import type { ReactNode } from 'react'
import type { MessageKey } from './en'
import type { Language, Vars } from './languages'

export type Translate = (key: MessageKey, vars?: Vars) => string

export interface LanguageState {
  language: Language
  // For dates and numbers, e.g. "ko-KR"
  locale: string
  setLanguage: (language: Language) => void
  // Plain text
  t: Translate
  // Text with React elements in the placeholders, e.g. a bold name or a link
  tRich: (key: MessageKey, vars: Record<string, ReactNode>) => ReactNode
}

export const LanguageContext = createContext<LanguageState | null>(null)
