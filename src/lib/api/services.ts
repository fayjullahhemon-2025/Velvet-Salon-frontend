import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import type {
  Service,
  ServiceFilterParams,
  ServiceSortOption,
} from "@/types/service";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:5000";

/**
 * Normalizes a raw service document from MongoDB or API response.
 */
function normalizeService(raw: Record<string, unknown> & { _id: unknown }): Service {
  return {
    _id: String(raw._id),
    serviceName: String(raw.serviceName ?? ""),
    category: String(raw.category ?? ""),
    description: String(raw.description ?? ""),
    price: Number(raw.price ?? 0),
    duration: Number(raw.duration ?? 0),
    image: String(raw.image ?? ""),
    status: raw.status === "inactive" ? "inactive" : "active",
    createdAt:
      typeof raw.createdAt === "object" &&
      raw.createdAt !== null &&
      "toISOString" in raw.createdAt
        ? (raw.createdAt as { toISOString: () => string }).toISOString()
        : String(raw.createdAt ?? ""),
    updatedAt:
      typeof raw.updatedAt === "object" &&
      raw.updatedAt !== null &&
      "toISOString" in raw.updatedAt
        ? (raw.updatedAt as { toISOString: () => string }).toISOString()
        : String(raw.updatedAt ?? ""),
  };
}

/**
 * 1. Fetch exactly 6 (or specified limit) active featured services from the API.
 * Uses dedicated backend endpoint /api/services/featured with direct MongoDB fallback.
 */
export async function getFeaturedServices(limit = 6): Promise<Service[]> {
  const safeLimit = Math.max(1, limit);
  const url = `${BACKEND_URL}/api/services/featured?limit=${safeLimit}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 0 },
    });
    if (res.ok) {
      const payload = await res.json();
      if (payload?.success && Array.isArray(payload.data)) {
        return payload.data.map(normalizeService);
      }
    }
  } catch {
    // Fallback directly to shared database
  }

  try {
    const db = await getDb();
    const docs = await db
      .collection("services")
      .find({ status: "active" })
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .toArray();

    return docs.map(normalizeService);
  } catch (error) {
    console.error("Failed to query featured services:", error);
    return [];
  }
}

/**
 * 2. Fetch data from id.
 * Uses backend endpoint /api/services/:id with direct MongoDB fallback.
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
        return normalizeService(payload.data);
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

    return normalizeService(doc);
  } catch (error) {
    console.error(`Failed to fetch service with id ${id}:`, error);
    return null;
  }
}

/**
 * 3. Fetch and sort data through API.
 * Supports sort options: price_asc, price_desc, duration_asc, duration_desc, name_asc, name_desc, newest.
 */
export async function getSortedServices(
  sort: ServiceSortOption,
  extraParams?: Omit<ServiceFilterParams, "sort">,
): Promise<Service[]> {
  return getServices({
    ...extraParams,
    sort,
  });
}

/**
 * General services fetch with filtering, searching, sorting, and pagination/limit.
 */
export async function getServices(
  params?: ServiceFilterParams,
): Promise<Service[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.category) query.set("category", params.category);
  if (params?.search) query.set("search", params.search);
  if (params?.sort) query.set("sort", params.sort);
  if (params?.limit) query.set("limit", String(params.limit));

  const queryString = query.toString();
  const url = `${BACKEND_URL}/api/services${queryString ? `?${queryString}` : ""}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 0 },
    });
    if (res.ok) {
      const payload = await res.json();
      if (payload?.success && Array.isArray(payload.data)) {
        return payload.data.map(normalizeService);
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
    } else if (params?.sort === "name_asc") {
      cursor = cursor.sort({ serviceName: 1 });
    } else if (params?.sort === "name_desc") {
      cursor = cursor.sort({ serviceName: -1 });
    } else {
      cursor = cursor.sort({ createdAt: -1 });
    }

    if (params?.limit && params.limit > 0) {
      cursor = cursor.limit(params.limit);
    }

    const docs = await cursor.toArray();
    return docs.map(normalizeService);
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
