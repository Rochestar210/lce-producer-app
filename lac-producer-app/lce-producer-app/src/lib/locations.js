// The 10 districts of Lesotho (coordinates of the district capital).
export const DISTRICTS = {
  maseru:        { name: "Maseru",        lat: -29.31, lon: 27.48 },
  berea:         { name: "Berea",         lat: -29.15, lon: 27.75 },
  leribe:        { name: "Leribe",        lat: -28.87, lon: 28.05 },
  butha_buthe:   { name: "Butha-Buthe",   lat: -28.77, lon: 28.25 },
  mokhotlong:    { name: "Mokhotlong",    lat: -29.29, lon: 29.07 },
  thaba_tseka:   { name: "Thaba-Tseka",   lat: -29.52, lon: 28.61 },
  qachas_nek:    { name: "Qacha's Nek",   lat: -30.12, lon: 28.69 },
  quthing:       { name: "Quthing",       lat: -30.40, lon: 27.70 },
  mohales_hoek:  { name: "Mohale's Hoek", lat: -30.15, lon: 27.48 },
  mafeteng:      { name: "Mafeteng",      lat: -29.82, lon: 27.24 },
};

export const DEFAULT_DISTRICT = "maseru";

// If the phone is further than this from every district, it is not in Lesotho.
export const OUTSIDE_KM = 120;

function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function nearestDistrict(lat, lon) {
  let best = { id: DEFAULT_DISTRICT, km: Infinity };
  for (const [id, d] of Object.entries(DISTRICTS)) {
    const km = distanceKm(lat, lon, d.lat, d.lon);
    if (km < best.km) best = { id, km };
  }
  return best;
}

// The vegetables a farmer can choose to follow for price alerts.
export const CROPS = [
  "tomato", "cabbage", "spinach", "onion", "potato", "carrot", "beetroot",
  "pepper", "pumpkin", "butternut", "lettuce", "cucumber", "cauliflower",
  "beans", "peas",
];
