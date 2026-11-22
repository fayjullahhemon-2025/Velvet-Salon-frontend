import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getUserRole, isUserBlocked } from "@/lib/auth-helpers";

/**
 * Retrieves the current session on the server side using Better Auth.
 */
export async function getServerSession() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session;
  } catch (error) {
    console.error("Failed to retrieve server session:", error);
    return null;
  }
}

/**
 * Enforces that a user is logged in and not blocked.
 */
export async function requireUserSession() {
  const session = await getServerSession();
  if (!session?.user) {
    throw new Error("Unauthorized: Please sign in to perform this action.");
  }
  if (isUserBlocked(session.user)) {
    throw new Error(
      "Forbidden: Your account has been suspended. Please contact salon administration.",
    );
  }
  return session;
}

/**
 * Enforces that the authenticated user has the 'admin' role and is not blocked.
 */
export async function requireAdminSession() {
  const session = await requireUserSession();
  const role = getUserRole(session.user);
  if (role !== "admin") {
    throw new Error(
      "Forbidden: You do not have permission to perform this administrative action.",
    );
  }
  return session;
}
