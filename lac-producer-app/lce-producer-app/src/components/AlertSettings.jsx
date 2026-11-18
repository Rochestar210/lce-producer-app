import { useState, useEffect } from "react";
import { Bell, BellOff, Download, Send } from "lucide-react";
import { useLocationCtx } from "../context/LocationContext";
import "./Alerts.css";
import {
  pushSupported, isIOS, isStandalone, savedToken, enableAlerts, disableAlerts,
  saveSubscription, listenForeground, sendTestAlert, showLocalNotification,
} from "../notifications";

export default function AlertSettings({ lang }) {
  const t = (en, st) => (lang === "st" ? st : en);
  const { districtId, district } = useLocationCtx();

  const [supported, setSupported] = useState(true);
  const [on, setOn] = useState(
    () => !!savedToken() && "Notification" in window && Notification.permission === "granted"
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [installEvt, setInstallEvt] = useState(null);

  useEffect(() => { pushSupported().then(setSupported); }, []);

  // "Install app" button (Android / Chrome)
  useEffect(() => {
    const h = (e) => { e.preventDefault(); setInstallEvt(e); };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);

  // Show alerts that arrive while the app is open
  useEffect(() => (on ? listenForeground() : undefined), [on]);

  // Keep the saved subscription in step with district / language / crops.
  // This is what makes alerts follow someone who moves from Maseru to Mokhotlong.
  useEffect(() => {
    const token = savedToken();
    if (on && token) {
      // crops: [] = price alerts for all vegetables
      saveSubscription(token, { district: districtId, crops: [], lang }).catch(() => {});
    }
  }, [on, districtId, lang]);

  const errorText = (code) => {
    if (code === "denied")
      return t("Notifications are blocked. Allow them in your browser/phone settings and try again.",
               "Litsebiso li thibetsoe. Li lumelle ka har'a litlhophiso tsa mohala 'me u leke hape.");
    if (code === "no-token")
      return t("Could not register this phone for alerts. Check your internet and try again.",
               "Ha re khone ho ngolisa mohala ona bakeng sa litlhokomelo. Hlahloba inthanete 'me u leke hape.");
    if (/permission|insufficient/i.test(code || ""))
      return t("The database did not allow saving your alert settings. Deploy the updated Firestore rules (see README).",
               "Database ha e a lumella ho boloka litlhophiso tsa hau. Kenya melao e mecha ea Firestore (sheba README).");
    return t("Could not turn on alerts. Check your internet and try again.",
             "Ha re khone ho bulela litlhokomelo. Hlahloba inthanete 'me u leke hape.");
  };

  const turnOn = async () => {
    setBusy(true); setMsg("");
    try {
      await enableAlerts({ district: districtId, crops: [], lang });
      setOn(true);
      setMsg(t("Alerts are on. You will be notified of weather and price changes.",
               "Litlhokomelo li butsoe. U tla tsebisoa ka phetoho ea leholimo le theko."));
      // Instant confirmation on this phone, so you can see alerts are working
      showLocalNotification(
        t("LAC Producers", "LAC Balemi"),
        t("Alerts are on for " + district.name + ".", "Litlhokomelo li butsoe bakeng sa " + district.name + ".")
      ).catch(() => {});
    } catch (e) {
      console.error("enableAlerts failed:", e);
      setMsg(errorText(e.message));
    }
    setBusy(false);
  };

  const turnOff = async () => {
    setBusy(true); setMsg("");
    await disableAlerts();
    setOn(false);
    setBusy(false);
  };

  const test = async () => {
    setBusy(true); setMsg("");
    try {
      await sendTestAlert();
      setMsg(t("Test alert sent. It should arrive in a few seconds.", "Tlhokomeliso ea teko e romiloe."));
    } catch (e) {
      // The server function is not reachable: still prove that this phone can show alerts.
      try {
        await showLocalNotification(
          t("LAC Producers", "LAC Balemi"),
          t("Test alert from this phone.", "Tlhokomeliso ea teko ho tsoa mohaleng ona.")
        );
        setMsg(t("This phone can show alerts, but the server alert function is not deployed yet, so no automatic weather/price alerts will arrive until it is (see README step 3).",
                 "Mohala ona o ka bontša litlhokomelo, empa function ea server ha e so kenngoa, ka lebaka leo litlhokomelo tsa leholimo/theko li ke ke tsa fihla ho fihlela e kenngoa (sheba README)."));
      } catch (e2) {
        setMsg(t("Test failed. Is the alert function deployed?", "Teko e hlolehile."));
      }
    }
    setBusy(false);
  };

  const install = async () => {
    installEvt.prompt();
    await installEvt.userChoice;
    setInstallEvt(null);
  };

  const needsHomeScreen = isIOS() && !isStandalone();

  return (
    <div className="al-card">
      <div className="al-title">
        <Bell className="w-5 h-5" />
        {t("Weather & price alerts", "Litlhokomelo tsa leholimo le theko")}
      </div>

      <p className="al-text">
        {t(`Get a phone notification when frost, heavy rain, snow, heat or strong wind is coming to ${district.name}, or when vegetable prices change.`,
           `Fumana tsebiso mohaleng ha serame, pula e ngata, lehloa, mocheso kapa moea o matla li tla ${district.name}, kapa ha theko ea meroho e fetoha.`)}
      </p>

      {/* Actions */}
      <div className="al-actions">
        {on ? (
          <>
            <button onClick={turnOff} disabled={busy}
              className="al-btn al-btn-gray">
              <BellOff className="w-4 h-4" /> {t("Turn off alerts", "Tima litlhokomelo")}
            </button>
            <button onClick={test} disabled={busy}
              className="al-btn al-btn-soft">
              <Send className="w-4 h-4" /> {t("Send test alert", "Roma teko")}
            </button>
          </>
        ) : (
          <button onClick={turnOn} disabled={busy || !supported}
            className="al-btn al-btn-primary">
            <Bell className="w-4 h-4" /> {t("Turn on alerts", "Bula litlhokomelo")}
          </button>
        )}

        {installEvt && (
          <button onClick={install}
            className="al-btn al-btn-outline">
            <Download className="w-4 h-4" /> {t("Install app", "Kenya app")}
          </button>
        )}
      </div>

      {needsHomeScreen && (
        <p className="al-warn">
          {t("iPhone: tap Share, then “Add to Home Screen”, and open the app from your home screen to receive alerts.",
             "iPhone: tobetsa Share, ebe “Add to Home Screen”, 'me u bule app ho tsoa skrineng sa hau.")}
        </p>
      )}
      {!supported && !needsHomeScreen && (
        <p className="al-note">
          {t("This browser does not support push alerts. Try Chrome.", "Sebatli sena ha se tšehetse litsebiso. Leka Chrome.")}
        </p>
      )}
      {msg && <p className="al-note">{msg}</p>}
    </div>
  );
}
