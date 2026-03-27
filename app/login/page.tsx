'use client'

import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import { useRouter } from 'next/navigation'
import { useAuthenticator } from '@aws-amplify/ui-react'
import { useEffect } from 'react'
import { fetchAuthSession } from 'aws-amplify/auth'

function RedirectIfAuthenticated() {
  const { user } = useAuthenticator()
  const router = useRouter()

  useEffect(() => {
    if (!user) return
    fetchAuthSession().then(session => {
      const groups = (session.tokens?.accessToken?.payload['cognito:groups'] as string[]) ?? []
      if (groups.includes('teacher')) {
        router.replace('/teacher')
      } else if (groups.includes('parent')) {
        router.replace('/parent')
      } else {
        router.replace('/dashboard')
      }
    })
  }, [user, router])

  return null
}

export default function LoginPage() {
  return (
    <Authenticator>
      {() => <RedirectIfAuthenticated />}
    </Authenticator>
  )
}