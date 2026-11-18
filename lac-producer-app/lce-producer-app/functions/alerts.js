// Pure logic (no Firebase calls) so it is easy to read, change and test.

// ---- SETTINGS YOU CAN CHANGE ------------------------------------------------
const SETTINGS = {
  frostBelowC: 2,        // minimum temperature at or below this = frost risk
  heatAboveC: 32,        // maximum temperature at or above this = heat alert
  heavyRainMm: 20,       // daily rain at or above this = heavy rain alert
  strongWindKmh: 45,     // wind at or above this = strong wind alert
  priceChangePct: 10,    // price must move by this % ...
  priceChangeMinM: 0.5,  // ... and by at least this many Maloti per kg
  priceWindowDays: 14,   // only listings from the last N days count
  minListings: 2,        // need at least this many listings of a crop
};
// -----------------------------------------------------------------------------

const DISTRICTS = {
  maseru: { name: "Maseru", lat: -29.31, lon: 27.48 },
  berea: { name: "Berea", lat: -29.15, lon: 27.75 },
  leribe: { name: "Leribe", lat: -28.87, lon: 28.05 },
  butha_buthe: { name: "Butha-Buthe", lat: -28.77, lon: 28.25 },
  mokhotlong: { name: "Mokhotlong", lat: -29.29, lon: 29.07 },
  thaba_tseka: { name: "Thaba-Tseka", lat: -29.52, lon: 28.61 },
  qachas_nek: { name: "Qacha's Nek", lat: -30.12, lon: 28.69 },
  quthing: { name: "Quthing", lat: -30.4, lon: 27.7 },
  mohales_hoek: { name: "Mohale's Hoek", lat: -30.15, lon: 27.48 },
  mafeteng: { name: "Mafeteng", lat: -29.82, lon: 27.24 },
};

const CROPS = [
  "tomato", "cabbage", "spinach", "onion", "potato", "carrot", "beetroot",
  "pepper", "pumpkin", "butternut", "lettuce", "cucumber", "cauliflower",
  "beans", "peas",
];

// "Tomatoes " -> "tomato"; unknown names stay as typed (lowercase).
function cropKey(name) {
  const n = String(name || "").toLowerCase().trim();
  if (!n) return null;
  return CROPS.find((c) => n.includes(c)) || n;
}

// ---- WEATHER ---------------------------------------------------------------
// daily = Open-Meteo "daily" object (day 0 = today, day 1 = tomorrow).
// Returns e.g. [{type:"frost", day:1, value:-1}, ...] (earliest day per type).
function evaluateWeather(daily) {
  const found = {};
  const add = (type, day, value) => {
    if (!found[type]) found[type] = { type, day, value };
  };
  for (let i = 0; i < Math.min(2, daily.time.length); i++) {
    const tmin = daily.temperature_2m_min[i];
    const tmax = daily.temperature_2m_max[i];
    const rain = daily.precipitation_sum[i];
    const wind = daily.wind_speed_10m_max[i];
    const code = daily.weather_code[i];
    const snow = (code >= 71 && code <= 77) || code === 85 || code === 86;

    if (snow) add("snow", i, null);
    if (code >= 95) add("storm", i, null);
    if (tmin !== null && tmin <= SETTINGS.frostBelowC) add("frost", i, Math.round(tmin));
    if (tmax !== null && tmax >= SETTINGS.heatAboveC) add("heat", i, Math.round(tmax));
    if (rain !== null && rain >= SETTINGS.heavyRainMm) add("rain", i, Math.round(rain));
    if (wind !== null && wind >= SETTINGS.strongWindKmh) add("wind", i, Math.round(wind));
  }
  return Object.values(found);
}

// Only the alert types that were NOT already active last time.
function newWeatherAlerts(current, previousTypes) {
  const prev = new Set(previousTypes || []);
  return current.filter((a) => !prev.has(a.type));
}

// ---- PRICES ----------------------------------------------------------------
// listings = [{name, pricePerKg, createdAtMs}]
function priceAverages(listings, nowMs) {
  const cutoff = nowMs - SETTINGS.priceWindowDays * 86400000;
  const groups = {};
  for (const l of listings) {
    const key = cropKey(l.name);
    const price = Number(l.pricePerKg);
    if (!key || !(price > 0) || !l.createdAtMs || l.createdAtMs < cutoff) continue;
    (groups[key] = groups[key] || []).push(price);
  }
  const out = {};
  for (const [k, arr] of Object.entries(groups)) {
    if (arr.length >= SETTINGS.minListings) {
      out[k] = Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100;
    }
  }
  return out;
}

