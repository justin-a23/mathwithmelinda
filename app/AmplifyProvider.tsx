'use client'

import { Amplify } from 'aws-amplify'
import { Authenticator } from '@aws-amplify/ui-react'
// Gen 2 outputs, written by the backend phase of the build (and by
// `npx ampx sandbox` locally) before the frontend compiles. This replaces
// src/amplifyconfiguration.json, which was the Gen 1 equivalent.
import outputs from '../amplify_outputs.json'

Amplify.configure(outputs)

export default function AmplifyProvider({ children }: { children: React.ReactNode }) {
  return (
    <Authenticator.Provider>
      {children}
    </Authenticator.Provider>
  )
}