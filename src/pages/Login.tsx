import { useState, type FormEvent } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import api from '@/services/api'
import { Loader2, X } from 'lucide-react'

export function LoginPage() {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Forgot password dialog
  const [forgotModalOpen, setForgotModalOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotMessage, setForgotMessage] = useState<string | null>(null)
  const [forgotError, setForgotError] = useState<string | null>(null)

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8F7FB]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#4768E8]" />
          <p className="text-xs text-slate-500">Checking credentials...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/distributors" replace />
  }

  const isValid = email.trim().length > 0 && password.length > 0

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!isValid || isSubmitting) return

    setError(null)
    setIsSubmitting(true)

    try {
      await login({ email: email.trim(), password })
      navigate('/distributors', { replace: true })
    } catch (err: any) {
      if (err?.response?.data?.message) {
        setError(
          Array.isArray(err.response.data.message)
            ? err.response.data.message.join(', ')
            : err.response.data.message
        )
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Invalid email or password. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault()
    if (!forgotEmail.trim()) return

    setForgotLoading(true)
    setForgotError(null)
    setForgotMessage(null)

    try {
      const res = await api.post('/auth/forgot-password', {
        email: forgotEmail.trim(),
      })
      setForgotMessage(
        res.data?.message || 'If that email is registered, a reset code was sent.'
      )
    } catch (err: any) {
      setForgotError(
        err?.response?.data?.message || 'Failed to send reset code. Please try again.'
      )
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#F8F7FB]">
      {/* Left panel — Dark Navy SaaS Hero */}
      <div className="hidden w-1/2 flex-col justify-between bg-[#192342] p-12 lg:flex xl:p-16">
        {/* Brand */}
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#4768E8] text-xl font-bold text-white shadow-md">
            D
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">
              Distributor Admin
            </h1>
            <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              POWER YOUR DISTRIBUTION NETWORK
            </p>
          </div>
        </div>

        {/* Center message */}
        <div className="max-w-lg">
          <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl leading-[1.15]">
            Run your distributor business with clarity.
          </h2>
          <p className="mt-4 text-base text-slate-300 leading-relaxed max-w-md">
            A modern command center for customers, billing, and collections — all in one place.
          </p>
          <div className="mt-6">
            <span className="inline-block rounded-full bg-white px-4 py-1.5 text-xs font-bold tracking-wider text-[#4768E8] shadow-sm uppercase">
              PRODUCTION-READY SAAS
            </span>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} Distributor Admin · Multi-Tenant Dairy SaaS Platform
        </p>
      </div>

      {/* Right panel — Login Form */}
      <div className="flex w-full flex-col items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-md rounded-3xl border border-[#EAE9F2] bg-white p-8 sm:p-10 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          {/* Mobile brand */}
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4768E8] text-lg font-bold text-white">
              D
            </div>
            <div>
              <div className="text-base font-bold text-[#192342]">
                Distributor Admin
              </div>
              <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                POWER YOUR DISTRIBUTION NETWORK
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#192342]">Welcome back</h2>
            <p className="mt-1 text-sm text-[#64748B]">
              Sign in to your distributor workspace.
            </p>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-[#DE3C4B]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-[11px] font-bold tracking-wider text-[#64748B] uppercase"
              >
                EMAIL ADDRESS
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@distributor.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                className="mt-1.5 flex h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#192342] placeholder:text-slate-400 focus:border-[#4768E8] focus:outline-none focus:ring-2 focus:ring-[#4768E8]/20 disabled:opacity-50"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-[11px] font-bold tracking-wider text-[#64748B] uppercase"
              >
                PASSWORD
              </label>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="flex h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 pr-14 text-sm text-[#192342] placeholder:text-slate-400 focus:border-[#4768E8] focus:outline-none focus:ring-2 focus:ring-[#4768E8]/20 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#4768E8] hover:text-[#3754D1]"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-start pt-1">
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email)
                  setForgotModalOpen(true)
                }}
                className="text-xs font-medium text-[#4768E8] hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="mt-2 flex h-11 w-full items-center justify-center rounded-xl bg-[#4768E8] text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#3754D1] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <button
              onClick={() => setForgotModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-[#192342]">Forgot password</h3>
            <p className="mt-1 text-xs text-slate-500">
              Enter your account email to receive a password reset code.
            </p>

            {forgotMessage && (
              <div className="mt-3 rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-800">
                {forgotMessage}
              </div>
            )}
            {forgotError && (
              <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-[#DE3C4B]">
                {forgotError}
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="mt-4 space-y-3">
              <input
                type="email"
                required
                placeholder="Enter your email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm focus:border-[#4768E8] focus:outline-none"
              />
              <button
                type="submit"
                disabled={forgotLoading}
                className="flex h-10 w-full items-center justify-center rounded-xl bg-[#4768E8] text-xs font-semibold text-white hover:bg-[#3754D1]"
              >
                {forgotLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Send Reset Code'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