// Compare today's averages with the saved baseline.
// Returns { changes: [{crop, from, to, pct}], baseline: {crop: avg} }
function comparePrices(previous, current) {
  const baseline = { ...(previous || {}) };
  const changes = [];
  for (const [crop, now] of Object.entries(current)) {
    const before = baseline[crop];
    if (before === undefined) {
      baseline[crop] = now; // first time we see this crop: just remember it
      continue;
    }
    const diff = now - before;
    const pct = (diff / before) * 100;
    if (Math.abs(pct) >= SETTINGS.priceChangePct && Math.abs(diff) >= SETTINGS.priceChangeMinM) {
      changes.push({ crop, from: before, to: now, pct: Math.round(pct) });
      baseline[crop] = now;
    }
  }
  return { changes, baseline };
}

// ---- MESSAGES (English + Sesotho) -------------------------------------------
const W = {
  frost: {
    en: (d, v) => `Frost risk ${d} (min ${v}°C) - cover your seedlings`,
    st: (d, v) => `Ho ka ba le serame ${d} (${v}°C) - koahela limela`,
  },
  heat: {
    en: (d, v) => `Very hot ${d} (${v}°C) - water early morning or evening`,
    st: (d, v) => `Mocheso o phahameng ${d} (${v}°C) - nosetsa hoseng kapa mantsiboea`,
  },
  rain: {
    en: (d, v) => `Heavy rain ${d} (${v} mm)`,
    st: (d, v) => `Pula e ngata ${d} (${v} mm)`,
  },
  wind: {
    en: (d, v) => `Strong wind ${d} (${v} km/h)`,
    st: (d, v) => `Moea o matla ${d} (${v} km/h)`,
  },
  snow: { en: (d) => `Snow expected ${d}`, st: (d) => `Lehloa le tla ${d}` },
  storm: {
    en: (d) => `Thunderstorm or hail risk ${d}`,
    st: (d) => `Lialuma le sefako li ka ba teng ${d}`,
  },
};
const DAY = { en: ["today", "tomorrow"], st: ["kajeno", "hosane"] };

function buildMessage({ lang, districtName, weather, prices }) {
  const L = lang === "st" ? "st" : "en";
  const lines = [];
  for (const a of weather) lines.push(W[a.type][L](DAY[L][a.day], a.value));
  for (const p of prices) {
    const up = p.to > p.from;
    lines.push(
      L === "st"
        ? `Theko ea ${p.crop} e ${up ? "nyolohile" : "theohile"}: M${p.to}/kg (e ne e le M${p.from})`
        : `${p.crop[0].toUpperCase() + p.crop.slice(1)} price ${up ? "up" : "down"} ${Math.abs(p.pct)}%: M${p.to}/kg (was M${p.from})`
    );
  }
  let title;
  if (weather.length && prices.length)
    title = L === "st" ? `Leholimo le Theko - ${districtName}` : `Weather & price update - ${districtName}`;
  else if (weather.length)
    title = L === "st" ? `Tlhokomeliso ea Leholimo - ${districtName}` : `Weather alert - ${districtName}`;
  else title = L === "st" ? "Tlhokomeliso ea Theko" : "Market price alert";
  return { title, body: lines.join(" • ") };
}

// "A buyer wants what you grow" message (sent the moment a buy request is posted)
function buildBuyerMessage({ lang, name, quality, quantity, pricePerKg, neededDate }) {
  const L = lang === "st" ? "st" : "en";
  const crop = String(name || "").trim();
  const Crop = crop ? crop[0].toUpperCase() + crop.slice(1) : "";
  const qty = Math.round(Number(quantity) * 100) / 100;
  const price = Math.round(Number(pricePerKg) * 100) / 100;
  const q = ["A", "B", "C"].includes(quality) ? quality : "";
  if (L === "st") {
    return {
      title: `Mmaraka o teng oa ${crop}!`,
      body: `Moreki o batla ${qty} kg ea ${crop}${q ? ` (boleng ba ${q})` : ""} ka M${price}/kg` +
        `${neededDate ? `, pele ho ${neededDate}` : ""}. Bula app ho mo ikopanya.`,
    };
  }
  return {
    title: `Buyer wanted: ${Crop}`,
    body: `A buyer wants ${qty} kg of ${crop}${q ? ` (Grade ${q})` : ""} at M${price}/kg` +
      `${neededDate ? `, needed by ${neededDate}` : ""}. Open the app to contact them.`,
  };
}

module.exports = {
  SETTINGS, DISTRICTS, CROPS, cropKey,
  evaluateWeather, newWeatherAlerts, priceAverages, comparePrices, buildMessage, buildBuyerMessage,
};
