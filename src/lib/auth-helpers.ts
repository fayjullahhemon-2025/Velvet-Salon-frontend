type AuthLikeError = {
  code?: string;
  message?: string | null;
};

const FRIENDLY_MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Incorrect email or password.",
  INVALID_EMAIL: "Please enter a valid email address.",
  INVALID_PASSWORD: "Password does not meet the requirements.",
  USER_NOT_FOUND: "No account found with these details.",
  USER_ALREADY_EXISTS:
    "An account with this email already exists. Try signing in instead.",
  PASSWORD_TOO_SHORT: "Password must be at least 6 characters.",
  PASSWORD_TOO_LONG: "Password is too long.",
  EMAIL_NOT_VERIFIED: "Please verify your email before signing in.",
};

export function getAuthErrorMessage(
  error: AuthLikeError | null | undefined,
): string {
  if (!error) return "Something went wrong. Please try again.";
  const friendly = error.code ? FRIENDLY_MESSAGES[error.code] : undefined;
  if (friendly) return friendly;
  if (error.message) return error.message;
  return "Authentication failed. Please try again.";
}

export function isUserBlocked(user: unknown): boolean {
  if (user && typeof user === "object" && "isBlocked" in user) {
    return Boolean((user as { isBlocked?: unknown }).isBlocked);
  }
  return false;
}

export function getUserRole(user: unknown): string | null {
  if (
    user &&
    typeof user === "object" &&
    "role" in user &&
    typeof (user as { role?: unknown }).role === "string"
  ) {
    return (user as { role: string }).role;
  }
  return null;
}

export function getHomeForRole(user: unknown): string {
  if (
    user &&
    typeof user === "object" &&
    "role" in user &&
    (user as { role?: unknown }).role === "admin"
  ) {
    return "/dashboard/admin";
  }
  return "/dashboard";
}
