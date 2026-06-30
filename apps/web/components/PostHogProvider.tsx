'use client'

import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'

const POSTHOG_KEY  = process.env.NEXT_PUBLIC_POSTHOG_KEY  ?? ''
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com'

function PostHogPageView() {
  const pathname    = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!POSTHOG_KEY) return
    // BUG-21 : __loaded est une API interne — on capture directement (PostHog bufferise si non init)
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
    posthog.capture('$pageview', { $current_url: url })
  }, [pathname, searchParams])

  return null
}

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!POSTHOG_KEY) return
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: false, // géré manuellement ci-dessus
      capture_pageleave: true,
      autocapture: false,      // on contrôle les events manuellement
    })
  }, [])

  if (!POSTHOG_KEY) return <>{children}</>

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  )
}

/** Helper exporté pour tracker des events depuis n'importe quel composant client */
export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (!POSTHOG_KEY || typeof window === 'undefined') return
  posthog.capture(event, properties)
}
