'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

export default function RootPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  useEffect(() => {
    if (loading) return
    router.replace(user ? '/dashboard' : '/login')
  }, [router, user, loading])
  return null
}
