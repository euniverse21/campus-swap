import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { confirmCode, requestCode } from '../api/verification'
import { useAuth } from '../auth/useAuth'

type Step = 'email' | 'code'

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong. Please try again.'
}

export function VerifyPage() {
  const { signIn } = useAuth()
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
      setInfo(`We sent a 6-digit code to ${email.trim()}. It expires in 10 minutes.`)
    } catch (err) {
      setError(errorMessage(err))
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
      setError(errorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="page page--narrow">
      <div className="form-card">
        <h1>Verify you&apos;re a student</h1>
        <p className="form-card__intro">
          Campus Swap is only for university students. No password — we just email you a code.
        </p>

        {info && <p className="form-info">{info}</p>}
        {error && <p className="form-error">{error}</p>}

        {step === 'email' ? (
          <form onSubmit={handleRequestCode} className="form">
            <label className="form-field">
              <span>University email</span>
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
              {isSubmitting ? 'Sending…' : 'Send code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirm} className="form">
            <label className="form-field">
              <span>6-digit code</span>
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
              <span>Nickname</span>
              <input
                maxLength={50}
                placeholder="e.g. Eulia"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <small>Shown to other students. Required the first time you verify.</small>
            </label>

            <button type="submit" className="btn btn--primary btn--block" disabled={isSubmitting}>
              {isSubmitting ? 'Checking…' : 'Verify'}
            </button>

            <div className="form-links">
              <button type="button" className="link-button" onClick={sendCode} disabled={isSubmitting}>
                Resend code
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
                Use a different email
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}
