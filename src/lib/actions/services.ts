"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/core/server";
import { getDb } from "@/lib/db";
import type {
  Service,
  ServiceFilterParams,
  ServiceInput,
  ServiceSortOption,
  ServiceStatus,
} from "@/types/service";
import {
  getFeaturedServices,
  getServiceById,
  getServices,
  getSortedServices,
} from "@/lib/api/services";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:5000";

/**
 * Server action to create a new service.
 * Enforces admin authorization, positive price, and positive duration.
 */
export async function createService(input: ServiceInput) {
  const session = await requireAdminSession();

  if (!input.serviceName?.trim()) {
    throw new Error("Service Name is required.");
  }
  if (!input.category?.trim()) {
    throw new Error("Service Category is required.");
  }
  if (!input.description?.trim()) {
    throw new Error("Service Description is required.");
  }
  if (!input.image?.trim()) {
    throw new Error("Service Image is required.");
  }

  const price = Number(input.price);
  if (Number.isNaN(price) || price <= 0) {
    throw new Error("Price must be a positive number.");
  }

  const duration = Number(input.duration);
  if (Number.isNaN(duration) || duration <= 0) {
    throw new Error("Estimated duration must be a positive number.");
  }

  const newDoc = {
    serviceName: input.serviceName.trim(),
    category: input.category.trim(),
    description: input.description.trim(),
    price,
    duration: Math.round(duration),
    image: input.image.trim(),
    status: (input.status === "inactive"
      ? "inactive"
      : "active") as ServiceStatus,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    const res = await fetch(`${BACKEND_URL}/api/services`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "admin",
        "x-user-email": session.user.email,
      },
      body: JSON.stringify(newDoc),
    });
    if (res.ok) {
      revalidatePath("/dashboard/admin/services");
      revalidatePath("/services");
      revalidatePath("/");
      return { success: true, message: "Service created successfully." };
    }
  } catch {
    // Fallback to shared database
  }

  const db = await getDb();
  await db.collection("services").insertOne(newDoc);

  revalidatePath("/dashboard/admin/services");
  revalidatePath("/services");
  revalidatePath("/");

  return { success: true, message: "Service created successfully." };
}

/**
 * Server action to update an existing service.
 * Enforces admin authorization, positive price, and positive duration.
 */
export async function updateService(id: string, input: Partial<ServiceInput>) {
  const session = await requireAdminSession();

  if (!id || !ObjectId.isValid(id)) {
    throw new Error("Invalid service ID.");
  }

  const updateDoc: Record<string, unknown> = { updatedAt: new Date() };

  if (input.serviceName !== undefined) {
    if (!input.serviceName.trim())
      throw new Error("Service name cannot be empty.");
    updateDoc.serviceName = input.serviceName.trim();
  }

  if (input.category !== undefined) {
    if (!input.category.trim())
      throw new Error("Service category cannot be empty.");
    updateDoc.category = input.category.trim();
  }

  if (input.description !== undefined) {
    if (!input.description.trim())
      throw new Error("Description cannot be empty.");
    updateDoc.description = input.description.trim();
  }

  if (input.image !== undefined) {
    if (!input.image.trim()) throw new Error("Image cannot be empty.");
    updateDoc.image = input.image.trim();
  }

  if (input.status !== undefined) {
    if (input.status !== "active" && input.status !== "inactive") {
      throw new Error("Invalid status.");
    }
    updateDoc.status = input.status;
  }

  if (input.price !== undefined) {
    const price = Number(input.price);
    if (Number.isNaN(price) || price <= 0) {
      throw new Error("Price must be a positive number.");
    }
    updateDoc.price = price;
  }

  if (input.duration !== undefined) {
    const duration = Number(input.duration);
    if (Number.isNaN(duration) || duration <= 0) {
      throw new Error("Duration must be a positive number.");
    }
    updateDoc.duration = Math.round(duration);
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/services/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "admin",
        "x-user-email": session.user.email,
      },
      body: JSON.stringify(updateDoc),
    });
    if (res.ok) {
      revalidatePath("/dashboard/admin/services");
      revalidatePath("/services");
      revalidatePath(`/services/${id}`);
      revalidatePath("/");
      return { success: true, message: "Service updated successfully." };
    }
  } catch {
    // Fallback to shared database
  }

  const db = await getDb();
  const result = await db
    .collection("services")
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateDoc },
      { returnDocument: "after" },
    );

  if (!result) {
    throw new Error("Service not found.");
  }

  revalidatePath("/dashboard/admin/services");
  revalidatePath("/services");
  revalidatePath(`/services/${id}`);
  revalidatePath("/");

  return { success: true, message: "Service updated successfully." };
}

/**
 * Server action to toggle a service's active/inactive status.
 */
export async function toggleServiceStatus(
  id: string,
  newStatus: ServiceStatus,
) {
  const session = await requireAdminSession();

  if (!id || !ObjectId.isValid(id)) {
    throw new Error("Invalid service ID.");
  }
  if (newStatus !== "active" && newStatus !== "inactive") {
    throw new Error("Status must be 'active' or 'inactive'.");
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/services/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "admin",
        "x-user-email": session.user.email,
      },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      revalidatePath("/dashboard/admin/services");
      revalidatePath("/services");
      revalidatePath("/");
      return { success: true, message: `Service is now ${newStatus}.` };
    }
  } catch {
    // Fallback to shared database
  }

  const db = await getDb();
  await db
    .collection("services")
    .updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: newStatus, updatedAt: new Date() } },
    );

  revalidatePath("/dashboard/admin/services");
  revalidatePath("/services");
  revalidatePath("/");

  return { success: true, message: `Service is now ${newStatus}.` };
}

/**
 * Server action to delete a service.
 */
export async function deleteService(id: string) {
  const session = await requireAdminSession();

  if (!id || !ObjectId.isValid(id)) {
    throw new Error("Invalid service ID.");
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/services/${id}`, {
      method: "DELETE",
      headers: {
        "x-user-role": "admin",
        "x-user-email": session.user.email,
      },
    });
    if (res.ok) {
      revalidatePath("/dashboard/admin/services");
      revalidatePath("/services");
      revalidatePath("/");
      return { success: true, message: "Service deleted successfully." };
    }
  } catch {
    // Fallback to shared database
  }

  const db = await getDb();
  const result = await db
    .collection("services")
    .deleteOne({ _id: new ObjectId(id) });
  if (result.deletedCount === 0) {
    throw new Error("Service not found.");
  }

  revalidatePath("/dashboard/admin/services");
  revalidatePath("/services");
  revalidatePath("/");

  return { success: true, message: "Service deleted successfully." };
}
