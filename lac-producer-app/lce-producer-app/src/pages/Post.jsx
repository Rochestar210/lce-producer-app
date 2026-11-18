import { useState } from "react";
import { Sprout, ShoppingCart } from "lucide-react";
import PostProduce from "../components/PostProduce";
import BuyerForm from "../components/BuyerForm";
import "./Post.css";

export default function Post({ lang }) {
  const t = (en, st) => (lang === "st" ? st : en);
  const [role, setRole] = useState("seller"); // "seller" | "buyer"

  return (
    <div className={`post-container role-${role}`}>

      {/* Page heading */}
      <div className="post-header">
        <h2>{t("Post to the Market", "Beha 'Marakeng")}</h2>
        <p>
          {t("Choose what you want to do. Everything you post appears in the Market for others to see.",
             "Khetha seo u batlang ho se etsa. Se seng le se seng seo u se behang se hlaha 'Marakeng.")}
        </p>
      </div>

      {/* The two choices */}
      <div className="role-grid">
        <button
          type="button"
          className={`role-btn role-btn-seller ${role === "seller" ? "active" : ""}`}
          onClick={() => setRole("seller")}
          aria-pressed={role === "seller"}
        >
          <span className="role-icon"><Sprout /></span>
          <span className="role-title">{t("I'm a Seller", "Ke Morekisi")}</span>
          <span className="role-desc">{t("Post the vegetables you sell", "Beha meroho eo u e rekisang")}</span>
        </button>

        <button
          type="button"
          className={`role-btn role-btn-buyer ${role === "buyer" ? "active" : ""}`}
          onClick={() => setRole("buyer")}
          aria-pressed={role === "buyer"}
        >
          <span className="role-icon"><ShoppingCart /></span>
          <span className="role-title">{t("I'm a Buyer", "Ke Moreki")}</span>
          <span className="role-desc">{t("Post what you want to buy", "Beha seo u batlang ho se reka")}</span>
        </button>
      </div>

      {/* The form for the chosen role */}
      <div className="post-form-wrapper">
        {role === "seller" ? <PostProduce lang={lang} /> : <BuyerForm lang={lang} />}
      </div>
    </div>
  );
}
