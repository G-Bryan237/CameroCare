// app/auth/signup/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { signIn } from 'next-auth/react'
import Logo from '@/components/logo'
import Link from 'next/link'

export default function SignUp() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
  
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }
  
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      setIsLoading(false)
      return
    }
  
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password
        })
      })
  
      const data = await res.json()
  
      if (!res.ok) {
        throw new Error(data.message || 'Something went wrong')
      }
  
      // After successful signup, sign in automatically
      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })
  
      if (signInResult?.error) {
        throw new Error('Error signing in after registration')
      }
  
      router.push('/')  // Redirect to the root page
      router.refresh()
    } catch (error: any) {
      setError(error.message || 'An error occurred during registration')
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
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Sign up to get started</p>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* First Name and Last Name fields remain the same */}
          <div className="form-group">
            <label htmlFor="firstName" className="form-label">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastName" className="form-label">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              required
              className="form-input"
            />
          </div>

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

          {/* Password field */}
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
                minLength={8}
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

          {/* Confirm Password field */}
          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password
            </label>
            <div className="password-input">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                placeholder="••••••••"
                required
                minLength={8}
                className="form-input"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="password-toggle"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="auth-submit w-full"
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link href="/auth/signin" className="auth-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}