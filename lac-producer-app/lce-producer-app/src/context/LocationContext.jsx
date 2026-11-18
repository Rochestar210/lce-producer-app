import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { DISTRICTS, DEFAULT_DISTRICT, OUTSIDE_KM, nearestDistrict } from "../lib/locations";

const LocationCtx = createContext(null);
const KEY = "lce_location";

function loadSaved() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && DISTRICTS[s.id]) return s;
  } catch (e) {}
  return null;
}

export function LocationProvider({ children }) {
  const saved = useRef(loadSaved()).current;
  const [loc, setLoc] = useState(saved || { id: DEFAULT_DISTRICT, source: "default" });
  // idle | detecting | ok | denied | outside | unsupported | error
  const [status, setStatus] = useState("idle");

  const choose = useCallback((id, source) => {
    if (!DISTRICTS[id]) return;
    const next = { id, source };
    setLoc(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch (e) {}
  }, []);

  // Ask the phone where it is and pick the nearest district.
  const detect = useCallback(() => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setStatus("unsupported");
        return resolve(false);
      }
      setStatus("detecting");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { id, km } = nearestDistrict(pos.coords.latitude, pos.coords.longitude);
          if (km > OUTSIDE_KM) {
            setStatus("outside");
            return resolve(false);
          }
          choose(id, "gps");
          setStatus("ok");
          resolve(true);
        },
        (err) => {
          setStatus(err.code === 1 ? "denied" : "error");
          resolve(false);
        },
        { timeout: 10000, maximumAge: 600000 }
      );
    });
  }, [choose]);

  // First visit: detect automatically. Returning GPS users: refresh quietly
  // (so someone who travelled from Maseru to Mokhotlong is updated).
  useEffect(() => {
    if (!saved || saved.source === "gps") detect();
    // eslint-disable-next-line
  }, []);

  const value = {
    districtId: loc.id,
    district: DISTRICTS[loc.id],
    source: loc.source,
    status,
    detect,
    setManual: (id) => { choose(id, "manual"); setStatus("idle"); },
  };

  return <LocationCtx.Provider value={value}>{children}</LocationCtx.Provider>;
}

export const useLocationCtx = () => useContext(LocationCtx);
