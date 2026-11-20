import type { ExchangeType, ItemCategory } from '../api/types'
import type { MessageKey } from '../i18n/en'
import type { Translate } from '../i18n/LanguageContext'

// One emoji per kind of exchange: used on cards without photos and in the type picker
export const EXCHANGE_ICONS: Record<ExchangeType, string> = {
  Item: '📦',
  Skill: '🎓',
  Service: '🤝',
  Experience: '🌏',
}

// Services and experiences are "allowed with conditions": these rules are shown before posting
export const EXCHANGE_RULES: Record<ExchangeType, MessageKey[]> = {
  Item: ['guidelines.rule.items'],
  Skill: ['guidelines.rule.skills', 'guidelines.rule.academic'],
  Service: ['guidelines.rule.services', 'guidelines.rule.academic'],
  Experience: ['guidelines.rule.companionship', 'guidelines.rule.activities', 'guidelines.rule.photography'],
}

export function isConditional(type: ExchangeType): boolean {
  return type === 'Service' || type === 'Experience'
}

// The small label on cards: the category for physical items, otherwise the kind of exchange
export function exchangeLabel(
  t: Translate,
  item: { type: ExchangeType; category: ItemCategory | null },
): string {
  return item.type === 'Item' && item.category ? t(`category.${item.category}`) : t(`exchangeType.${item.type}`)
}
