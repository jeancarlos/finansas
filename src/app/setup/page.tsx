import { Suspense } from 'react'
import { SetupPageClient } from './setup-page-client'

export default function SetupPage() {
  return (
    <Suspense>
      <SetupPageClient />
    </Suspense>
  )
}
