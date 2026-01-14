import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import { Icon, LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

// Re-export everything needed from leaflet/react-leaflet
export { MapContainer, TileLayer, Marker, Popup, useMapEvents };
export type { LatLngExpression };

export const defaultIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export const SPITALFIELDS_CENTER: [number, number] = [51.5197, -0.0754];
