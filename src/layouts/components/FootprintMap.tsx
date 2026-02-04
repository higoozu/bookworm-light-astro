import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import config from "@/config/footprints.json";

// Fix default icon issue with Webpack/Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface FootprintMapProps {
  postsData: Record<string, string>; // slug -> title mapping
}

const FootprintMap: React.FC<FootprintMapProps> = ({ postsData }) => {
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check for dark mode preference
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Fetch GeoJSON for countries
  useEffect(() => {
    fetch("https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json")
      .then((res) => res.json())
      .then((data) => setGeoJsonData(data))
      .catch((err) => console.error("Failed to load GeoJSON", err));
  }, []);

  // Style function for GeoJSON
  const countryStyle = (feature: any) => {
    const isVisited = config.visitedCountries.includes(feature.id);
    return {
      fillColor: isVisited ? "#1B8A62" : "transparent",
      weight: 1,
      opacity: 1,
      color: isDarkMode ? "#444" : "#ccc",
      fillOpacity: isVisited ? 0.6 : 0,
    };
  };

  const tileLayerUrl = isDarkMode
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

  return (
    <div className="h-full w-full z-0 relative">
      {/* Dark Mode Overrides for Leaflet Popups */}
      <style dangerouslySetInnerHTML={{ __html: `
        .dark .leaflet-popup-content-wrapper,
        .dark .leaflet-popup-tip {
          background-color: #051F18 !important;
          color: #f4f4f5 !important;
          border: 1px solid #A0A0A0;
        }
        .dark .leaflet-popup-content h3 {
          color: #ffffff !important;
        }
        .dark .leaflet-popup-content p {
          color: #D8D8D8 !important;
        }
        .dark .leaflet-container a.leaflet-popup-close-button {
          color: #A0A0A0 !important;
        }
      `}} />

       {/* Title Overlay - Higher z-index to be above map and popups */}
      <div className="absolute top-6 left-16 z-1000 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-4 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-700 max-w-xs transition-colors duration-300">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">My Travel Footprint</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
          Exploring the world, one city at a time.
          <br/>
          <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
            {config.visitedCountries.length} Countries visited
          </span>
        </p>
      </div>

      <MapContainer
        center={[20, 0]}
        zoom={3}
        scrollWheelZoom={true}
        className="h-full w-full outline-none z-0"
        minZoom={2.8}
        maxBounds={[[-90, -180], [90, 180]]}
      >
        <TileLayer
          attribution={attribution}
          url={tileLayerUrl}
        />

        {geoJsonData && (
          <GeoJSON
            data={geoJsonData}
            style={countryStyle}
          />
        )}

        {config.locations.map((loc, idx) => (
          <Marker key={idx} position={loc.coordinates as [number, number]}>
            <Popup className="custom-popup">
              <div className="p-1 min-w-50">
                <h3 className="text-lg font-bold mb-1 text-gray-900">{loc.name}</h3>
                <p className="text-[10px] text-gray-500 mb-2 uppercase tracking-widest font-semibold">{loc.country}</p>
                <p className="text-sm text-gray-700 mb-3 leading-snug">{loc.description}</p>
                
                {loc.relatedPosts && loc.relatedPosts.length > 0 && (
                  <div className="border-t pt-2 mt-2 border-gray-200 dark:border-zinc-700">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Related Stories</p>
                    <ul className="space-y-1.5">
                      {loc.relatedPosts.map((slug) => {
                         const title = postsData[slug];
                         if (!title) return null;
                         return (
                            <li key={slug}>
                              <a href={`/blog/${slug}/`} className="text-primary hover:text-primary/80 transition-colors text-sm font-medium flex items-start gap-2 group">
                                <span className="mt-1 text-[10px]">📄</span>
                                <span className="group-hover:underline">{title}</span>
                              </a>
                            </li>
                         );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default FootprintMap;