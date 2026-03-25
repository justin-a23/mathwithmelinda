'use client'

import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import { useRouter } from 'next/navigation'
import { useAuthenticator } from '@aws-amplify/ui-react'
import { useEffect } from 'react'

function RedirectIfAuthenticated() {
  const { user } = useAuthenticator()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.replace('/dashboard')
    }
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