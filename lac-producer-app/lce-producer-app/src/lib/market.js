export const CROP_NAME = (s) => String(s || "").trim();

export const money = (n) =>
  (Math.round(Number(n) * 100) / 100).toLocaleString("en-US", { maximumFractionDigits: 2 });

// Lesotho numbers have 8 digits; WhatsApp needs the country code (266).
export function waLink(phone, text) {
  let d = String(phone || "").replace(/\D/g, "").replace(/^00/, "");
  if (d.length === 8) d = "266" + d;
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`;
}

// Opens the phone's dialer. Lesotho numbers (8 digits) get the +266 country code.
export function telLink(phone) {
  let d = String(phone || "").replace(/\D/g, "").replace(/^00/, "");
  if (d.length === 8) d = "266" + d;
  return `tel:+${d}`;
}

export function postedOn(createdAt, lang) {
  try {
    if (!createdAt) return "";
    return createdAt.toDate().toLocaleDateString(lang === "st" ? "en-GB" : "en-GB", { day: "numeric", month: "short" });
  } catch (e) {
    return "";
  }
}

export const toMs = (createdAt) => {
  try { return createdAt ? createdAt.toMillis() : Infinity; } catch (e) { return 0; }
};

export const QUALITY = {
  A: { en: "Grade A – Best quality", st: "Boleng ba A – Bo botle ka ho fetisisa" },
  B: { en: "Grade B – Good quality", st: "Boleng ba B – Bo botle" },
  C: { en: "Grade C – Fair quality", st: "Boleng ba C – Bo tloaelehileng" },
};
