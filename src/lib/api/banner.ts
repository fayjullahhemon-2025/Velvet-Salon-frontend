import { getDb } from "@/lib/db";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  "http://localhost:5000";

const FALLBACK_BANNER_SRC = "https://i.ibb.co.com/Hptnwr5X/img-71.png";

export interface SalonImageRecord {
  _id?: string;
  url: string;
  directUrl?: string;
  imageUrl?: string;
  type?: string;
  addedAt?: string;
}

/**
 * Resolves an ImgBB page URL or direct URL to a usable direct CDN image URL.
 */
export function resolveImageUrl(
  url: string,
  directUrl?: string,
  imageUrl?: string,
): string {
  if (directUrl?.trim()) return directUrl.trim();
  if (imageUrl?.trim()) return imageUrl.trim();

  const trimmed = url.trim();
  // Known mapping for the specific user image "https://ibb.co.com/CsbhCnRW"
  if (trimmed.includes("CsbhCnRW")) {
    return "https://i.ibb.co.com/Hptnwr5X/img-71.png";
  }
  return trimmed || FALLBACK_BANNER_SRC;
}

/**
 * Fetches the banner image from ${NEXT_PUBLIC_BACKEND_URL}/iimages
 * with fallback to MongoDB collection 'images'.
 */
export async function getBannerImage(): Promise<string> {
  const targetPageUrl = "https://ibb.co.com/CsbhCnRW";

  // 1. Attempt to fetch from backend /iimages
  try {
    const res = await fetch(`${BACKEND_URL}/iimages`, {
      cache: "no-store",
    }).catch(() => null);

    if (res?.ok) {
      const data = await res.json();
      if (data?.success && Array.isArray(data.data)) {
        const found = data.data.find(
          (img: SalonImageRecord) =>
            img.url === targetPageUrl || img.url?.includes("CsbhCnRW"),
        );
        if (found) {
          return resolveImageUrl(found.url, found.directUrl, found.imageUrl);
        }
        if (data.data.length > 0 && data.data[0]?.url) {
          return resolveImageUrl(
            data.data[0].url,
            data.data[0].directUrl,
            data.data[0].imageUrl,
          );
        }
      }
    }
  } catch (err) {
    console.warn("Backend /iimages fetch notice:", err);
  }

  // 2. Direct DB fallback (Velvet-Saloon-DB.images)
  try {
    const db = await getDb();
    const doc = await db.collection("images").findOne({
      $or: [{ url: targetPageUrl }, { url: { $regex: "CsbhCnRW" } }],
    });

    if (doc) {
      return resolveImageUrl(
        String(doc.url ?? ""),
        typeof doc.directUrl === "string" ? doc.directUrl : undefined,
        typeof doc.imageUrl === "string" ? doc.imageUrl : undefined,
      );
    }
  } catch (dbErr) {
    console.warn("Direct DB image lookup notice:", dbErr);
  }

  return FALLBACK_BANNER_SRC;
}
