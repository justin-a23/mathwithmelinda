'use client'

import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import { useRouter } from 'next/navigation'
import { useAuthenticator } from '@aws-amplify/ui-react'
import { useEffect } from 'react'
import { fetchAuthSession } from 'aws-amplify/auth'
import { generateClient } from 'aws-amplify/api'

const client = generateClient()

const listStudentProfilesQuery = /* GraphQL */`
  query ListStudentProfiles($filter: ModelStudentProfileFilterInput) {
    listStudentProfiles(filter: $filter) {
      items {
        id
        userId
        firstName
        lastName
      }
    }
  }
`

function RedirectIfAuthenticated() {
  const { user } = useAuthenticator()
  const router = useRouter()

  useEffect(() => {
    if (!user) return
    const params = new URLSearchParams(window.location.search)
    const redirect = params.get('redirect')
    if (redirect) {
      router.replace(redirect)
      return
    }
    fetchAuthSession().then(async session => {
      const groups = (session.tokens?.accessToken?.payload['cognito:groups'] as string[]) ?? []
      if (groups.includes('teacher')) {
        router.replace('/teacher')
      } else if (groups.includes('parent')) {
        router.replace('/parent')
      } else {
        // Student: check if profile exists
        try {
          const result = await client.graphql({
            query: listStudentProfilesQuery,
            variables: { filter: { userId: { eq: user.userId } } }
          }) as any
          const items = result.data.listStudentProfiles.items
          if (items && items.length > 0) {
            router.replace('/dashboard')
          } else {
            router.replace('/profile/setup')
          }
        } catch {
          router.replace('/dashboard')
        }
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