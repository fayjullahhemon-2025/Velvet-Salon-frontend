import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getUserRole, isUserBlocked } from "@/lib/auth-helpers";
import { getDb } from "@/lib/db";

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
    if (
      (error as { digest?: string })?.digest === "DYNAMIC_SERVER_USAGE" ||
      (error as { digest?: string })?.digest === "HANGING_PROMISE_REJECTION" ||
      (error as Error)?.message?.includes("During prerendering")
    ) {
      throw error;
    }
    console.error("Failed to retrieve server session:", error);
    return null;
  }
}

/**
 * Enforces that a user is logged in and not blocked.
 * Checks both session and live database to prevent blocked users from accessing protected features.
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

  // Live DB check ensures newly blocked users cannot bypass via existing cached sessions
  try {
    const db = await getDb();
    const liveUser =
      (await db.collection("user").findOne({ email: session.user.email })) ||
      (await db.collection("users").findOne({ email: session.user.email }));
    if (liveUser?.isBlocked) {
      throw new Error(
        "Forbidden: Your account has been suspended. Please contact salon administration.",
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("Forbidden")) {
      throw error;
    }
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

/**
 * Enforces that the authenticated user is a customer and is not blocked.
 * Prevents administrators from booking customer appointments.
 */
export async function requireCustomerSession() {
  const session = await requireUserSession();
  const role = getUserRole(session.user);
  if (role === "admin") {
    throw new Error(
      "Forbidden: Administrators cannot book customer appointments. Please use a customer account.",
    );
  }
  return session;
}
