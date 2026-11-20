import { useId } from 'react'
import { EXCHANGE_TYPES } from '../api/types'
import type { ExchangeType } from '../api/types'
import { useLanguage } from '../i18n/useLanguage'
import { EXCHANGE_ICONS, EXCHANGE_RULES, isConditional } from '../utils/exchangeTypes'

interface ExchangeTypePickerProps {
  label: string
  value: ExchangeType
  onChange: (type: ExchangeType) => void
}

// Four big radio cards (item, skill, service, experience) plus the safety rules for the chosen one
export function ExchangeTypePicker({ label, value, onChange }: ExchangeTypePickerProps) {
  const { t } = useLanguage()
  const groupName = useId() // keeps radio groups separate if two pickers are ever on one page

  return (
    <fieldset className="form-field type-picker">
      <legend>{label}</legend>

      <div className="type-picker__options">
        {EXCHANGE_TYPES.map((type) => (
          <label key={type} className={`type-picker__option ${value === type ? 'is-active' : ''}`}>
            <input
              type="radio"
              name={groupName}
              value={type}
              checked={value === type}
              onChange={() => onChange(type)}
            />
            <span className="type-picker__icon" aria-hidden="true">
              {EXCHANGE_ICONS[type]}
            </span>
            <span className="type-picker__name">{t(`exchangeGroup.${type}`)}</span>
            <span className="type-picker__examples">{t(`exchangeExamples.${type}`)}</span>
          </label>
        ))}
      </div>

      <div className={`type-picker__rules ${isConditional(value) ? 'type-picker__rules--conditional' : ''}`}>
        <strong>
          {t('create.rulesTitle')}
          {isConditional(value) && <span className="type-picker__badge">{t('exchangeStatus.conditional')}</span>}
        </strong>
        <ul>
          {EXCHANGE_RULES[value].map((rule) => (
            <li key={rule}>{t(rule)}</li>
          ))}
        </ul>
      </div>
    </fieldset>
  )
}
