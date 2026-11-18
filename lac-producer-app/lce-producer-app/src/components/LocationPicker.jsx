import { MapPin, Locate } from "lucide-react";
import { DISTRICTS } from "../lib/locations";
import { useLocationCtx } from "../context/LocationContext";
import "./Alerts.css";

export default function LocationPicker({ lang }) {
  const { districtId, district, source, status, detect, setManual } = useLocationCtx();
  const t = (en, st) => (lang === "st" ? st : en);

  let note = "";
  if (status === "detecting") note = t("Finding your location...", "E batla sebaka sa hau...");
  else if (status === "denied") note = t("Location is blocked. Choose your district below.", "Sebaka se thibetsoe. Khetha setereke sa hau ka tlase.");
  else if (status === "outside") note = t("You seem to be outside Lesotho. Choose your district below.", "U bonahala u kantle ho Lesotho. Khetha setereke sa hau.");
  else if (status === "error" || status === "unsupported") note = t("Could not detect your location. Choose your district below.", "Ha re khone ho fumana sebaka sa hau. Khetha setereke sa hau.");
  else if (source === "gps") note = t("Detected from your phone's location", "E fumanoe ho tsoa sebakeng sa mohala oa hau");

  return (
    <div className="al-card">
      <div className="al-title">
        <MapPin />
        <span>{t("Your location", "Sebaka sa hau")}: {district.name}</span>
      </div>

      {note && <p className="al-note">{note}</p>}

      <div className="al-row">
        <select
          className="al-select"
          value={districtId}
          onChange={(e) => setManual(e.target.value)}
          aria-label={t("District", "Setereke")}
        >
          {Object.entries(DISTRICTS).map(([id, d]) => (
            <option key={id} value={id}>{d.name}</option>
          ))}
        </select>

        <button className="al-btn al-btn-primary" onClick={detect} disabled={status === "detecting"}>
          <Locate />
          {t("Use my location", "Sebaka sa ka")}
        </button>
      </div>
    </div>
  );
}
