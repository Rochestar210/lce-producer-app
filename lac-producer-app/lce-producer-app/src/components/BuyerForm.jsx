import { useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { CROPS } from "../lib/locations";
import { QUALITY, money } from "../lib/market";
import { rememberPost } from "../lib/myPosts";
import "./BuyerForm.css";

const todayLocal = () =>
  new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

const emptyForm = () => ({
  name: "", quality: "A", quantity: "", pricePerKg: "",
  neededDate: todayLocal(), buyer: "", phone: "",
});

export default function BuyerForm({ lang }) {
  const t = (en, st) => (lang === "st" ? st : en);
  const [form, setForm] = useState(emptyForm());
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Total depends on quantity and the price for the chosen quality
  const total = Math.round(Number(form.quantity || 0) * Number(form.pricePerKg || 0) * 100) / 100;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    try {
      const ref = await addDoc(collection(db, "buyerOrders"), {
        name: form.name.trim(),
        quality: form.quality,
        quantity: Number(form.quantity),
        pricePerKg: Number(form.pricePerKg),
        totalAmount: total,
        neededDate: form.neededDate,
        buyer: form.buyer.trim(),
        phone: form.phone.trim(),
        createdAt: serverTimestamp(),
      });
      rememberPost("buyerOrders", ref.id);
      setForm(emptyForm());
      setSaved(true);
    } catch (err) {
      alert(t("Could not save. Check your internet and try again.",
              "Ha re khone ho boloka. Hlahloba inthanete 'me u leke hape."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bf-card">
      <div className="bf-heading">
        <h2>{t("Post What You Want to Buy", "Beha seo u batlang ho se reka")}</h2>
        <p>
          {t("Tell producers what you need, when you need it, and what you will pay. The price depends on the quantity and the quality.",
             "Bolella barekisi seo u se batlang, nako, le theko eo u tla e lefa. Theko e ipapisitse le palo le boleng.")}
        </p>
      </div>

      {saved && (
        <div className="bf-success">
          <span>{t("Your buy request has been posted!", "Kopo ea hau ea ho reka e behiloe!")}</span>
          <Link to="/market?tab=buyers">{t("View in Market →", "Sheba 'Marakeng →")}</Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bf-form">
        <label>
          {t("Vegetable", "Mofuta oa meroho")}
          <input required name="name" list="bf-crops" placeholder="e.g. Tomato"
            value={form.name} onChange={handleChange} />
          <datalist id="bf-crops">
            {CROPS.map((c) => <option key={c} value={c} />)}
          </datalist>
        </label>

        <label>
          {t("Quality wanted", "Boleng bo batloang")}
          <select name="quality" value={form.quality} onChange={handleChange}>
            {Object.entries(QUALITY).map(([k, v]) => (
              <option key={k} value={k}>{lang === "st" ? v.st : v.en}</option>
            ))}
          </select>
        </label>

        <div className="bf-two">
          <label>
            {t("Quantity (kg)", "Boima (kg)")}
            <input required name="quantity" type="number" min="0.1" step="any" placeholder="e.g. 50"
              value={form.quantity} onChange={handleChange} />
          </label>
          <label>
            {t("Price per kg (M)", "Theko ka kg (M)")}
            <input required name="pricePerKg" type="number" min="0.01" step="any" placeholder="e.g. 12"
              value={form.pricePerKg} onChange={handleChange} />
          </label>
        </div>

        <div className="bf-total">
          <span>{t("Total amount", "Kakaretso ea chelete")}</span>
          <strong>M {money(total)}</strong>
          <small>
            {form.quantity && form.pricePerKg
              ? `${form.quantity} kg × M${form.pricePerKg} (${t("Grade", "Boleng")} ${form.quality})`
              : t("Quantity × price per kg", "Boima × theko ka kg")}
          </small>
        </div>

        <label>
          {t("When do you want to buy?", "U batla ho reka neng?")}
          <input required name="neededDate" type="date" min={todayLocal()}
            value={form.neededDate} onChange={handleChange} />
        </label>

        <label>
          {t("Your name", "Lebitso la hau")}
          <input required name="buyer" type="text" placeholder={t("Enter your name", "Kenya lebitso la hau")}
            value={form.buyer} onChange={handleChange} />
        </label>

        <label>
          {t("Phone number", "Nomoro ea mohala")}
          <input required name="phone" type="tel" placeholder="e.g. 5812 3456"
            value={form.phone} onChange={handleChange} />
        </label>

        <button type="submit" className="bf-submit" disabled={loading}>
          {loading ? t("Posting...", "E ntse e romela...") : t("Post buy request", "Beha kopo ea ho reka")}
        </button>
      </form>
    </div>
  );
}
