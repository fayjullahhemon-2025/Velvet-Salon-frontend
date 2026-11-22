import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import type { Service, ServiceFilterParams } from "@/types/service";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:5000";

/**
 * Get services according to filters (status, category, search, sort).
 * Connects to the Express backend API with direct MongoDB query fallback.
 */
export async function getServices(
  params?: ServiceFilterParams,
): Promise<Service[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.category) query.set("category", params.category);
  if (params?.search) query.set("search", params.search);
  if (params?.sort) query.set("sort", params.sort);

  const queryString = query.toString();
  const url = `${BACKEND_URL}/api/services${queryString ? `?${queryString}` : ""}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 0 },
    });
    if (res.ok) {
      const payload = await res.json();
      if (payload?.success && Array.isArray(payload.data)) {
        return payload.data.map(
          (item: Record<string, unknown> & { _id: unknown }) => ({
            ...item,
            _id: String(item._id),
          }),
        ) as Service[];
      }
    }
  } catch {
    // Fallback directly to shared database
  }

  try {
    const db = await getDb();
    const mongoQuery: Record<string, unknown> = {};

    if (params?.status && params.status !== "all") {
      mongoQuery.status = params.status;
    } else if (!params?.status) {
      mongoQuery.status = "active";
    }

    if (
      params?.category &&
      params.category !== "all" &&
      params.category.trim()
    ) {
      mongoQuery.category = params.category.trim();
    }

    if (params?.search?.trim()) {
      mongoQuery.serviceName = { $regex: params.search.trim(), $options: "i" };
    }

    let cursor = db.collection("services").find(mongoQuery);

    if (params?.sort === "price_asc") {
      cursor = cursor.sort({ price: 1 });
    } else if (params?.sort === "price_desc") {
      cursor = cursor.sort({ price: -1 });
    } else if (params?.sort === "duration_asc") {
      cursor = cursor.sort({ duration: 1 });
    } else if (params?.sort === "duration_desc") {
      cursor = cursor.sort({ duration: -1 });
    } else {
      cursor = cursor.sort({ createdAt: -1 });
    }

    const docs = await cursor.toArray();
    return docs.map((doc) => ({
      _id: doc._id.toString(),
      serviceName: doc.serviceName,
      category: doc.category,
      description: doc.description,
      price: doc.price,
      duration: doc.duration,
      image: doc.image,
      status: doc.status,
      createdAt:
        typeof doc.createdAt === "object" &&
        doc.createdAt !== null &&
        "toISOString" in doc.createdAt
          ? (doc.createdAt as { toISOString: () => string }).toISOString()
          : String(doc.createdAt ?? ""),
      updatedAt:
        typeof doc.updatedAt === "object" &&
        doc.updatedAt !== null &&
        "toISOString" in doc.updatedAt
          ? (doc.updatedAt as { toISOString: () => string }).toISOString()
          : String(doc.updatedAt ?? ""),
    })) as Service[];
  } catch (error) {
    console.error("Failed to query services:", error);
    return [];
  }
}

/**
 * Get all services for administrator management (includes both active and inactive).
 */
export async function getAllServicesForAdmin(): Promise<Service[]> {
  return getServices({ status: "all" });
}

/**
 * Get a single service by ID.
 */
export async function getServiceById(id: string): Promise<Service | null> {
  if (!id) return null;

  try {
    const res = await fetch(`${BACKEND_URL}/api/services/${id}`, {
      next: { revalidate: 0 },
    });
    if (res.ok) {
      const payload = await res.json();
      if (payload?.success && payload.data) {
        return {
          ...payload.data,
          _id: String(payload.data._id),
        } as Service;
      }
    }
  } catch {
    // Fallback directly to shared database
  }

  try {
    const db = await getDb();
    if (!ObjectId.isValid(id)) return null;

    const doc = await db
      .collection("services")
      .findOne({ _id: new ObjectId(id) });
    if (!doc) return null;

    return {
      _id: doc._id.toString(),
      serviceName: doc.serviceName,
      category: doc.category,
      description: doc.description,
      price: doc.price,
      duration: doc.duration,
      image: doc.image,
      status: doc.status,
      createdAt:
        typeof doc.createdAt === "object" &&
        doc.createdAt !== null &&
        "toISOString" in doc.createdAt
          ? (doc.createdAt as { toISOString: () => string }).toISOString()
          : String(doc.createdAt ?? ""),
      updatedAt:
        typeof doc.updatedAt === "object" &&
        doc.updatedAt !== null &&
        "toISOString" in doc.updatedAt
          ? (doc.updatedAt as { toISOString: () => string }).toISOString()
          : String(doc.updatedAt ?? ""),
    } as Service;
  } catch (error) {
    console.error(`Failed to fetch service ${id}:`, error);
    return null;
  }
}
