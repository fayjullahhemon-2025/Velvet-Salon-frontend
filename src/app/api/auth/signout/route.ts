import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await auth.api.signOut({
      headers: await headers(),
    });
  } catch {
    // Continue even if server signOut throws
  }

  const signinUrl = new URL("/signin", request.url);
  const response = NextResponse.redirect(signinUrl);

  const cookiesToClear = [
    "better-auth.session_token",
    "__Secure-better-auth.session_token",
    "better-auth.session_data",
    "__Secure-better-auth.session_data",
  ];

  for (const cookieName of cookiesToClear) {
    response.cookies.set(cookieName, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
  }

  return response;
}

export async function POST(request: NextRequest) {
  return GET(request);
}
