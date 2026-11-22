import { ObjectId } from "mongodb";
import { getServerSession } from "@/lib/core/server";
import { getDb } from "@/lib/db";
import type { UserProfile } from "@/types/user";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:5000";

/**
 * Normalizes a database user document into a typed UserProfile.
 */
function normalizeUserProfile(doc: Record<string, unknown>): UserProfile {
  return {
    _id: doc._id ? String(doc._id) : "",
    name: String(doc.name || ""),
    email: String(doc.email || ""),
    image: doc.image ? String(doc.image) : undefined,
    phone: doc.phone ? String(doc.phone) : undefined,
    role: (doc.role === "admin" ? "admin" : "customer") as "admin" | "customer",
    isBlocked: Boolean(doc.isBlocked),
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : doc.createdAt
          ? String(doc.createdAt)
          : undefined,
  };
}

/**
 * Fetches the current logged-in user's profile.
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const session = await getServerSession();
  if (!session?.user) return null;

  const email = session.user.email;
  const userId = session.user.id;

  // Try backend first
  try {
    const res = await fetch(`${BACKEND_URL}/api/users/profile`, {
      headers: {
        "x-user-email": email,
        "x-user-id": userId,
      },
      next: { revalidate: 0 },
    });
    if (res.ok) {
      const payload = await res.json();
      if (payload?.success && payload.data) {
        return normalizeUserProfile(payload.data);
      }
    }
  } catch {
    // Fallback to shared database
  }

  try {
    const db = await getDb();
    let doc = null;

    if (userId && ObjectId.isValid(userId)) {
      doc = await db.collection("user").findOne({ _id: new ObjectId(userId) });
      if (!doc) {
        doc = await db
          .collection("users")
          .findOne({ _id: new ObjectId(userId) });
      }
    }

    if (!doc && email) {
      doc = await db.collection("user").findOne({ email });
      if (!doc) {
        doc = await db.collection("users").findOne({ email });
      }
    }

    if (!doc) {
      // Fallback with session values
      return {
        _id: userId,
        name: session.user.name || "",
        email: session.user.email || "",
        image: session.user.image || undefined,
        role: "customer",
        isBlocked: false,
      };
    }

    return normalizeUserProfile(doc);
  } catch (error) {
    console.error("Failed to query user profile from DB:", error);
    return null;
  }
}
