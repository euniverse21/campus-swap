import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { confirmCode, requestCode } from '../api/verification'
import { useAuth } from '../auth/useAuth'
import { describeError } from '../i18n/describeError'
import { useLanguage } from '../i18n/useLanguage'

type Step = 'email' | 'code'

export function VerifyPage() {
  const { signIn } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Where to go after verifying. Only in-app paths are allowed,
  // so a link like /verify?next=https://evil.com cannot send students elsewhere.
  const next = searchParams.get('next') ?? '/'
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/'

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function sendCode() {
    setError(null)
    setInfo(null)
    setIsSubmitting(true)
    try {
      await requestCode(email.trim())
      setStep('code')
      setInfo(t('verify.codeSent', { email: email.trim() }))
    } catch (err) {
      setError(describeError(err, t))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRequestCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    await sendCode()
  }

  async function handleConfirm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const session = await confirmCode(email.trim(), code.trim(), displayName.trim())
      signIn(session.token, session.student)
      navigate(safeNext, { replace: true })
    } catch (err) {
      setError(describeError(err, t))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="page page--narrow">
      <div className="form-card">
        <h1>{t('verify.title')}</h1>
        <p className="form-card__intro">{t('verify.intro')}</p>

        {info && <p className="form-info">{info}</p>}
        {error && <p className="form-error">{error}</p>}

        {step === 'email' ? (
          <form onSubmit={handleRequestCode} className="form">
            <label className="form-field">
              <span>{t('verify.emailLabel')}</span>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="yourFAN@flinders.edu.au"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <button type="submit" className="btn btn--primary btn--block" disabled={isSubmitting}>
              {isSubmitting ? t('common.sending') : t('verify.sendCode')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirm} className="form">
            <label className="form-field">
              <span>{t('verify.codeLabel')}</span>
              <input
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </label>

            <label className="form-field">
              <span>{t('verify.nicknameLabel')}</span>
              <input
                maxLength={50}
                placeholder={t('verify.nicknamePlaceholder')}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <small>{t('verify.nicknameHint')}</small>
            </label>

            <button type="submit" className="btn btn--primary btn--block" disabled={isSubmitting}>
              {isSubmitting ? t('verify.checking') : t('verify.submit')}
            </button>

            <div className="form-links">
              <button type="button" className="link-button" onClick={sendCode} disabled={isSubmitting}>
                {t('verify.resend')}
              </button>
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setStep('email')
                  setCode('')
                  setError(null)
                  setInfo(null)
                }}
              >
                {t('verify.differentEmail')}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}
