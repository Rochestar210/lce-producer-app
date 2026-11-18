
import LocationPicker from "../components/LocationPicker";
import AlertSettings from "../components/AlertSettings";
import "./Home.css";

export default function Home({ lang }) {
  return (
    <div className="home-container">

      {/* Welcome Section */}
      <div className="home-welcome">

        <span className="home-tag">
          {lang === "st" ? "LAC Balemi" : "LAC Producers"}
        </span>

        <h2>
          {lang === "st" ? "Kea leboha!" : "Welcome!"}
        </h2>

        <p>
          {lang === "st"
            ? "Rea u amohela ho LAC Balemi. Rekisa meroho ea hau 'marakeng."
            : "Welcome to LAC Producers. Connect with buyers and sell your vegetables."}
        </p>

      </div>

      <LocationPicker lang={lang} />
      <AlertSettings lang={lang} />

      {/* Platform Information */}
      <div className="home-info">

        <h3>
          {lang === "st" ? "Mmaraka oa rona" : "Our Marketplace"}
        </h3>

        <p>
          {lang === "st"
            ? "Sethala se u thusa ho bontša meroho ea hau le ho hokahana le bareki."
            : "Our platform helps you showcase your vegetables and connect with potential buyers."}
        </p>

      </div>

    </div>
  );
}
