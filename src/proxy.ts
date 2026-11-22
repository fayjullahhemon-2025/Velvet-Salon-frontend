import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Skip static assets, Next.js internal paths, and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 2. Identify session token presence
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__Secure-better-auth.session_token");

  // Determine route classifications
  const isServiceDetails =
    pathname.startsWith("/services/") && pathname !== "/services";
  const isDashboardRoute =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isAdminRoute =
    pathname === "/dashboard/admin" ||
    pathname.startsWith("/dashboard/admin/") ||
    pathname.startsWith("/dashboard/manage-");
  const isAuthRoute = pathname === "/signin" || pathname === "/signup";

  // ---------------------------------------------------------------------------
  // GUEST FLOW (No Session Cookie Present)
  // ---------------------------------------------------------------------------
  if (!sessionCookie) {
    // If guest attempts to access service details or any dashboard route, redirect to signin
    if (isServiceDetails || isDashboardRoute) {
      const signinUrl = new URL("/signin", request.url);
      signinUrl.searchParams.set("callbackUrl", pathname + search);
      return NextResponse.redirect(signinUrl);
    }

    // Public routes are accessible to guests
    return NextResponse.next();
  }

  // ---------------------------------------------------------------------------
  // AUTHENTICATED FLOW (Session Token Cookie Present)
  // ---------------------------------------------------------------------------
  let session = null;
  try {
    session = await auth.api.getSession({
      headers: request.headers,
    });
  } catch (error) {
    console.error("Error retrieving session in proxy:", error);
  }

  // If token was invalid or expired, treat as unauthenticated
  if (!session?.user) {
    if (isServiceDetails || isDashboardRoute) {
      const signinUrl = new URL("/signin", request.url);
      signinUrl.searchParams.set("callbackUrl", pathname + search);
      return NextResponse.redirect(signinUrl);
    }
    return NextResponse.next();
  }

  const user = session.user;
  const userRole = (user as { role?: string }).role || "customer";
  const isBlocked = Boolean((user as { isBlocked?: boolean }).isBlocked);
  const isAdmin = userRole === "admin";

  // ---------------------------------------------------------------------------
  // BLOCKED USER ENFORCEMENT
  // ---------------------------------------------------------------------------
  // Rule: Blocked users are locked out of all protected features (details & booking, dashboard actions)
  if (isBlocked) {
    if (isServiceDetails) {
      // Prevent blocked users from accessing booking/details
      const dashboardUrl = new URL("/dashboard", request.url);
      return NextResponse.redirect(dashboardUrl);
    }
    // For dashboard routes, DashboardLayout will render the Account Suspended screen
    if (isDashboardRoute) {
      return NextResponse.next();
    }
  }

  // ---------------------------------------------------------------------------
  // AUTH ROUTE GUARD (Logged-in users cannot access signin or signup)
  // ---------------------------------------------------------------------------
  if (isAuthRoute) {
    const rawCallback = request.nextUrl.searchParams.get("callbackUrl");
    let destination = isAdmin ? "/dashboard/admin" : "/dashboard";

    if (rawCallback) {
      try {
        const decoded = decodeURIComponent(rawCallback);
        if (decoded.startsWith("/") && !decoded.startsWith("//")) {
          const isAdminTarget =
            decoded.startsWith("/dashboard/admin") ||
            decoded.startsWith("/dashboard/manage-");
          if (!isAdminTarget || isAdmin) {
            destination = decoded;
          }
        }
      } catch {
        // Fall back to role-based default destination
      }
    }

    return NextResponse.redirect(new URL(destination, request.url));
  }

  // ---------------------------------------------------------------------------
  // ROLE-BASED DASHBOARD GUARDS
  // ---------------------------------------------------------------------------
  if (isDashboardRoute) {
    // Customer attempting to access Admin routes:
    // e.g. /dashboard/admin/* or /dashboard/manage-users, /dashboard/manage-services
    if (isAdminRoute && !isAdmin) {
      const customerHome = new URL(
        "/dashboard?error=unauthorized",
        request.url,
      );
      return NextResponse.redirect(customerHome);
    }

    // Admin convenience redirects for manage-* aliases
    if (isAdmin) {
      if (pathname === "/dashboard") {
        return NextResponse.redirect(new URL("/dashboard/admin", request.url));
      }
      if (pathname === "/dashboard/manage-users") {
        return NextResponse.redirect(
          new URL("/dashboard/admin/customers", request.url),
        );
      }
      if (pathname === "/dashboard/manage-services") {
        return NextResponse.redirect(
          new URL("/dashboard/admin/services", request.url),
        );
      }
      if (pathname === "/dashboard/manage-appointments") {
        return NextResponse.redirect(
          new URL("/dashboard/admin/appointments", request.url),
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images with extensions
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
