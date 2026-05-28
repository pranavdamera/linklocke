'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'
import { Mail, Lock, ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'signin' | 'signup' | 'magic'>('signin')
  const [sent, setSent] = useState(false)

  const supabase = createClient()

  async function handleMagicLink() {
    if (!email) return toast.error('Enter your email')
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    setLoading(false)
    if (error) return toast.error(error.message)
    setSent(true)
  }

  async function handleSignIn() {
    if (!email || !password) return toast.error('Fill in all fields')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) return toast.error(error.message)
    window.location.href = '/dashboard'
  }

  async function handleSignUp() {
    if (!email || !password) return toast.error('Fill in all fields')
    if (password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    setLoading(false)
    if (error) return toast.error(error.message)
    toast.success('Check your email to confirm your account!')
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="text-4xl">📬</div>
            <h2 className="text-xl font-bold">Check your email</h2>
            <p className="text-sm text-muted-foreground">
              We sent a magic link to <strong>{email}</strong>.<br />
              Click it to sign in.
            </p>
            <Button variant="outline" className="w-full" onClick={() => setSent(false)}>
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-hero-gradient">
      <div className="w-full max-w-sm space-y-4">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">⚔️</div>
          <h1 className="text-2xl font-bold">Linklocke Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your Unova run</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Mode tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-muted rounded-lg">
              {(['signin', 'signup', 'magic'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`py-1.5 rounded-md text-xs font-medium transition-colors ${mode === m ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {m === 'signin' ? 'Sign in' : m === 'signup' ? 'Sign up' : 'Magic link'}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="pl-9"
                    onKeyDown={e => e.key === 'Enter' && (mode === 'magic' ? handleMagicLink() : mode === 'signin' ? handleSignIn() : handleSignUp())}
                  />
                </div>
              </div>

              {mode !== 'magic' && (
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="pl-9"
                      onKeyDown={e => e.key === 'Enter' && (mode === 'signin' ? handleSignIn() : handleSignUp())}
                    />
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                onClick={mode === 'magic' ? handleMagicLink : mode === 'signin' ? handleSignIn : handleSignUp}
                loading={loading}
              >
                {mode === 'magic' ? 'Send magic link' : mode === 'signin' ? 'Sign in' : 'Create account'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 justify-center">
            <ArrowLeft className="h-3 w-3" /> Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
