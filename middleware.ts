import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher(['/sign-in(.*)'])

export default clerkMiddleware(async (auth, request) => {
  // Allow public routes (sign-in page)
  if (isPublicRoute(request)) {
    return NextResponse.next()
  }

  // Protect all other routes
  const authResult = await auth()

  if (!authResult.userId) {
    // Redirect to sign-in if not authenticated
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('redirect_url', request.url)
    return NextResponse.redirect(signInUrl)
  }

  // Optional: Check email allowlist if configured
  const allowedEmails = process.env.AUTHORIZED_EMAILS?.split(',').map(e => e.trim()) || []

  if (allowedEmails.length > 0) {
    const user = authResult.sessionClaims
    const userEmail = user?.email as string | undefined

    if (!userEmail || !allowedEmails.includes(userEmail)) {
      // User is authenticated but not in allowlist
      return NextResponse.json(
        {
          error: 'Unauthorized access',
          message: 'Your email is not authorized to access this dashboard. Please contact your administrator.'
        },
        { status: 403 }
      )
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
