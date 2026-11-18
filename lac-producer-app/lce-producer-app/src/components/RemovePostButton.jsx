import { useState } from "react";
import { Trash2 } from "lucide-react";
import { db } from "../firebase";
import { doc, deleteDoc } from "firebase/firestore";
import { isMine, forgetPost } from "../lib/myPosts";

// Shown only on posts made from this phone. Deleting the document makes it
// disappear from the Market for everybody straight away (the lists are live).
//   col = "listings" (seller)  |  "buyerOrders" (buyer)
export default function RemovePostButton({ col, id, lang }) {
  const t = (en, st) => (lang === "st" ? st : en);
  const [busy, setBusy] = useState(false);

  if (!isMine(col, id)) return null;

  const seller = col === "listings";
  const label = seller
    ? t("Sold – remove from market", "E rekisitsoe – e tlose 'Marakeng")
    : t("I found what I need – remove", "Ke fumane seo ke se batlang – e tlose");
  const confirmText = seller
    ? t("Mark this produce as sold and remove it from the market?",
        "Tšoaea meroho ena e rekisitsoe 'me u e tlose 'Marakeng?")
    : t("You found what you need? Remove this request from the market?",
        "U fumane seo u se batlang? U batla ho tlosa kopo ena 'Marakeng?");

  const remove = async () => {
    if (!window.confirm(confirmText)) return;
    setBusy(true);
    try {
      await deleteDoc(doc(db, col, id));
      forgetPost(col, id);
    } catch (e) {
      setBusy(false);
      alert(t("Could not remove it. Check your internet and try again.",
              "Ha re khone ho e tlosa. Hlahloba inthanete 'me u leke hape."));
    }
  };

  return (
    <button type="button" className="mk-remove" onClick={remove} disabled={busy}>
      <Trash2 /> {busy ? t("Removing...", "E ntse e tlosoa...") : label}
    </button>
  );
}
