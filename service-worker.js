const ADMIN_URL = new URL("./admin.html", self.registration ? self.registration.scope : self.location.href).href;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_) {
    payload = { title: "WoPets Admin", body: "New order received." };
  }

  const title = String(payload.title || "WoPets — New Order");
  const body = String(payload.body || "A new order has arrived.");
  const orderId = payload.orderId ? String(payload.orderId) : "";
  const orderNumber = payload.orderNumber ? String(payload.orderNumber) : "";
  const target = new URL(ADMIN_URL);
  if (orderId) target.searchParams.set("order", orderId);
  target.searchParams.set("notification", "new-order");

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "./homepage-banner.svg",
      badge: "./homepage-banner.svg",
      tag: orderId ? "wopets-order-" + orderId : "wopets-new-order",
      renotify: true,
      data: { orderId, orderNumber, url: target.href },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification && event.notification.data ? event.notification.data : {};
  const targetUrl = data.url || ADMIN_URL;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.startsWith(new URL("./admin.html", self.registration.scope).href) && "focus" in client) {
          if (data.orderId && "navigate" in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
      return undefined;
    })
  );
});
