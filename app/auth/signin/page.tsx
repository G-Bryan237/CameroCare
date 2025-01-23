// app/auth/signin/page.tsx
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import Logo from '@/components/logo'
import Link from 'next/link'

export default function SignIn() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
  
    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })
  
      if (result?.error) {
        setError('Invalid email or password')
      } else {
        router.push('/');  // Redirect to the root page
        router.refresh();
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <nav className="site-header">
        <div className="site-brand">
          <Logo className="site-logo" />
          <h1 className="site-name">Cameroon Care Community</h1>
        </div>
      </nav>

      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your account</p>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="name@company.com"
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="password-input">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••"
                required
                className="form-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="remember-checkbox"
              />
              <label htmlFor="remember-me" className="ml-2 text-sm text-gray-600">
                Remember me
              </label>
            </div>
            <Link href="/auth/forgot-password" className="auth-link">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="auth-submit w-full"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link href="/auth/signup" className="auth-link">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}