// Service Worker for Push Notifications

try {
  self.addEventListener("install", (event) => {
    console.log("[SW] Service Worker installing...");
    self.skipWaiting();
  });

  self.addEventListener("activate", (event) => {
    console.log("[SW] Service Worker activating...");
    event.waitUntil(self.clients.claim());
  });

  self.addEventListener("push", (event) => {
    console.log("[SW] Push notification received", event);

    var title = "New Message";
    var body = "You have a new message";
    var icon = "/app-icon.svg";
    var badge = "/app-icon.svg";
    var tag = "message-notification";
    var url = "/";

    if (event.data) {
      try {
        var data = event.data.json();
        title = data.title || title;
        body = data.body || body;
        icon = data.icon || icon;
        tag = data.tag || tag;
        url = data.url || url;
      } catch (e) {
        console.error("[SW] Error parsing push data:", e);
      }
    }

    var options = {
      body: body,
      icon: icon,
      badge: badge,
      tag: tag,
      data: { url: url },
      requireInteraction: false,
    };

    event
      .waitUntil(self.registration.showNotification(title, options))
      .catch((error) => console.error("Error showing notification:", error));
  });

  self.addEventListener("notificationclick", (event) => {
    console.log("[SW] Notification clicked");
    event.notification.close();

    var urlToOpen = "/";
    if (event.notification.data && event.notification.data.url) {
      urlToOpen = event.notification.data.url;
    }

    event.waitUntil(
      clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clientList) => {
          for (var i = 0; i < clientList.length; i++) {
            var client = clientList[i];
            if (client.url === urlToOpen && "focus" in client) {
              return client.focus();
            }
          }
          if (client.openWindow) {
            return client.openWindow(urlToOpen);
          }
        })
    );
  });
} catch (error) {
  console.error("SW initialization error:", error);
}
