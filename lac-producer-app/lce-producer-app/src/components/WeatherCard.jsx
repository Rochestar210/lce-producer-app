import { useState, useEffect } from "react";
import axios from "axios";
import { Cloud, MapPin, ThermometerSun, Droplets, Wind, Clock, AlertTriangle } from "lucide-react";
import { useLocationCtx } from "../context/LocationContext";
import { weatherIcon as getWeatherIcon, weatherText } from "../lib/weatherCodes";
import "./WeatherCard.css";

export default function WeatherCard({ lang }) {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [hourly, setHourly] = useState([]);
  const [alerts, setAlerts] = useState([]); 
  const [error, setError] = useState("");

  const { district } = useLocationCtx();
  const { lat: LAT, lon: LON } = district;

  useEffect(() => {
    let cancelled = false;
    setWeather(null);
    setForecast([]);
    setHourly([]);
    setAlerts([]);
    setError("");

    axios
      .get("https://api.open-meteo.com/v1/forecast", {
        params: {
          latitude: LAT,
          longitude: LON,
          current: "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m",
          hourly: "temperature_2m,weather_code",
          daily: "temperature_2m_max,temperature_2m_min,weather_code",
          wind_speed_unit: "ms",
          timezone: "auto",
          forecast_days: 16,
        },
      })
      .then((res) => {
        if (cancelled) return;
        const c = res.data.current;
        setWeather({
          temp: c.temperature_2m,
          feels: c.apparent_temperature,
          humidity: c.relative_humidity_2m,
          wind: c.wind_speed_10m,
          code: c.weather_code,
        });

        const daily = res.data.daily;
        const dailyFormatted = daily.time.map((date, i) => ({
          date,
          max: Math.round(daily.temperature_2m_max[i]),
          min: Math.round(daily.temperature_2m_min[i]),
          code: daily.weather_code[i],
        }));
        setForecast(dailyFormatted);

        const h = res.data.hourly;
        const startIdx = Math.max(0, h.time.findIndex((t) => t >= c.time));
        const out = [];
        for (let i = startIdx; i < startIdx + 24 && i < h.time.length; i += 3) {
          out.push({
            time: new Date(h.time[i]).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            temp: Math.round(h.temperature_2m[i]),
            code: h.weather_code[i],
          });
        }
        setHourly(out);

        // --- SMART ALERTS LOGIC (Looking at the 16-day forecast) ---
        const newAlerts = [];
        
        // Look through the 16-day forecast for severe weather
        dailyFormatted.forEach((day) => {
          const dateStr = new Date(day.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
          
          // 1. Thunderstorms (Codes 95, 96, 99) or Heavy Rain (82)
          if (day.code >= 82 || (day.code >= 95 && day.code <= 99)) {
            newAlerts.push({
              title: lang === "st" ? "Tlhokomeliso ea Leholimo" : "Severe Weather Warning",
              message: lang === "st" 
                ? `Pula e matla kapa sealuma se lebelletsoe ka ${dateStr}. Sireletsa lijalo tsa hau.` 
                : `Heavy rain or storms expected on ${dateStr}. Protect your crops.`
            });
          }
          
          // 2. Extreme Heat (Max temp > 32)
          if (day.max > 32) {
            newAlerts.push({
              title: lang === "st" ? "Mocheso o Feteletseng" : "Extreme Heat Alert",
              message: lang === "st" 
                ? `Mocheso o phahameng haholo o lebelletsoe ka ${dateStr} (${day.max}°C). Nosetsa lijalo tsa hau.` 
                : `Very high temperatures expected on ${dateStr} (${day.max}°C). Water your crops.`
            });
          }

          // 3. Frost (Min temp < 2)
          if (day.min < 2) {
            newAlerts.push({
              title: lang === "st" ? "Serame se Lebelletsoe" : "Frost Warning",
              message: lang === "st" 
                ? `Serame se ka ba teng ka ${dateStr}. Sireletsa lijalo tse bonolo.` 
                : `Frost is possible on ${dateStr}. Protect sensitive crops.`
            });
          }
        });

        setAlerts(newAlerts);

        // --- POPUP NOTIFICATION ---
        if (newAlerts.length > 0) {
          setTimeout(() => {
            // Only show the first 2 alerts in the popup so it doesn't get too long
            const alertText = newAlerts.slice(0, 2).map(a => `⚠️ ${a.title}\n${a.message}`).join('\n\n');
            window.alert(`${lang === "st" ? "TLHOKOMELISO!" : "WEATHER ALERT!"}\n\n${alertText}`);
          }, 1000);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load current weather");
      });

    return () => { cancelled = true; };
  }, [LAT, LON, lang]);

  if (error) {
    return (
      <p className="weather-error">
        {lang === "st" ? "Ha hoa khoneha ho fumana boemo ba leholimo." : error}
      </p>
    );
  }

  if (!weather) {
    return (
      <p className="weather-loading">
        {lang === "st" ? "E ntse e kenya..." : "Loading weather..."}
      </p>
    );
  }

  return (
    <div>
      {/* --- ALERT BANNER --- */}
      {alerts.length > 0 && (
        <div className="weather-alert-banner" style={{
          backgroundColor: "#fef2f2",
          border: "2px solid #ef4444",
          borderRadius: "16px",
          padding: "16px",
          marginBottom: "16px",
          color: "#991b1b",
        }}>
          <h3 style={{ fontWeight: "bold", fontSize: "18px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertTriangle className="w-5 h-5" />
            {lang === "st" ? "Tlhokomeliso ea Leholimo" : "Weather Alerts"}
          </h3>
          {alerts.map((alert, index) => (
            <div key={index} style={{ marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid #fca5a5" }}>
              <p style={{ fontWeight: "bold", marginBottom: "2px" }}>{alert.title}</p>
              <p style={{ fontSize: "14px", lineHeight: "1.4" }}>{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* --- CURRENT WEATHER CARD --- */}
      <div className="weather-card">
        <h2 className="weather-title flex items-center gap-2">
          <MapPin className="w-5 h-5 text-green-300" />
          {lang === "st" ? "Boemo ba Leholimo" : "Current Weather"} • {district.name}
        </h2>

        <p className="weather-temperature">{Math.round(weather.temp)}°C</p>
        <p className="weather-description">{weatherText(weather.code, lang)}</p>

        <div className="weather-grid">
          <div className="weather-item flex flex-col items-center">
            <p className="flex items-center gap-1"><ThermometerSun className="w-4 h-4" /> {lang === "st" ? "E utloahala" : "Feels like"}</p>
            <p>{Math.round(weather.feels)}°</p>
          </div>
          <div className="weather-item flex flex-col items-center">
            <p className="flex items-center gap-1"><Droplets className="w-4 h-4" /> {lang === "st" ? "Mongobo" : "Humidity"}</p>
            <p>{weather.humidity}%</p>
          </div>
          <div className="weather-item flex flex-col items-center">
            <p className="flex items-center gap-1"><Wind className="w-4 h-4" /> {lang === "st" ? "Moea" : "Wind"}</p>
            <p>{weather.wind} m/s</p>
          </div>
        </div>
      </div>

      {/* --- HOURLY (3-HOUR) FORECAST --- */}
      {hourly.length > 0 && (
        <div className="forecast-container">
          <h3 className="forecast-title">
            <Clock className="w-5 h-5 text-green-600" />
            {lang === "st" ? "Boemo ba Lihora tse Tlang" : "Next 24 Hours (3-Hourly)"}
          </h3>
          <div className="forecast-scroll">
            {hourly.map((hour, index) => (
              <div key={index} className="forecast-item">
                <p className="forecast-day">{hour.time}</p>
                <div className="text-2xl my-1">{getWeatherIcon(hour.code)}</div>
                <p className="forecast-temp">{hour.temp}°</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- 16-DAY REAL FORECAST --- */}
      {forecast.length > 0 && (
        <div className="forecast-container">
          <h3 className="forecast-title">
            <Cloud className="w-5 h-5 text-green-600" />
            {lang === "st" ? "Boemo ba Matsatsi a Tlang" : "16-Day Real Forecast"}
          </h3>
          <div className="forecast-scroll">
            {forecast.map((day, index) => (
              <div key={index} className="forecast-item">
                <p className="forecast-day">
                  {new Date(day.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </p>
                <div className="text-2xl my-1">{getWeatherIcon(day.code)}</div>
                <p className="forecast-temp">{day.max}° <span className="text-gray-400 text-sm">{day.min}°</span></p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}