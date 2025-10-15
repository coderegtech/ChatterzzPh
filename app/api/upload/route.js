import { put } from "@vercel/blob";
import axios from "axios";
import { NextResponse } from "next/server";

const BASE_URL =
  "https://api.fruitask.com/v3/tables/iSYIu8SoyJrUlfu/rows/?api_key=55b4b1b8c8d48bcb874b2db55501fe44";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File size should be less than 5MB" },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const originalName = file.name.replace(/\s+/g, "-");
    const filename = `${timestamp}-${originalName}`;

    const blob = await put(filename, file, {
      access: "public",
    });

    // upload to fruitask
    const res = await axios.post(BASE_URL, {
      Name: originalName,
      Image: blob.url,
      Timestamp: timestamp,
    });

    if (res.status) {
      console.log("Image uploaded successfully");
    }

    // Return public URL from Vercel Blob
    return NextResponse.json(
      {
        success: true,
        imageUrl: blob.url,
        message: "Image uploaded successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload image",
      },
      { status: 500 }
    );
  }
}
