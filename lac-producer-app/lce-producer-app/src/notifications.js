import { getMessaging, getToken, onMessage, deleteToken, isSupported } from "firebase/messaging";
import { getFunctions, httpsCallable } from "firebase/functions";
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { app, db } from "./firebase";
import { myProduce } from "./lib/myPosts";

// Optional. If REACT_APP_FIREBASE_VAPID_KEY is not set, Firebase uses its own
// default web-push key, so alerts work without any extra setup.
const VAPID_KEY = process.env.REACT_APP_FIREBASE_VAPID_KEY;
export const TOKEN_KEY = "lce_push_token";

export async function pushSupported() {
  try {
    return "Notification" in window && "serviceWorker" in navigator && (await isSupported());
  } catch (e) {
    return false;
  }
}

export const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

export const savedToken = () => {
  try { return localStorage.getItem(TOKEN_KEY); } catch (e) { return null; }
};

// Save / update this phone's alert settings in Firestore (subscribers/{token}).
export async function saveSubscription(token, { district, crops, lang }) {
  await setDoc(
    doc(db, "subscribers", token),
    { token, district, crops, lang, produce: myProduce(), updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function enableAlerts({ district, crops, lang }) {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("denied");

  const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  await navigator.serviceWorker.ready;

  const options = { serviceWorkerRegistration: reg };
  if (VAPID_KEY) options.vapidKey = VAPID_KEY;
  const token = await getToken(getMessaging(app), options);
  if (!token) throw new Error("no-token");

  await saveSubscription(token, { district, crops, lang });
  localStorage.setItem(TOKEN_KEY, token);
  return token;
}

// Called right after someone posts produce, so "a buyer wants this" alerts start at once.
export async function updateProduce(produce) {
  const token = savedToken();
  if (!token) return;
  try {
    await setDoc(doc(db, "subscribers", token), { token, produce, updatedAt: serverTimestamp() }, { merge: true });
  } catch (e) {}
}

export async function disableAlerts() {
  const token = savedToken();
  try {
    if (token) await deleteDoc(doc(db, "subscribers", token));
  } catch (e) {}
  try { await deleteToken(getMessaging(app)); } catch (e) {}
  localStorage.removeItem(TOKEN_KEY);
}

// Alerts that arrive while the app is open are not shown by the browser
// automatically, so we show them ourselves.
export function listenForeground() {
  let unsub = () => {};
  try {
    unsub = onMessage(getMessaging(app), async (payload) => {
      const reg = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");
      const n = payload.notification || {};
      if (reg) {
        reg.showNotification(n.title || "LAC Producers", {
          body: n.body,
          icon: "/logo192.png",
          tag: "lce-alert",
        });
      }
    });
  } catch (e) {}
  return unsub;
}

// Shows a notification straight from this phone (no server needed).
export async function showLocalNotification(title, body) {
  const reg = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");
  if (!reg) throw new Error("no-sw");
  await reg.showNotification(title, { body, icon: "/logo192.png", tag: "lce-alert" });
}

export async function sendTestAlert() {
  const token = savedToken();
  if (!token) throw new Error("no-token");
  const fn = httpsCallable(getFunctions(app), "sendTestNotification");
  await fn({ token });
}
