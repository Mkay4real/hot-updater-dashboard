import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher(['/sign-in(.*)'])

/**
 * Check if email matches authorized pattern
 * Supports:
 * - Exact email: john@company.com
 * - Wildcard domain: *@company.com (allows anyone from company.com)
 * - Wildcard subdomain: *@*.company.com (allows anyone from any subdomain)
 */
function isEmailAuthorized(email: string, allowedPatterns: string[]): boolean {
  if (!email) return false;

  return allowedPatterns.some(pattern => {
    const trimmedPattern = pattern.trim();

    // Exact match
    if (trimmedPattern === email) {
      return true;
    }

    // Wildcard domain: *@company.com
    if (trimmedPattern.startsWith('*@')) {
      const domain = trimmedPattern.substring(2); // Remove "*@"
      const emailDomain = email.split('@')[1];

      if (!emailDomain) return false;

      // Check for exact domain match
      if (emailDomain === domain) {
        return true;
      }

      // Check for subdomain wildcard: *@*.company.com matches user@sub.company.com
      if (domain.startsWith('*.')) {
        const baseDomain = domain.substring(2); // Remove "*."
        return emailDomain.endsWith('.' + baseDomain) || emailDomain === baseDomain;
      }
    }

    return false;
  });
}

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
  const allowedPatterns = process.env.AUTHORIZED_EMAILS?.split(',').map(e => e.trim()) || []

  if (allowedPatterns.length > 0) {
    const user = authResult.sessionClaims
    const userEmail = user?.email as string | undefined

    if (!userEmail || !isEmailAuthorized(userEmail, allowedPatterns)) {
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
