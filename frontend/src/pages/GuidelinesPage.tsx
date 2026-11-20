import { EXCHANGE_TYPES } from '../api/types'
import type { MessageKey } from '../i18n/en'
import { useLanguage } from '../i18n/useLanguage'
import { EXCHANGE_ICONS, isConditional } from '../utils/exchangeTypes'
import './GuidelinesPage.css'

// Things that can never be swapped on Campus Swap (text lives in src/i18n/*.ts)
const PROHIBITED_EXCHANGES: MessageKey[] = [
  'guidelines.prohibited.food',
  'guidelines.prohibited.substances',
  'guidelines.prohibited.weapons',
  'guidelines.prohibited.medication',
  'guidelines.prohibited.sexual',
  'guidelines.prohibited.money',
  'guidelines.prohibited.cheating',
  'guidelines.prohibited.illegal',
  'guidelines.prohibited.professional',
  'guidelines.prohibited.harm',
]

// Extra rules for each kind of exchange
const SAFETY_RULES: { exchange: MessageKey; rule: MessageKey }[] = [
  { exchange: 'guidelines.exchange.items', rule: 'guidelines.rule.items' },
  { exchange: 'guidelines.exchange.skills', rule: 'guidelines.rule.skills' },
  { exchange: 'guidelines.exchange.services', rule: 'guidelines.rule.services' },
  { exchange: 'guidelines.exchange.companionship', rule: 'guidelines.rule.companionship' },
  { exchange: 'guidelines.exchange.activities', rule: 'guidelines.rule.activities' },
  { exchange: 'guidelines.exchange.photography', rule: 'guidelines.rule.photography' },
  { exchange: 'guidelines.exchange.academic', rule: 'guidelines.rule.academic' },
]

export function GuidelinesPage() {
  const { t, tRich } = useLanguage()

  return (
    <main className="page guidelines">
      <header>
        <h1>{t('guidelines.title')}</h1>
        <p className="guidelines__lead">{t('guidelines.lead')}</p>
        <p>{t('guidelines.body')}</p>
      </header>

      <section className="guidelines__section" aria-labelledby="types-heading">
        <h2 id="types-heading">{t('guidelines.typesTitle')}</h2>
        <p>{t('guidelines.typesIntro')}</p>
        <ul className="guidelines__types">
          {EXCHANGE_TYPES.map((type) => (
            <li key={type} className="guidelines__type">
              <span className="guidelines__type-icon" aria-hidden="true">
                {EXCHANGE_ICONS[type]}
              </span>
              <div>
                <strong>{t(`exchangeGroup.${type}`)}</strong>
                <p>{t(`exchangeExamples.${type}`)}</p>
                <span
                  className={`guidelines__status ${isConditional(type) ? 'guidelines__status--conditional' : ''}`}
                >
                  {isConditional(type) ? t('exchangeStatus.conditional') : t('exchangeStatus.allowed')}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="guidelines__section" aria-labelledby="prohibited-heading">
        <h2 id="prohibited-heading">{t('guidelines.prohibitedTitle')}</h2>
        <p>{t('guidelines.prohibitedIntro')}</p>
        <ul className="guidelines__prohibited">
          {PROHIBITED_EXCHANGES.map((item) => (
            <li key={item}>{t(item)}</li>
          ))}
        </ul>
      </section>

      <section className="guidelines__section" aria-labelledby="safety-heading">
        <h2 id="safety-heading">{t('guidelines.safetyTitle')}</h2>
        <p>{t('guidelines.safetyIntro')}</p>
        <dl className="guidelines__rules">
          {SAFETY_RULES.map(({ exchange, rule }) => (
            <div key={exchange} className="guidelines__rule">
              <dt>{t(exchange)}</dt>
              <dd>{t(rule)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="guidelines__section" aria-labelledby="wrong-heading">
        <h2 id="wrong-heading">{t('guidelines.wrongTitle')}</h2>
        <p>
          {tRich('guidelines.wrongBody', {
            myListings: <strong>{t('nav.myListings')}</strong>,
            myOffers: <strong>{t('nav.myOffers')}</strong>,
          })}
        </p>
      </section>

      <p className="guidelines__disclaimer">
        {t('guidelines.disclaimer')}
      </p>
    </main>
  )
}
