'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NewProgramRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/dashboard/programs?new=1') }, [router])
  return null
}
