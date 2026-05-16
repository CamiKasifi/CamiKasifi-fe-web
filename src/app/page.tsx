'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getToken } from '@/lib/api'

export default function RootPage() {
  const router = useRouter()
  useEffect(() => {
    const target = getToken() ? '/dashboard' : '/login'
    router.replace(target)
  }, [router])
  return null
}
