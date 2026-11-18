import WeatherCard from "../components/WeatherCard";
import LocationPicker from "../components/LocationPicker";

export default function Weather({ lang }) {
  return (
    <div className="space-y-6 animate-page">
      <LocationPicker lang={lang} />
      <WeatherCard lang={lang} />
    </div>
  );
}
