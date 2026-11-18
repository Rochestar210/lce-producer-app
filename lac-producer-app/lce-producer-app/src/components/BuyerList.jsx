import { useState, useEffect } from "react";
import { MessageCircle, Phone, Package, User, CalendarDays } from "lucide-react";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { money, waLink, telLink, postedOn } from "../lib/market";
import RemovePostButton from "./RemovePostButton";
import "./MarketList.css";

// Buy requests that buyers have posted
export default function BuyerList({ lang, search = "", onCount }) {
  const t = (en, st) => (lang === "st" ? st : en);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "buyerOrders"), orderBy("createdAt", "desc"), limit(50));
    return onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOrders(rows);
      if (onCount) onCount(rows.length);
    });
    // eslint-disable-next-line
  }, []);

  const shown = orders.filter((o) =>
    String(o.name || "").toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="mk-list">
      {shown.length === 0 && (
        <p className="mk-empty">
          {orders.length === 0
            ? t("No buy requests yet.", "Ha ho likopo tsa ho reka hajoale.")
            : t("Nothing matches your search.", "Ha ho letho le tsamaellanang le seo u se batlileng.")}
        </p>
      )}

      {shown.map((o) => (
        <article key={o.id} className="mk-card mk-card-buy">
          <div className="mk-top">
            <h4 className="mk-name">{o.name}</h4>
            <span className={`mk-grade mk-grade-${o.quality}`}>{t("Grade", "Boleng")} {o.quality}</span>
          </div>

          <div className="mk-buy-total">
            <span>{t("Will pay in total", "O tla lefa ka kakaretso")}</span>
            <strong>M{money(o.totalAmount)}</strong>
            <small>{o.quantity} kg × M{money(o.pricePerKg)}/kg</small>
          </div>

          <div className="mk-chips">
            <span className="mk-chip"><Package /> {o.quantity} kg</span>
            <span className="mk-chip mk-chip-green"><CalendarDays /> {t("Needed", "E hlokahala")} {o.neededDate}</span>
          </div>

          <p className="mk-person">
            <User /> {o.buyer} • {o.phone}
            {postedOn(o.createdAt, lang) && <span className="mk-date"> • {postedOn(o.createdAt, lang)}</span>}
          </p>

          <div className="mk-contact">
            <a className="mk-wa mk-wa-green" target="_blank" rel="noreferrer"
              href={waLink(o.phone, `Hello ${o.buyer}, I have ${o.name} to sell.`)}>
              <MessageCircle /> WhatsApp
            </a>
            <a className="mk-wa mk-wa-call" href={telLink(o.phone)}>
              <Phone /> {t("Call buyer", "Letsetsa moreki")}
            </a>
          </div>

          <RemovePostButton col="buyerOrders" id={o.id} lang={lang} />
        </article>
      ))}
    </div>
  );
}
