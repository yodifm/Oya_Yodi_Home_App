import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { TextField } from '../../components/ui/Field'
import { SectionLabel } from '../../components/ui/SectionLabel'
import { ApiError } from '../../lib/api'
import { useAuth } from './useAuth'

export function LoginPage() {
  const { status, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  if (status === 'authenticated') return <Navigate to={from} replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})
    try {
      await login(email.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setErrors({ _form: 'Too many sign-in attempts. Please wait a minute and try again.' })
      } else if (err instanceof ApiError && err.status === 422) {
        const fieldErrors = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v[0]]))
        setErrors(Object.keys(fieldErrors).length ? fieldErrors : { _form: err.message })
      } else {
        setErrors({ _form: 'Cannot reach the server. Make sure the backend is running.' })
      }
      setPassword('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="paper relative grid min-h-dvh place-items-center overflow-hidden bg-background px-4 py-16">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/3 size-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent opacity-[0.05] blur-3xl" />

      <main className="animate-fade-in relative w-full max-w-md">
        <header className="mb-12 text-center">
          <p className="small-caps mb-6 text-accent">Est. Home</p>
          <h1 className="text-[2.75rem] leading-[1.1] tracking-[-0.02em] sm:text-6xl">
            Yodi <span className="italic text-accent">&amp;</span> Oya
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">Our household book.</p>
        </header>

        <Card elevated accentTop className="p-6 sm:p-10">
          <SectionLabel className="mb-8">Sign In</SectionLabel>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
            <TextField
              label="Email"
              type="email"
              autoComplete="username"
              inputMode="email"
              placeholder="name@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              required
              autoFocus
            />
            <TextField
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              required
            />

            {errors._form && (
              <p role="alert" className="rounded-md bg-danger-muted px-4 py-3 text-sm text-danger">
                {errors._form}
              </p>
            )}

            <Button type="submit" disabled={submitting || !email || !password} className="mt-2 w-full">
              {submitting ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
        </Card>

        <p className="mt-10 text-center font-display text-sm italic text-muted-foreground">
          “What is written down can be looked after.”
        </p>
      </main>
    </div>
  )
}
