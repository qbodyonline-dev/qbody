'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AssignProgramRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/dashboard/programs') }, [router])
  return null
}
