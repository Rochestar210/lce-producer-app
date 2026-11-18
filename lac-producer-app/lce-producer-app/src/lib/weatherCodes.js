// WMO weather codes (Open-Meteo) -> text and emoji.
export function weatherIcon(code) {
  if (code === 0) return "☀️";
  if (code === 1 || code === 2) return "⛅";
  if (code === 3) return "☁️";
  if (code >= 45 && code <= 48) return "🌫️";
  if (code >= 51 && code <= 67) return "🌧️";
  if (code >= 71 && code <= 77) return "❄️";
  if (code >= 80 && code <= 82) return "🌦️";
  if (code >= 85 && code <= 86) return "❄️";
  if (code >= 95) return "⛈️";
  return "☁️";
}

export function weatherText(code, lang) {
  const st = lang === "st";
  if (code === 0) return st ? "Le hlakile" : "Clear sky";
  if (code === 1 || code === 2) return st ? "Maru a seng makae" : "Few clouds";
  if (code === 3) return st ? "Le koahetsoe ke maru" : "Overcast";
  if (code >= 45 && code <= 48) return st ? "Moholi" : "Fog";
  if (code >= 51 && code <= 57) return st ? "Pula e nyenyane" : "Drizzle";
  if (code >= 61 && code <= 67) return st ? "Pula" : "Rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return st ? "Lehloa" : "Snow";
  if (code >= 80 && code <= 82) return st ? "Pula ea li-shower" : "Rain showers";
  if (code >= 95) return st ? "Lialuma le pula" : "Thunderstorm";
  return st ? "Maru" : "Cloudy";
}
