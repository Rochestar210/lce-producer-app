import { useState } from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Sprout, Globe } from "lucide-react";

import Home from "./pages/Home";
import Weather from "./pages/Weather";
import Market from "./pages/Market";
import Post from "./pages/Post";

import Navbar from "./components/Navbar";
import { LocationProvider } from "./context/LocationContext";

export default function App() {
  const [lang, setLang] = useState("en");

  return (
    <LocationProvider>
      <Router>
        <div className="app-shell">

          {/* Menu bar (fixed at the top) */}
          <Navbar lang={lang} />

          {/* Header with the language button */}
          <header className="app-header">
            <div className="app-header-inner">
              <div className="app-title">
                <Sprout />
                <h1>{lang === "st" ? "LAC Balemi" : "LAC Producers"}</h1>
              </div>

              <button className="lang-btn" onClick={() => setLang(lang === "en" ? "st" : "en")}>
                <Globe />
                {lang === "en" ? "Sesotho" : "English"}
              </button>
            </div>
          </header>

          {/* Pages */}
          <main className="app-main">
            <Routes>
              <Route path="/" element={<Home lang={lang} />} />
              <Route path="/weather" element={<Weather lang={lang} />} />
              <Route path="/market" element={<Market lang={lang} />} />
              <Route path="/post" element={<Post lang={lang} />} />
            </Routes>
          </main>

        </div>
      </Router>
    </LocationProvider>
  );
}
