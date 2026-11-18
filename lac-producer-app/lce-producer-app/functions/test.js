// Run with: npm test   (checks the alert rules without touching Firebase)
const a = require("./alerts");
const assert = require("assert");

// Frost tomorrow in Mokhotlong
const daily = {
  time: ["2026-11-17", "2026-11-18"],
  temperature_2m_min: [6, -1], temperature_2m_max: [22, 15],
  precipitation_sum: [0, 25], wind_speed_10m_max: [20, 50], weather_code: [1, 73],
};
const w = a.evaluateWeather(daily);
assert.deepStrictEqual(w.map((x) => x.type).sort(), ["frost", "rain", "snow", "wind"]);
assert.strictEqual(a.newWeatherAlerts(w, ["frost"]).length, 3); // frost already announced

// Prices
const now = Date.now();
const L = (name, p, daysAgo = 1) => ({ name, pricePerKg: p, createdAtMs: now - daysAgo * 86400000 });
const cur = a.priceAverages([L("Tomatoes", 12), L("tomato", 14), L("Cabbage", 8), L("Onion", 10, 30), L("Onion", 10, 40)], now);
assert.deepStrictEqual(cur, { tomato: 13 });       // cabbage has 1 listing, onion too old

let r = a.comparePrices({}, cur);                   // first run: baseline only
assert.strictEqual(r.changes.length, 0);
r = a.comparePrices({ tomato: 13 }, { tomato: 14 }); // +7.7% -> no alert
assert.strictEqual(r.changes.length, 0);
r = a.comparePrices({ tomato: 10 }, { tomato: 13 }); // +30% -> alert
assert.strictEqual(r.changes[0].pct, 30);

// Combined message in both languages
console.log(a.buildMessage({ lang: "en", districtName: "Mokhotlong", weather: w.slice(0, 2), prices: r.changes }));
console.log(a.buildMessage({ lang: "st", districtName: "Mokhotlong", weather: w.slice(0, 1), prices: [] }));
console.log("All tests passed");

// Buyer request message
const bm = a.buildBuyerMessage({ lang: "en", name: "tomato", quality: "A", quantity: 50, pricePerKg: 12, neededDate: "2026-11-25" });
assert.ok(bm.title.includes("Tomato") && bm.body.includes("50 kg") && bm.body.includes("M12/kg"));
console.log(bm, a.buildBuyerMessage({ lang: "st", name: "tomato", quality: "B", quantity: 5, pricePerKg: 9 }));
assert.strictEqual(a.cropKey("Tomatoes"), "tomato"); // matches what sellers typed
console.log("Buyer message tests passed");
