const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const {
  DISTRICTS, cropKey, evaluateWeather, newWeatherAlerts,
  priceAverages, comparePrices, buildMessage, buildBuyerMessage,
} = require("./alerts");

admin.initializeApp();
const db = admin.firestore();

const APP_URL = process.env.APP_URL || "https://lce-producer-app.vercel.app";

async function fetchForecast(d) {
  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${d.lat}&longitude=${d.lon}` +
    "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code" +
    "&timezone=Africa%2FMaseru&forecast_days=2";
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  return (await res.json()).daily;
}

function pushPayload(tokens, { title, body }) {
  return {
    tokens,
    notification: { title, body },
    data: { url: APP_URL },
    webpush: {
      fcmOptions: { link: APP_URL },
      notification: { icon: `${APP_URL}/logo192.png`, badge: `${APP_URL}/logo192.png`, tag: "lce-alert" },
    },
  };
}

// Sends in groups of 500 and deletes tokens that are no longer valid.
async function sendToTokens(tokens, message) {
  for (let i = 0; i < tokens.length; i += 500) {
    const chunk = tokens.slice(i, i + 500);
    const res = await admin.messaging().sendEachForMulticast(pushPayload(chunk, message));
    const dead = [];
    res.responses.forEach((r, idx) => {
      const code = r.error && r.error.code;
      if (
        code === "messaging/registration-token-not-registered" ||
        code === "messaging/invalid-registration-token"
      ) dead.push(chunk[idx]);
    });
    if (dead.length) {
      const batch = db.batch();
      dead.forEach((t) => batch.delete(db.collection("subscribers").doc(t)));
      await batch.commit();
    }
    logger.info(`Sent ${res.successCount} ok, ${res.failureCount} failed`);
  }
}

// ---------------------------------------------------------------------------
// Runs every 3 hours. Detects CHANGES in weather and market prices and sends
// one combined notification to each farmer (their district + their crops).
// ---------------------------------------------------------------------------
exports.checkAlerts = onSchedule(
  { schedule: "every 3 hours", timeZone: "Africa/Maseru", timeoutSeconds: 300 },
  async () => {
    const subsSnap = await db.collection("subscribers").get();
    if (subsSnap.empty) return logger.info("No subscribers yet.");
    const subs = subsSnap.docs.map((d) => d.data());

    // 1) WEATHER: one forecast per district that has subscribers
    const weatherByDistrict = {};
    const districts = [...new Set(subs.map((s) => s.district).filter((d) => DISTRICTS[d]))];
    for (const id of districts) {
      try {
        const stateRef = db.collection("alertState").doc(`weather_${id}`);
        const prev = (await stateRef.get()).data();
        const current = evaluateWeather(await fetchForecast(DISTRICTS[id]));
        weatherByDistrict[id] = newWeatherAlerts(current, prev && prev.active);
        await stateRef.set({ active: current.map((a) => a.type), updatedAt: new Date() });
      } catch (e) {
        logger.error(`Weather failed for ${id}`, e);
        weatherByDistrict[id] = [];
      }
    }

    // 2) MARKET: average price per crop from recent listings vs last baseline
    const listingsSnap = await db.collection("listings").get();
    const listings = listingsSnap.docs.map((d) => {
      const x = d.data();
      return { name: x.name, pricePerKg: x.pricePerKg, createdAtMs: x.createdAt ? x.createdAt.toMillis() : 0 };
    });
    const marketRef = db.collection("alertState").doc("market");
    const prevMarket = (await marketRef.get()).data();
    const { changes, baseline } = comparePrices(
      prevMarket && prevMarket.prices,
      priceAverages(listings, Date.now())
    );
    await marketRef.set({ prices: baseline, updatedAt: new Date() });

    // 3) One combined message per farmer, grouped so we send in bulk
    const groups = {};
    for (const s of subs) {
      if (!DISTRICTS[s.district]) continue;
      const wanted = new Set((s.crops || []).map(cropKey));
      const prices = changes.filter((c) => wanted.size === 0 || wanted.has(c.crop));
      const weather = weatherByDistrict[s.district] || [];
      if (!weather.length && !prices.length) continue;

      const msg = buildMessage({
        lang: s.lang,
        districtName: DISTRICTS[s.district].name,
        weather,
        prices,
      });
      const key = msg.title + "|" + msg.body;
      (groups[key] = groups[key] || { msg, tokens: [] }).tokens.push(s.token);
    }

    for (const g of Object.values(groups)) await sendToTokens(g.tokens, g.msg);
    logger.info(`Done. ${Object.keys(groups).length} message group(s), ${changes.length} price change(s).`);
  }
);

// Lets the "Send test alert" button in the app confirm that everything works.
exports.sendTestNotification = onCall(async (request) => {
  const token = request.data && request.data.token;
  if (typeof token !== "string") throw new HttpsError("invalid-argument", "token required");
  const doc = await db.collection("subscribers").doc(token).get();
  if (!doc.exists) throw new HttpsError("not-found", "Not subscribed");
  const lang = doc.data().lang;
  await sendToTokens([token], {
    title: lang === "st" ? "LAC Balemi" : "LAC Producers",
    body: lang === "st"
      ? "Litlhokomelo li sebetsa! U tla tsebisoa ha leholimo kapa theko e fetoha."
      : "Alerts are working! You will be notified when weather or prices change.",
  });
  return { ok: true };
});

// ---------------------------------------------------------------------------
// Runs the moment a buyer posts a request. Tells every producer who sells that
// vegetable (they have posted it in the Market) that there is a buyer for it.
// NOTE: if deploy says the region must match your Firestore database, set
// FIRESTORE_REGION (e.g. in functions/.env) to the database location.
// ---------------------------------------------------------------------------
exports.notifyProducersOfBuyer = onDocumentCreated(
  { document: "buyerOrders/{id}", region: process.env.FIRESTORE_REGION || "us-central1" },
  async (event) => {
    const order = event.data && event.data.data();
    if (!order) return;
    const wanted = cropKey(order.name);
    if (!wanted) return;

    const subsSnap = await db.collection("subscribers").get();
    const byLang = {};
    for (const d of subsSnap.docs) {
      const s = d.data();
      const sells = (s.produce || []).map(cropKey);
      if (!sells.includes(wanted)) continue;
      const L = s.lang === "st" ? "st" : "en";
      (byLang[L] = byLang[L] || []).push(s.token);
    }

    for (const [lang, tokens] of Object.entries(byLang)) {
      await sendToTokens(tokens, buildBuyerMessage({ lang, ...order }));
    }
    logger.info(`Buyer request for "${wanted}": notified ${Object.values(byLang).flat().length} producer(s).`);
  }
);
