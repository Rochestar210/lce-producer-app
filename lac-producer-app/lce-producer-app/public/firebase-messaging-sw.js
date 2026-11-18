/* Service worker: makes the app installable and receives push alerts
   when the app is closed. Notifications sent by the server are displayed
   automatically by Firebase. */
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBz-ekyRIA5LmhXh6bsW0y95WRwdNIvf4k",
  authDomain: "ict4d-c3ea2.firebaseapp.com",
  projectId: "ict4d-c3ea2",
  storageBucket: "ict4d-c3ea2.firebasestorage.app",
  messagingSenderId: "1019861130637",
  appId: "1:1019861130637:web:af5e5ffae4c6c3c944b1c4",
});

firebase.messaging();

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// Required for the browser to treat the app as installable.
self.addEventListener("fetch", () => {});

// Clicks on alerts we showed ourselves (while the app was open).
self.addEventListener("notificationclick", (event) => {
  if (event.notification.data && event.notification.data.FCM_MSG) return; // Firebase handles these
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) if ("focus" in c) return c.focus();
      return self.clients.openWindow("/");
    })
  );
});
