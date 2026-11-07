import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import api from '@/services/api'
import {
  Loader2,
  X,
  CheckCircle2,
  ArrowLeft,
  KeyRound,
  Mail,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react'

export function LoginPage() {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Forgot password flow states
  const [forgotModalOpen, setForgotModalOpen] = useState(false)
  const [forgotStep, setForgotStep] = useState<'email' | 'reset' | 'success'>('email')
  const [forgotEmail, setForgotEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotMessage, setForgotMessage] = useState<string | null>(null)
  const [forgotError, setForgotError] = useState<string | null>(null)
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)

  // Countdown timer for Resend OTP
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

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

  const openForgotPassword = () => {
    setForgotEmail(email.trim())
    setOtpCode('')
    setNewPassword('')
    setConfirmPassword('')
    setForgotStep('email')
    setForgotError(null)
    setForgotMessage(null)
    setDevOtpHint(null)
    setCountdown(0)
    setForgotModalOpen(true)
  }

  const closeForgotPassword = () => {
    setForgotModalOpen(false)
    setForgotStep('email')
    setForgotError(null)
    setForgotMessage(null)
  }

  const handleSendOtp = async (e?: FormEvent) => {
    if (e) e.preventDefault()
    const targetEmail = forgotEmail.trim()
    if (!targetEmail) {
      setForgotError('Please enter your email address.')
      return
    }

    setForgotLoading(true)
    setForgotError(null)
    setForgotMessage(null)

    try {
      const res = await api.post('/auth/forgot-password', {
        email: targetEmail,
      })
      if (res.data?.devOtp) {
        setDevOtpHint(res.data.devOtp)
        setOtpCode(res.data.devOtp)
      }
      setForgotMessage(
        res.data?.message || 'If that email is registered, a 6-digit reset code was sent.'
      )
      setForgotStep('reset')
      setCountdown(60)
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        (Array.isArray(err?.response?.data?.message)
          ? err.response.data.message.join(', ')
          : 'Failed to send reset code. Please check your network and try again.')
      setForgotError(msg)
    } finally {
      setForgotLoading(false)
    }
  }

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault()
    setForgotError(null)
    setForgotMessage(null)

    const code = otpCode.trim()
    if (code.length !== 6) {
      setForgotError('Please enter the complete 6-digit verification code.')
      return
    }

    if (newPassword.length < 6) {
      setForgotError('Password must be at least 6 characters.')
      return
    }

    const hasNumberAndSpecial = /^(?=.*\d)(?=.*[^A-Za-z0-9]).+$/.test(newPassword)
    if (!hasNumberAndSpecial) {
      setForgotError(
        'Password must contain at least one number and one special character (e.g. Pass@123).'
      )
      return
    }

    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match. Please re-enter.')
      return
    }

    setForgotLoading(true)

    try {
      const res = await api.post('/auth/reset-password', {
        email: forgotEmail.trim(),
        code,
        newPassword,
      })
      setForgotMessage(res.data?.message || 'Password reset successfully!')
      setForgotStep('success')
      setEmail(forgotEmail.trim())
      setPassword(newPassword)
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        (Array.isArray(err?.response?.data?.message)
          ? err.response.data.message.join(', ')
          : 'Failed to reset password. Please check the OTP and try again.')
      setForgotError(msg)
    } finally {
      setForgotLoading(false)
    }
  }

  const handleLoginAfterReset = async () => {
    setForgotModalOpen(false)
    setIsSubmitting(true)
    setError(null)

    try {
      await login({ email: forgotEmail.trim(), password: newPassword })
      navigate('/distributors', { replace: true })
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Password was reset, but auto-login encountered an issue. Please click Sign In.'
      )
    } finally {
      setIsSubmitting(false)
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-start pt-1">
              <button
                type="button"
                onClick={openForgotPassword}
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

      {/* Multi-Step Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl transition-all">
            <button
              type="button"
              onClick={closeForgotPassword}
              className="absolute right-5 top-5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Step 1: Request OTP */}
            {forgotStep === 'email' && (
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#4768E8]/10 text-[#4768E8]">
                  <Mail className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-[#192342]">Forgot password</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Enter your registered email address and we'll send a 6-digit verification OTP to reset your password.
                </p>

                {forgotError && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-[#DE3C4B]">
                    {forgotError}
                  </div>
                )}

                <form onSubmit={handleSendOtp} className="mt-5 space-y-4">
                  <div>
                    <label
                      htmlFor="forgotEmail"
                      className="block text-[11px] font-bold tracking-wider text-[#64748B] uppercase"
                    >
                      ACCOUNT EMAIL
                    </label>
                    <input
                      id="forgotEmail"
                      type="email"
                      required
                      placeholder="admin@distributor.in"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      disabled={forgotLoading}
                      className="mt-1.5 h-11 w-full rounded-xl border border-[#E2E8F0] px-3.5 text-sm text-[#192342] placeholder:text-slate-400 focus:border-[#4768E8] focus:outline-none focus:ring-2 focus:ring-[#4768E8]/20 disabled:opacity-50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading || !forgotEmail.trim()}
                    className="flex h-11 w-full items-center justify-center rounded-xl bg-[#4768E8] text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#3754D1] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {forgotLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending OTP Code...
                      </>
                    ) : (
                      'Send OTP Code'
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Step 2: Enter OTP & Create New Password */}
            {forgotStep === 'reset' && (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setForgotStep('email')
                    setForgotError(null)
                    setForgotMessage(null)
                  }}
                  className="inline-flex items-center text-xs font-semibold text-[#64748B] hover:text-[#4768E8] transition-colors"
                >
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                  Change email
                </button>

                <div className="mt-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#4768E8]/10 text-[#4768E8]">
                  <KeyRound className="h-5 w-5" />
                </div>

                <h3 className="mt-3 text-xl font-bold text-[#192342]">Verify OTP & New Password</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Enter the 6-digit code sent to <strong className="text-[#192342]">{forgotEmail}</strong> and your new password.
                </p>

                {forgotMessage && (
                  <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">
                    {forgotMessage}
                  </div>
                )}

                {forgotError && (
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-[#DE3C4B]">
                    {forgotError}
                  </div>
                )}

                {devOtpHint && (
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-900">
                    <span>
                      Dev OTP: <strong className="font-mono text-sm tracking-wider">{devOtpHint}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setOtpCode(devOtpHint)}
                      className="rounded-md bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-950 hover:bg-amber-300 transition-colors"
                    >
                      Fill OTP
                    </button>
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="mt-4 space-y-3.5">
                  <div>
                    <label
                      htmlFor="otpCode"
                      className="block text-[11px] font-bold tracking-wider text-[#64748B] uppercase"
                    >
                      6-DIGIT OTP CODE
                    </label>
                    <input
                      id="otpCode"
                      type="text"
                      maxLength={6}
                      required
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      disabled={forgotLoading}
                      className="mt-1 h-11 w-full rounded-xl border border-[#E2E8F0] px-3.5 text-center font-mono text-lg font-bold tracking-widest text-[#192342] placeholder:text-slate-300 focus:border-[#4768E8] focus:outline-none focus:ring-2 focus:ring-[#4768E8]/20 disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="newPassword"
                      className="block text-[11px] font-bold tracking-wider text-[#64748B] uppercase"
                    >
                      NEW PASSWORD
                    </label>
                    <div className="relative mt-1">
                      <input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={forgotLoading}
                        className="flex h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 pr-14 text-sm text-[#192342] placeholder:text-slate-400 focus:border-[#4768E8] focus:outline-none focus:ring-2 focus:ring-[#4768E8]/20 disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        title={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Must have min 6 chars, 1 number & 1 special symbol (e.g. Pass@123).
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-[11px] font-bold tracking-wider text-[#64748B] uppercase"
                    >
                      CONFIRM NEW PASSWORD
                    </label>
                    <input
                      id="confirmPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={forgotLoading}
                      className="mt-1 flex h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#192342] placeholder:text-slate-400 focus:border-[#4768E8] focus:outline-none focus:ring-2 focus:ring-[#4768E8]/20 disabled:opacity-50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={
                      forgotLoading ||
                      otpCode.trim().length !== 6 ||
                      newPassword.length < 6 ||
                      confirmPassword.length < 6
                    }
                    className="mt-2 flex h-11 w-full items-center justify-center rounded-xl bg-[#4768E8] text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#3754D1] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {forgotLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting Password...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </button>

                  <div className="flex items-center justify-center pt-1">
                    <button
                      type="button"
                      disabled={forgotLoading || countdown > 0}
                      onClick={() => handleSendOtp()}
                      className="inline-flex items-center text-xs font-medium text-[#4768E8] hover:underline disabled:text-slate-400 disabled:no-underline"
                    >
                      <RefreshCw className={`mr-1.5 h-3 w-3 ${forgotLoading ? 'animate-spin' : ''}`} />
                      {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP Code'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 3: Success Confirmation */}
            {forgotStep === 'success' && (
              <div className="text-center py-2">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-[#192342]">Password Reset Complete!</h3>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                  Your password has been successfully updated. You can now log into your distributor account with your new credentials.
                </p>

                <div className="mt-6 space-y-2.5">
                  <button
                    type="button"
                    onClick={handleLoginAfterReset}
                    disabled={isSubmitting}
                    className="flex h-11 w-full items-center justify-center rounded-xl bg-[#4768E8] text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#3754D1] disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing You In...
                      </>
                    ) : (
                      'Log In Now'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={closeForgotPassword}
                    className="h-10 w-full rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Back to Sign In Screen
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
