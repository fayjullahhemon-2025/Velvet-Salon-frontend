import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import type { UserFilterParams, UserProfile } from "@/types/user";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:5000";

/**
 * Normalizes a database user document into a typed UserProfile.
 */
function normalizeUserProfile(
  doc: Record<string, unknown>,
  totalAppointments?: number,
): UserProfile {
  return {
    _id: doc._id ? String(doc._id) : "",
    name: String(doc.name || ""),
    email: String(doc.email || ""),
    image: doc.image ? String(doc.image) : undefined,
    phone: doc.phone ? String(doc.phone) : undefined,
    role: (doc.role === "admin" ? "admin" : "customer") as "admin" | "customer",
    isBlocked: Boolean(doc.isBlocked),
    totalAppointments:
      totalAppointments !== undefined
        ? totalAppointments
        : doc.totalAppointments !== undefined
          ? Number(doc.totalAppointments)
          : undefined,
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : doc.createdAt
          ? String(doc.createdAt)
          : undefined,
  };
}

/**
 * Fetches a user profile by email or user ID.
 * Completely decoupled from server session imports to prevent Turbopack circular cycles.
 */
export async function getCurrentUserProfile(
  userEmail?: string,
  userId?: string,
): Promise<UserProfile | null> {
  if (!userEmail && !userId) return null;

  // Try backend first
  try {
    const res = await fetch(`${BACKEND_URL}/api/users/profile`, {
      headers: {
        ...(userEmail ? { "x-user-email": userEmail } : {}),
        ...(userId ? { "x-user-id": userId } : {}),
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

    if (!doc && userEmail) {
      doc = await db.collection("user").findOne({ email: userEmail });
      if (!doc) {
        doc = await db.collection("users").findOne({ email: userEmail });
      }
    }

    if (!doc) return null;

    return normalizeUserProfile(doc);
  } catch (error) {
    console.error("Failed to query user profile from DB:", error);
    return null;
  }
}

/**
 * Fetches all registered customers for admin viewing.
 */
export async function getAllCustomersForAdmin(
  params?: UserFilterParams,
  adminEmail?: string,
): Promise<UserProfile[]> {
  const query = new URLSearchParams();
  query.set("role", params?.role || "customer");
  if (params?.status && params.status !== "all") {
    query.set("status", params.status);
  }
  if (params?.search) {
    query.set("search", params.search);
  }

  try {
    const qs = query.toString();
    const res = await fetch(`${BACKEND_URL}/api/users${qs ? `?${qs}` : ""}`, {
      headers: {
        "x-user-role": "admin",
        ...(adminEmail ? { "x-user-email": adminEmail } : {}),
      },
      next: { revalidate: 0 },
    });

    if (res.ok) {
      const payload = await res.json();
      if (payload?.success && Array.isArray(payload.data)) {
        return payload.data.map((u: Record<string, unknown>) =>
          normalizeUserProfile(u),
        );
      }
    }
  } catch {
    // Fallback to direct DB
  }

  try {
    const db = await getDb();
    const mongoQuery: Record<string, unknown> = {};

    if (params?.role && params.role !== "all") {
      mongoQuery.role = params.role;
    } else {
      mongoQuery.role = "customer";
    }

    if (params?.status === "active") {
      mongoQuery.isBlocked = { $ne: true };
    } else if (params?.status === "blocked") {
      mongoQuery.isBlocked = true;
    }

    if (params?.search?.trim()) {
      const reg = new RegExp(params.search.trim(), "i");
      mongoQuery.$or = [{ name: reg }, { email: reg }];
    }

    let users = await db
      .collection("user")
      .find(mongoQuery)
      .sort({ createdAt: -1 })
      .toArray();

    if (users.length === 0) {
      users = await db
        .collection("users")
        .find(mongoQuery)
        .sort({ createdAt: -1 })
        .toArray();
    }

    const appointmentsCollection = db.collection("appointments");
    const results = await Promise.all(
      users.map(async (u) => {
        const count = await appointmentsCollection.countDocuments({
          $or: [{ customerId: String(u._id) }, { customerEmail: u.email }],
        });
        return normalizeUserProfile(u, count);
      }),
    );

    return results;
  } catch (error) {
    console.error("Failed to query customers from DB:", error);
    return [];
  }
}

/**
 * Fetches details for a single customer.
 */
export async function getUserDetailsForAdmin(
  userId: string,
): Promise<UserProfile | null> {
  if (!userId) return null;

  try {
    const res = await fetch(`${BACKEND_URL}/api/users/${userId}`, {
      headers: { "x-user-role": "admin" },
      next: { revalidate: 0 },
    });
    if (res.ok) {
      const payload = await res.json();
      if (payload?.success && payload.data) {
        return normalizeUserProfile(payload.data);
      }
    }
  } catch {
    // Fallback to DB
  }

  try {
    const db = await getDb();
    if (!ObjectId.isValid(userId)) return null;

    let doc = await db
      .collection("user")
      .findOne({ _id: new ObjectId(userId) });
    if (!doc) {
      doc = await db.collection("users").findOne({ _id: new ObjectId(userId) });
    }
    if (!doc) return null;

    const count = await db.collection("appointments").countDocuments({
      $or: [{ customerId: String(doc._id) }, { customerEmail: doc.email }],
    });

    return normalizeUserProfile(doc, count);
  } catch (error) {
    console.error(`Failed to fetch user details for ${userId}:`, error);
    return null;
  }
}
