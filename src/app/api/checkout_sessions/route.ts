import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createCheckoutSessionForAppointment } from "@/lib/api/payment";
import { getServerSession } from "@/lib/core/server";

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    let appointmentId = "";
    try {
      const body = await req.json();
      appointmentId = body?.appointmentId;
    } catch {
      const url = new URL(req.url);
      appointmentId = url.searchParams.get("appointmentId") || "";
    }

    if (!appointmentId) {
      return NextResponse.json(
        { success: false, error: "appointmentId is required" },
        { status: 400 },
      );
    }

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

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      sessionId: result.sessionId,
    });
  } catch (error) {
    console.error("Error in checkout_sessions route:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Internal server error creating checkout session",
      },
      { status: 500 },
    );
  }
}
