// Remembers which listings / buy requests were posted from THIS phone, so only
// the person who posted something sees the "remove from market" button on it.
const KEY = "lce_my_posts";

const read = () => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    return { listings: v?.listings || [], buyerOrders: v?.buyerOrders || [] };
  } catch (e) {
    return { listings: [], buyerOrders: [] };
  }
};

const write = (v) => {
  try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {}
};

export function rememberPost(col, id) {
  const v = read();
  if (!v[col].includes(id)) v[col].push(id);
  write(v);
}

export const isMine = (col, id) => read()[col].includes(id);

export function forgetPost(col, id) {
  const v = read();
  v[col] = v[col].filter((x) => x !== id);
  write(v);
}

// The vegetables this phone's owner sells (used to send "a buyer wants this" alerts).
const PRODUCE_KEY = "lce_my_produce";

export const myProduce = () => {
  try { return JSON.parse(localStorage.getItem(PRODUCE_KEY)) || []; } catch (e) { return []; }
};

export function rememberProduce(name) {
  const n = String(name || "").trim().toLowerCase();
  if (!n) return myProduce();
  const list = myProduce();
  if (!list.includes(n)) list.push(n);
  const next = list.slice(-20);
  try { localStorage.setItem(PRODUCE_KEY, JSON.stringify(next)); } catch (e) {}
  return next;
}
