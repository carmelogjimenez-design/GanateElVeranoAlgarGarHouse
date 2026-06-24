self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data.json(); } catch (e) { data = { title: "Gánate el Verano", body: event.data ? event.data.text() : "" }; }
  const title = data.title || "Gánate el Verano";
  event.waitUntil(self.registration.showNotification(title, {
    body: data.body || "", icon: "/icon-192.png", badge: "/icon-192.png",
    data: { url: data.url || "/" }, vibrate: [80, 40, 80],
  }));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.matchAll({ type: "window" }).then((list) => {
    for (const c of list) { if ("focus" in c) return c.focus(); }
    return clients.openWindow(event.notification.data && event.notification.data.url ? event.notification.data.url : "/");
  }));
});
