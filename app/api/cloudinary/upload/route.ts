import { createHash } from "crypto";
import { NextResponse } from "next/server";

import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Signed Cloudinary upload.
 *
 * The API secret must never reach the browser, so the signature is computed
 * here and the file is forwarded server-side. Cloudinary only needs the params
 * sorted alphabetically followed by the secret: `folder=…&timestamp=…<secret>`.
 */
export async function POST(request: Request) {
  const { allowed } = await AccessServer("admin");
  if (!allowed) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Cloudinary is not configured on this server" },
      { status: 503 },
    );
  }

  const incoming = await request.formData();
  const file = incoming.get("file");
  const folder = String(incoming.get("folder") ?? "educare");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file received" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only images can be uploaded" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image is larger than 5 MB" },
      { status: 413 },
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  const body = new FormData();
  body.append("file", file, file.name || "upload");
  body.append("api_key", apiKey);
  body.append("timestamp", String(timestamp));
  body.append("folder", folder);
  body.append("signature", signature);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body },
    );
    const data = (await response.json()) as {
      secure_url?: string;
      public_id?: string;
      width?: number;
      height?: number;
      error?: { message?: string };
    };

    if (!response.ok || !data.secure_url) {
      console.error("cloudinary upload failed:", data?.error?.message);
      return NextResponse.json(
        { error: data?.error?.message ?? "Upload failed" },
        { status: 502 },
      );
    }

    return NextResponse.json({
      url: data.secure_url,
      publicId: data.public_id,
      width: data.width,
      height: data.height,
    });
  } catch (error) {
    console.error("cloudinary upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 502 });
  }
}
