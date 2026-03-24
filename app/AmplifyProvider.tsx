'use client'

import { Amplify } from 'aws-amplify'
import config from '../src/amplifyconfiguration.json'

Amplify.configure(config)

export default function AmplifyProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
