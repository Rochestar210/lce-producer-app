
import { useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { rememberPost, rememberProduce } from "../lib/myPosts";
import { updateProduce } from "../notifications";
import "./PostProduce.css";

export default function PostProduce({ lang }) {
  const [form, setForm] = useState({
    name: "",
    quantity: "",
    pricePerKg: "",
    seller: "",
    phone: "",
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setSaved(false);

    try {
      const ref = await addDoc(collection(db, "listings"), {
        ...form,
        quantity: Number(form.quantity),
        pricePerKg: Number(form.pricePerKg),
        createdAt: serverTimestamp(),
      });
      rememberPost("listings", ref.id);
      updateProduce(rememberProduce(form.name));

      setForm({
        name: "",
        quantity: "",
        pricePerKg: "",
        seller: "",
        phone: "",
      });

      setSaved(true);
    } catch (error) {
      alert("Error saving to database. Check your Firebase config.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="produce-form-card">

      <div className="form-heading">
        <h2>{lang === "st" ? "Rekisa Meroho" : "Post Produce"}</h2>
        <p>
          {lang === "st"
            ? "Tlatsa lintlha tse ka tlase ho rekisa meroho ea hau."
            : "Complete the details below to list your vegetables for sale."}
        </p>
      </div>

      {saved && (
        <div className="success-message">
          <span>
            {lang === "st"
              ? "Meroho ea hau e bolokiloe ka katleho!"
              : "Your produce has been posted successfully!"}
          </span>
          <Link to="/market" className="success-link">
            {lang === "st" ? "Sheba 'Marakeng →" : "View in Market →"}
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="produce-form">

        <div className="form-group">
          <label>
            {lang === "st" ? "Mofuta oa meroho" : "Vegetable Name"}
          </label>
          <input
            required
            name="name"
            type="text"
            placeholder="e.g. Cabbage"
            value={form.name}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>
            {lang === "st" ? "Boima (kg)" : "Quantity (kg)"}
          </label>
          <input
            required
            name="quantity"
            type="number"
            min="0.1"
            step="any"
            placeholder="e.g. 5"
            value={form.quantity}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>
            {lang === "st" ? "Theko ka kg (M)" : "Price per kg (M)"}
          </label>
          <input
            required
            name="pricePerKg"
            type="number"
            min="0.01"
            step="any"
            placeholder="e.g. 10"
            value={form.pricePerKg}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>
            {lang === "st" ? "Lebitso la hau" : "Seller Name"}
          </label>
          <input
            required
            name="seller"
            type="text"
            placeholder={lang === "st" ? "Kenya lebitso la hau" : "Enter your name"}
            value={form.seller}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>
            {lang === "st" ? "Nomoro ea mohala" : "Phone Number"}
          </label>
          <input
            required
            name="phone"
            type="tel"
            placeholder="e.g. 57892929"
            value={form.phone}
            onChange={handleChange}
          />
        </div>

        <button
          type="submit"
          className="post-submit-btn"
          disabled={loading}
        >
          {loading
            ? (lang === "st" ? "E ntse e boloka..." : "Saving...")
            : (lang === "st" ? "Rekisa Meroho" : "Post Produce")}
        </button>

      </form>
    </div>
  );
}
