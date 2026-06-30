"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix standard marker icon issue by declaring custom SVGs
const customerIcon = L.divIcon({
  html: `
    <div class="relative w-8 h-8 flex items-center justify-center">
      <div class="absolute w-6 h-6 rounded-full bg-indigo-500/30 animate-ping"></div>
      <div class="absolute w-4 h-4 rounded-full bg-indigo-650 border-2 border-white shadow-md"></div>
    </div>
  `,
  className: "custom-leaflet-icon",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const providerIcon = L.divIcon({
  html: `
    <div class="relative w-8 h-8 flex items-center justify-center">
      <div class="absolute w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-md"></div>
      <div class="absolute -bottom-1 w-2 h-2 rotate-45 bg-emerald-500 border-r border-b border-white"></div>
    </div>
  `,
  className: "custom-leaflet-icon",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const techIcon = L.divIcon({
  html: `
    <div class="relative w-10 h-10 flex items-center justify-center">
      <div class="absolute w-8 h-8 rounded-full bg-cyan-400/40 animate-ping"></div>
      <div class="w-6 h-6 rounded-full bg-slate-900 border-2 border-cyan-400 flex items-center justify-center shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-3.5 h-3.5 text-cyan-400 animate-pulse" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
          <circle cx="7" cy="17" r="2"/>
          <path d="M9 17h6"/>
          <circle cx="17" cy="17" r="2"/>
        </svg>
      </div>
    </div>
  `,
  className: "custom-leaflet-icon",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

interface MapComponentProps {
  center: [number, number];
  zoom?: number;
  customerMarker?: [number, number];
  providerMarkers?: Array<{
    id: string;
    lat: number;
    lng: number;
    name: string;
    category: string;
    rate: number;
    rating: number;
  }>;
  routeCoordinates?: Array<[number, number]>;
  techMarker?: [number, number];
  theme?: "light" | "dark";
}

// Controller to auto-center map when props change
function MapController({ center, bounds }: { center: [number, number]; bounds?: L.LatLngBounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [40, 40] });
    } else {
      map.setView(center, map.getZoom());
    }
  }, [center, bounds, map]);
  return null;
}

export default function MapComponent({
  center,
  zoom = 13,
  customerMarker,
  providerMarkers = [],
  routeCoordinates = [],
  techMarker,
  theme = "dark",
}: MapComponentProps) {
  // Compute fitting boundaries if there are multiple markers
  let bounds: L.LatLngBounds | undefined = undefined;
  if (customerMarker || techMarker || providerMarkers.length > 0) {
    const points: L.LatLngExpression[] = [];
    if (customerMarker) points.push(customerMarker);
    if (techMarker) points.push(techMarker);
    providerMarkers.forEach((p) => points.push([p.lat, p.lng]));
    if (points.length > 1) {
      bounds = L.latLngBounds(points);
    }
  }

  const tileUrl =
    theme === "dark"
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const attribution =
    theme === "dark"
      ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  return (
    <div className="w-full h-full min-h-[300px] rounded-2xl overflow-hidden relative border border-white/5 shadow-2xl bg-slate-950">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
      >
        <TileLayer url={tileUrl} attribution={attribution} />
        
        {/* Customer Location */}
        {customerMarker && (
          <Marker position={customerMarker} icon={customerIcon}>
            <Popup className="custom-leaflet-popup">
              <div className="p-1 text-slate-200">
                <span className="font-bold text-xs">Your Address</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Nearby Professionals */}
        {providerMarkers.map((pro) => (
          <Marker key={pro.id} position={[pro.lat, pro.lng]} icon={providerIcon}>
            <Popup className="custom-leaflet-popup">
              <div className="p-1 text-slate-200 text-xs flex flex-col gap-1 text-left">
                <span className="font-bold text-slate-100">{pro.name}</span>
                <span className="text-[10px] text-indigo-400 font-bold uppercase">{pro.category}</span>
                <span className="text-[10px] text-slate-400">★ {pro.rating} • ₹{pro.rate}/hr</span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Route Line Tracing */}
        {routeCoordinates.length > 0 && (
          <Polyline
            positions={routeCoordinates}
            pathOptions={{
              color: "#6366f1",
              weight: 4,
              opacity: 0.8,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        )}

        {/* Live Technician tracking */}
        {techMarker && (
          <Marker position={techMarker} icon={techIcon}>
            <Popup className="custom-leaflet-popup">
              <div className="p-1 text-slate-200 text-xs flex flex-col gap-0.5">
                <span className="font-bold text-cyan-400">Technician Ramesh Patel</span>
                <span className="text-[10px] text-slate-400">Heading to your location...</span>
              </div>
            </Popup>
          </Marker>
        )}

        <MapController center={center} bounds={bounds} />
      </MapContainer>
    </div>
  );
}
