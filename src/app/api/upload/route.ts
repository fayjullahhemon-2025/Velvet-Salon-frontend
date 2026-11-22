import { NextResponse } from "next/server";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

type ImgbbResponse = {
  success?: boolean;
  data?: {
    url?: string;
    display_url?: string;
    error?: {
      message?: string;
    };
  };
};

export async function POST(request: Request) {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "Image upload is not configured." },
      { status: 500 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid form data." },
      { status: 400 },
    );
  }

  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) {
    return NextResponse.json(
      { success: false, error: "Please choose an image to upload." },
      { status: 400 },
    );
  }
  if (!ALLOWED_TYPES.has(image.type)) {
    return NextResponse.json(
      {
        success: false,
        error: "Only JPG, PNG, GIF or WebP images are allowed.",
      },
      { status: 400 },
    );
  }
  if (image.size > MAX_IMAGE_SIZE) {
    return NextResponse.json(
      { success: false, error: "Image must be smaller than 10MB." },
      { status: 400 },
    );
  }

  const bytes = await image.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64Image = buffer.toString("base64");

  const uploadBody = new FormData();
  uploadBody.append("image", base64Image);

  let uploadResponse: Response;
  try {
    uploadResponse = await fetch(
      `https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`,
      { method: "POST", body: uploadBody },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Image upload failed. Please try again." },
      { status: 502 },
    );
  }

  const payload: ImgbbResponse | null = await uploadResponse
    .json()
    .catch(() => null);
  const url = payload?.data?.display_url ?? payload?.data?.url;

  if (!uploadResponse.ok || !payload?.success || typeof url !== "string") {
    return NextResponse.json(
      {
        success: false,
        error:
          payload?.data?.error?.message ??
          "Image upload failed. Please try again.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true, url });
}
