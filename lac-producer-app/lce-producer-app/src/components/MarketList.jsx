import { useState, useEffect } from "react";
import { MessageCircle, Phone, Package, User } from "lucide-react";
import { db } from "../firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import { money, waLink, telLink, postedOn, toMs } from "../lib/market";
import RemovePostButton from "./RemovePostButton";
import "./MarketList.css";

// Produce that sellers have posted
export default function MarketList({ lang, search = "", onCount }) {
  const t = (en, st) => (lang === "st" ? st : en);
  const [listings, setListings] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "listings"));
    return onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      rows.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt)); // newest first
      setListings(rows);
      if (onCount) onCount(rows.length);
    });
    // eslint-disable-next-line
  }, []);

  const shown = listings.filter((l) =>
    String(l.name || "").toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="mk-list">
      {shown.length === 0 && (
        <p className="mk-empty">
          {listings.length === 0
            ? t("No produce listed yet.", "Ha ho na meroho hona joale.")
            : t("Nothing matches your search.", "Ha ho letho le tsamaellanang le seo u se batlileng.")}
        </p>
      )}

      {shown.map((item) => (
        <article key={item.id} className="mk-card mk-card-sell">
          <div className="mk-top">
            <h4 className="mk-name">{item.name}</h4>
            <span className="mk-price">M{money(item.pricePerKg)}<small>/kg</small></span>
          </div>

          <div className="mk-chips">
            <span className="mk-chip"><Package /> {item.quantity} kg {t("available", "e teng")}</span>
            <span className="mk-chip mk-chip-green">
              {t("Total value", "Boleng bohle")} M{money(Number(item.quantity) * Number(item.pricePerKg))}
            </span>
          </div>

          <p className="mk-person">
            <User /> {item.seller} • {item.phone}
            {postedOn(item.createdAt, lang) && <span className="mk-date"> • {postedOn(item.createdAt, lang)}</span>}
          </p>

          <div className="mk-contact">
            <a className="mk-wa mk-wa-green" target="_blank" rel="noreferrer"
              href={waLink(item.phone, `Hello, I want to buy your ${item.name}`)}>
              <MessageCircle /> WhatsApp
            </a>
            <a className="mk-wa mk-wa-call" href={telLink(item.phone)}>
              <Phone /> {t("Call seller", "Letsetsa morekisi")}
            </a>
          </div>

          <RemovePostButton col="listings" id={item.id} lang={lang} />
        </article>
      ))}
    </div>
  );
}
