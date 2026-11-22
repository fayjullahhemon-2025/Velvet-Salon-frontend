"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import {
  getAllCustomersForAdmin,
  getCurrentUserProfile,
} from "@/lib/api/users";
import { auth } from "@/lib/auth";
import { requireAdminSession, requireUserSession } from "@/lib/core/server";
import { getDb } from "@/lib/db";
import { getTokenFromServer } from "@/lib/getTokenFromServer";
import type {
  UpdateProfileInput,
  UserFilterParams,
  UserProfile,
} from "@/types/user";

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
    const token =
      input?.token || (await getTokenFromServer().catch(() => null));
    const reqHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "x-user-email": userEmail,
      "x-user-id": userId,
    };
    if (token) {
      reqHeaders.authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${BACKEND_URL}/api/users/profile`, {
      method: "PATCH",
      headers: reqHeaders,
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

  // Update session on server side so session cookies also reflect the new name
  try {
    await auth.api.updateUser({
      headers: await headers(),
      body: {
        name: updateDoc.name as string,
        ...(updateDoc.image ? { image: updateDoc.image as string } : {}),
      },
    });
  } catch (authErr) {
    console.warn("auth.api.updateUser sync notice:", authErr);
  }

  revalidatePath("/", "layout");
  revalidatePath("/dashboard/customer/profile");
  revalidatePath("/dashboard/admin/profile");
  revalidatePath("/dashboard");

  const fresh = await getCurrentUserProfile(userEmail, userId);

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
  const session = await requireUserSession();
  return getCurrentUserProfile(session.user.email, session.user.id);
}

/**
 * Server action for an Admin to block or unblock a customer.
 * Rule: Admin cannot block themselves.
 * Blocked users must not be able to access protected platform features.
 */
export async function toggleUserBlockStatusAction(
  targetUserId: string,
  isBlocked: boolean,
  optionalToken?: string,
): Promise<{ success: boolean; message: string }> {
  const session = await requireAdminSession();

  if (!targetUserId || !ObjectId.isValid(targetUserId)) {
    throw new Error("Invalid user ID.");
  }

  // Safety check: Admin cannot block their own account
  if (session.user.id === targetUserId || session.user.email) {
    const db = await getDb();
    const targetUser =
      (await db
        .collection("user")
        .findOne({ _id: new ObjectId(targetUserId) })) ||
      (await db
        .collection("users")
        .findOne({ _id: new ObjectId(targetUserId) }));

    if (
      targetUser &&
      (String(targetUser._id) === session.user.id ||
        targetUser.email === session.user.email)
    ) {
      throw new Error("Administrators cannot block their own account.");
    }
  }

  // Attempt backend API call first
  try {
    const token =
      optionalToken || (await getTokenFromServer().catch(() => null));
    const reqHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "x-user-role": "admin",
      "x-user-email": session.user.email,
      "x-user-id": session.user.id,
    };
    if (token) {
      reqHeaders.authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${BACKEND_URL}/api/users/${targetUserId}/block`, {
      method: "PATCH",
      headers: reqHeaders,
      body: JSON.stringify({ isBlocked }),
    });

    if (res.ok) {
      const payload = await res.json();
      revalidatePath("/dashboard/admin/customers");
      revalidatePath("/dashboard/admin");
      return {
        success: true,
        message:
          payload.message ||
          (isBlocked
            ? "Customer has been blocked."
            : "Customer has been unblocked."),
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

  const db = await getDb();
  let targetCollection = "user";
  let targetUser = await db
    .collection("user")
    .findOne({ _id: new ObjectId(targetUserId) });

  if (!targetUser) {
    targetUser = await db
      .collection("users")
      .findOne({ _id: new ObjectId(targetUserId) });
    if (targetUser) targetCollection = "users";
  }

  if (!targetUser) {
    throw new Error("Customer account not found.");
  }

  await db.collection(targetCollection).updateOne(
    { _id: new ObjectId(targetUserId) },
    {
      $set: {
        isBlocked: Boolean(isBlocked),
        updatedAt: new Date(),
      },
    },
  );

  revalidatePath("/dashboard/admin/customers");
  revalidatePath("/dashboard/admin");

  return {
    success: true,
    message: isBlocked
      ? `Customer "${targetUser.name || "Customer"}" has been blocked.`
      : `Customer "${targetUser.name || "Customer"}" has been unblocked.`,
  };
}

/**
 * Server action for Admin to fetch customers with optional filters.
 */
export async function fetchCustomersForAdminAction(
  params?: UserFilterParams,
): Promise<UserProfile[]> {
  const session = await requireAdminSession();
  return getAllCustomersForAdmin(params, session.user.email);
}
