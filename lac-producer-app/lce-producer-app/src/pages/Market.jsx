import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Sprout, ShoppingCart } from "lucide-react";
import MarketList from "../components/MarketList";
import BuyerList from "../components/BuyerList";
import "./Market.css";

export default function Market({ lang }) {
  const t = (en, st) => (lang === "st" ? st : en);
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "buyers" ? "buyers" : "sale";
  const [search, setSearch] = useState("");
  const [counts, setCounts] = useState({ sale: null, buyers: null });

  const setTab = (name) => setParams(name === "buyers" ? { tab: "buyers" } : {});

  return (
    <div className="market-container">
      {/* Heading */}
      <div className="market-header">
        <h2>{t("Marketplace", "Mmaraka")}</h2>
        <p>
          {t("See vegetables for sale and what buyers are looking for. Tap WhatsApp to make a deal.",
             "Sheba meroho e rekisoang le seo bareki ba se batlang. Tobetsa WhatsApp ho etsa litumellano.")}
        </p>
      </div>

      {/* Search */}
      <div className="market-search">
        <Search />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("Search vegetable (e.g. tomato)", "Batla meroho (mohlala: tamati)")}
        />
      </div>

      {/* Tabs */}
      <div className="market-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === "sale"}
          className={`market-tab market-tab-sale ${tab === "sale" ? "active" : ""}`}
          onClick={() => setTab("sale")}
        >
          <Sprout />
          {t("For Sale", "E Rekisoa")}
          {counts.sale !== null && <span className="market-count">{counts.sale}</span>}
        </button>

        <button
          role="tab"
          aria-selected={tab === "buyers"}
          className={`market-tab market-tab-buyers ${tab === "buyers" ? "active" : ""}`}
          onClick={() => setTab("buyers")}
        >
          <ShoppingCart />
          {t("Buyers Wanted", "Bareki ba Batlang")}
          {counts.buyers !== null && <span className="market-count">{counts.buyers}</span>}
        </button>
      </div>

      {/* Both lists stay mounted so the counts are always up to date */}
      <div hidden={tab !== "sale"}>
        <MarketList lang={lang} search={search} onCount={(n) => setCounts((c) => ({ ...c, sale: n }))} />
      </div>
      <div hidden={tab !== "buyers"}>
        <BuyerList lang={lang} search={search} onCount={(n) => setCounts((c) => ({ ...c, buyers: n }))} />
      </div>
    </div>
  );
}
