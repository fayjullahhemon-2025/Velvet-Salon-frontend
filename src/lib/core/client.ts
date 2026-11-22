import { authClient, useSession } from "@/lib/auth-client";
import { getUserRole, isUserBlocked } from "@/lib/auth-helpers";

export { useSession };

/**
 * Retrieves the session on the client side.
 */
export async function getClientSession() {
  try {
    const { data: session, error } = await authClient.getSession();
    if (error || !session) return null;
    return session;
  } catch (error) {
    console.error("Failed to retrieve client session:", error);
    return null;
  }
}

/**
 * Checks whether a given user has active admin privileges.
 */
export function isClientAdmin(user: unknown): boolean {
  return getUserRole(user) === "admin" && !isUserBlocked(user);
}

/**
 * Checks whether a given user has active customer privileges.
 */
export function isClientCustomer(user: unknown): boolean {
  return getUserRole(user) === "customer" && !isUserBlocked(user);
}
