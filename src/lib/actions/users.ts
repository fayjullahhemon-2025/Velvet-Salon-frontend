"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { getCurrentUserProfile } from "@/lib/api/users";
import { requireUserSession } from "@/lib/core/server";
import { getDb } from "@/lib/db";
import type { UpdateProfileInput, UserProfile } from "@/types/user";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:5000";

/**
 * Server action to update permitted profile information.
 *
 * Rules strictly enforced:
 * 1. Users must not be able to change their own role or blocked status.
 * 2. Users must not be able to update another user's profile.
 * 3. Permitted fields: name, image, phone.
 */
export async function updateUserProfileAction(
  input: UpdateProfileInput,
): Promise<{ success: boolean; data?: UserProfile; message?: string }> {
  const session = await requireUserSession();
  const userId = session.user.id;
  const userEmail = session.user.email;

  // Validate name
  if (input.name !== undefined && !input.name.trim()) {
    throw new Error("Full Name cannot be empty.");
  }

  // Sanitize permitted fields ONLY
  const updateDoc: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (input.name !== undefined) {
    updateDoc.name = input.name.trim();
  }
  if (input.image !== undefined) {
    updateDoc.image = input.image.trim();
  }
  if (input.phone !== undefined) {
    updateDoc.phone = input.phone.trim();
  }

  // Attempt backend API call first
  try {
    const res = await fetch(`${BACKEND_URL}/api/users/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-email": userEmail,
        "x-user-id": userId,
      },
      body: JSON.stringify({
        name: updateDoc.name,
        image: updateDoc.image,
        phone: updateDoc.phone,
      }),
    });

    if (res.ok) {
      const payload = await res.json();
      revalidatePath("/dashboard/customer/profile");
      revalidatePath("/dashboard/admin/profile");
      revalidatePath("/dashboard");
      return {
        success: true,
        data: payload.data,
        message: "Profile updated successfully!",
      };
    }

    const errData = await res.json().catch(() => null);
    if (errData?.error) {
      throw new Error(errData.error);
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message &&
      !error.message.includes("fetch failed")
    ) {
      throw error;
    }
    // Fallback to direct DB
  }

  // Fallback to direct DB
  const db = await getDb();
  let collectionName = "user";

  let existing = null;
  if (userId && ObjectId.isValid(userId)) {
    existing = await db
      .collection("user")
      .findOne({ _id: new ObjectId(userId) });
    if (!existing) {
      existing = await db
        .collection("users")
        .findOne({ _id: new ObjectId(userId) });
      if (existing) collectionName = "users";
    }
  }

  if (!existing && userEmail) {
    existing = await db.collection("user").findOne({ email: userEmail });
    if (!existing) {
      existing = await db.collection("users").findOne({ email: userEmail });
      if (existing) collectionName = "users";
    }
  }

  if (!existing) {
    throw new Error("User record not found.");
  }

  // Security check: update is strictly anchored to existing._id
  await db
    .collection(collectionName)
    .updateOne({ _id: existing._id }, { $set: updateDoc });

  revalidatePath("/dashboard/customer/profile");
  revalidatePath("/dashboard/admin/profile");
  revalidatePath("/dashboard");

  const fresh = await getCurrentUserProfile();

  return {
    success: true,
    data: fresh || undefined,
    message: "Profile updated successfully!",
  };
}

/**
 * Server action to fetch the current user's profile.
 */
export async function fetchCurrentUserProfileAction(): Promise<UserProfile | null> {
  await requireUserSession();
  return getCurrentUserProfile();
}
