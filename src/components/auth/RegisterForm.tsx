import { useState } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { User, Mail, Lock, Phone } from 'lucide-react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { useRegister } from '../../lib/queries/auth.queries'

export function RegisterForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const register = useRegister()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await register.mutateAsync({ name, email, password, phone })
      navigate({ href: '/dashboard' })
    } catch (err: any) {
      setError(err.message ?? 'Registration failed')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
      <Input label="Full Name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" leftIcon={<User className="w-4 h-4" />} required />
      <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" leftIcon={<Mail className="w-4 h-4" />} required />
      <Input label="Phone Number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter your phone number" leftIcon={<Phone className="w-4 h-4" />} />
      <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" leftIcon={<Lock className="w-4 h-4" />} required />
      <Button type="submit" className="w-full" loading={register.isPending} size="lg">Create Account</Button>
      <p className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" search={{}} className="text-[#F4622A] font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  )
}
