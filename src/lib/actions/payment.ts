"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import {
  type CreateCheckoutResult,
  createCheckoutSessionForAppointment,
  type VerifyPaymentResult,
  verifyAndProcessStripePayment,
} from "@/lib/api/payment";
import { requireCustomerSession } from "@/lib/core/server";

/**
 * Server action initiated when a customer clicks "Pay Now" on a confirmed unpaid appointment.
 */
export async function createCheckoutSessionAction(
  appointmentId: string,
): Promise<CreateCheckoutResult> {
  const session = await requireCustomerSession().catch(() => null);

  if (!session?.user) {
    return {
      success: false,
      error: "You must be signed in as a customer to pay for an appointment.",
    };
  }

  try {
    const headersList = await headers();
    const origin =
      headersList.get("origin") ||
      process.env.BETTER_AUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const result = await createCheckoutSessionForAppointment({
      appointmentId,
      userEmail: session.user.email,
      userId: session.user.id,
      origin,
    });

    return result;
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create checkout session.",
    };
  }
}

/**
 * Server action to verify Stripe payment and finalize appointment status.
 */
export async function confirmPaymentSuccessAction(
  sessionId: string,
): Promise<VerifyPaymentResult> {
  if (!sessionId) {
    return { success: false, error: "Stripe session ID is required." };
  }

  try {
    const result = await verifyAndProcessStripePayment(sessionId);

    if (result.success) {
      revalidatePath("/dashboard/customer/my-appointments");
      revalidatePath("/dashboard/admin/appointments");
      revalidatePath("/dashboard/admin/transactions");
      revalidatePath("/dashboard");
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to confirm payment status.",
    };
  }
}
