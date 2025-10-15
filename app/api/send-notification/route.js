import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      receiverId,
      senderName,
      messageContent,
      messageType,
      notificationType,
    } = body;

    // Validate required fields
    if (
      !process.env.ONESIGNAL_REST_API_KEY ||
      !process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
    ) {
      return NextResponse.json(
        { success: false, error: "OneSignal configuration missing" },
        { status: 500 }
      );
    }

    const messageBody =
      messageType === "image" ? "📷 Sent an image" : messageContent;

    let notificationPayload;

    if (notificationType === "global") {
      // Send to all subscribed users for global chat
      notificationPayload = {
        app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
        included_segments: ["All"],
        headings: { en: `${senderName} in Global Chat` },
        contents: { en: messageBody },
        data: {
          type: "global_chat",
        },
      };
    } else {
      // Send to specific user for direct messages
      if (!receiverId) {
        return NextResponse.json(
          { success: false, error: "Receiver ID required for direct messages" },
          { status: 400 }
        );
      }

      notificationPayload = {
        app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
        include_external_user_ids: [receiverId],
        headings: { en: `New message from ${senderName}` },
        contents: { en: messageBody },
        data: {
          type: "message",
          receiverId: receiverId,
        },
      };
    }

    // Send notification via OneSignal REST API
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(notificationPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OneSignal API error:", data);
      return NextResponse.json(
        { success: false, error: "Failed to send notification" },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Notification error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
