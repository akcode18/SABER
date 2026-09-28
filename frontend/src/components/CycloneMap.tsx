"use client";

import React, { useEffect, useRef, useState } from "react";
import { Compass, Wind, ShieldAlert, AlertCircle, Waves, Clock } from "lucide-react";

interface StormProperties {
  vmax_knots?: number;
  mslp_hpa?: number;
  category?: string;
  timestamp?: string;
}

interface DistrictAlert {
  district: string;
  state: string;
  coordinates: [number, number];
  closest_approach_km: number;
  eta_hours: number;
  estimated_sustained_wind_kt: number;
  estimated_surge_m: number;
  alert_level: "RED" | "ORANGE" | "YELLOW";
  action_required: string;
}

export default function CycloneMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [stormData, setStormData] = useState<any>(null);
  const [landfallData, setLandfallData] = useState<DistrictAlert[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch GeoJSON and Landfall Risk Concurrently
  useEffect(() => {
    Promise.all([
      fetch("http://localhost:8000/api/v1/storms/SABER-BAY-2026-01/geojson").then((r) => r.json()),
      fetch("http://localhost:8000/api/v1/storms/SABER-BAY-2026-01/landfall-risk").then((r) => r.json()),
    ])
      .then(([geoJson, landfall]) => {
        setStormData(geoJson);
        setLandfallData(landfall.district_alerts || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load pipeline data:", err);
        setLoading(false);
      });
  }, []);

  // 2. Initialize MapLibre with Survey of India border and storm track
  useEffect(() => {
    if (!mapContainer.current || !stormData) return;

    const linkId = "maplibre-css";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css";
      document.head.appendChild(link);
    }

    const scriptId = "maplibre-js";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    const initMap = () => {
      const maplibregl = (window as any).maplibregl;
      if (!maplibregl || !mapContainer.current) return;

      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
        center: [82.0, 19.0],
        zoom: 4.6,
      });

      map.on("load", () => {
        // Survey of India sovereign border overlay
        map.addSource("india-official-boundary", {
          type: "geojson",
          data: "https://raw.githubusercontent.com/datameet/maps/master/Country/india-composite.geojson",
        });

        map.addLayer({
          id: "india-official-fill",
          type: "fill",
          source: "india-official-boundary",
          paint: { "fill-color": "#38bdf8", "fill-opacity": 0.03 },
        });

        map.addLayer({
          id: "india-official-border-line",
          type: "line",
          source: "india-official-boundary",
          paint: { "line-color": "#38bdf8", "line-width": 1.6, "line-opacity": 0.9 },
        });

        // Cyclone GeoJSON Source
        map.addSource("cyclone-source", { type: "geojson", data: stormData });

        // Uncertainty Cone (Fill)
        map.addLayer({
          id: "uncertainty-cone-fill",
          type: "fill",
          source: "cyclone-source",
          filter: ["==", "layer_type", "cone_of_uncertainty"],
          paint: { "fill-color": "#f59e0b", "fill-opacity": 0.25 },
        });

        // Uncertainty Cone (Border)
        map.addLayer({
          id: "uncertainty-cone-line",
          type: "line",
          source: "cyclone-source",
          filter: ["==", "layer_type", "cone_of_uncertainty"],
          paint: { "line-color": "#f59e0b", "line-width": 1.5, "line-dasharray": [3, 2] },
        });

        // Forecast Line
        map.addLayer({
          id: "trajectory-path",
          type: "line",
          source: "cyclone-source",
          filter: ["==", "layer_type", "forecast_track"],
          paint: { "line-color": "#ef4444", "line-width": 3 },
        });

        // Observation Points
        map.addLayer({
          id: "storm-obs-glow",
          type: "circle",
          source: "cyclone-source",
          filter: ["==", "layer_type", "observation"],
          paint: { "circle-radius": 16, "circle-color": "#ef4444", "circle-opacity": 0.35 },
        });

        map.addLayer({
          id: "storm-obs-point",
          type: "circle",
          source: "cyclone-source",
          filter: ["==", "layer_type", "observation"],
          paint: {
            "circle-radius": 6,
            "circle-color": "#ffffff",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ef4444",
          },
        });

        // Observation Tooltip
        map.on("click", "storm-obs-point", (e: any) => {
          if (!e.features || !e.features[0]) return;
          const coords = e.features[0].geometry.coordinates.slice();
          const props = e.features[0].properties;

          new maplibregl.Popup({ offset: 12 })
            .setLngLat(coords)
            .setHTML(
              `<div style="color: #0f172a; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 13px; line-height: 1.5; padding: 4px;">
                <div style="font-weight: 700; color: #dc2626; margin-bottom: 2px;">${props.category || "Cyclone Observation"}</div>
                <div><strong>Wind Speed:</strong> ${props.vmax_knots} kt</div>
                <div><strong>Central Pressure:</strong> ${props.mslp_hpa} hPa</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 4px;"><strong>Observed:</strong> ${new Date(props.timestamp).toUTCString()}</div>
              </div>`
            )
            .addTo(map);
        });

        map.on("mouseenter", "storm-obs-point", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "storm-obs-point", () => {
          map.getCanvas().style.cursor = "";
        });
      });
    };

    if (!(window as any).maplibregl) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js";
      script.async = true;
      script.onload = initMap;
      document.body.appendChild(script);
    } else {
      initMap();
    }
  }, [stormData]);

  const latestObs = stormData?.features?.find(
    (f: any) => f.properties?.layer_type === "observation"
  )?.properties as StormProperties;

  return (
    <div className="relative w-full h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Top Header */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-500/20 border border-red-500/40 rounded-lg">
            <ShieldAlert className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide flex items-center gap-2">
              SABER <span className="text-xs px-2 py-0.5 rounded bg-red-600/30 text-red-400 border border-red-500/30">OPERATIONAL</span>
            </h1>
            <p className="text-xs text-slate-400">North Indian Ocean Tropical Cyclone Monitoring</p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>FastAPI Pipeline Online</span>
          </div>
        </div>
      </header>

      {/* Floating Telemetry Card (Left) */}
      {latestObs && (
        <div className="absolute top-24 left-6 z-20 w-80 p-5 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-800 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div>
              <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">Active System</span>
              <h2 className="text-lg font-bold text-white">{stormData?.storm_id}</h2>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 font-semibold">
              {latestObs.category}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Wind className="w-3.5 h-3.5 text-sky-400" />
                <span>Max Wind</span>
              </div>
              <div className="text-xl font-bold text-white">
                {latestObs.vmax_knots} <span className="text-xs text-slate-400 font-normal">kt</span>
              </div>
            </div>

            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                <span>Central Min P</span>
              </div>
              <div className="text-xl font-bold text-white">
                {latestObs.mslp_hpa} <span className="text-xs text-slate-400 font-normal">hPa</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800 pt-3">
            <span>Basin: {stormData?.basin}</span>
            <span>120h Cone Active</span>
          </div>
        </div>
      )}

      {/* Coastal Impact & Landfall Warnings Panel (Right) */}
      <div className="absolute top-24 right-6 z-20 w-96 max-h-[82vh] flex flex-col p-5 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-white tracking-wide">Coastal Landfall Risk</h3>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            {landfallData.length} Districts
          </span>
        </div>

        <div className="overflow-y-auto space-y-3 pr-1 text-xs">
          {landfallData.length === 0 ? (
            <p className="text-slate-500 italic py-4 text-center">No coastal districts currently within the 250 km risk corridor.</p>
          ) : (
            landfallData.map((d, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border ${
                  d.alert_level === "RED"
                    ? "bg-red-950/40 border-red-800/60"
                    : d.alert_level === "ORANGE"
                    ? "bg-amber-950/40 border-amber-800/60"
                    : "bg-yellow-950/30 border-yellow-800/50"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-white text-sm">
                    {d.district}, <span className="text-slate-400 font-normal text-xs">{d.state}</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                      d.alert_level === "RED"
                        ? "bg-red-500 text-white"
                        : d.alert_level === "ORANGE"
                        ? "bg-amber-500 text-slate-950"
                        : "bg-yellow-400 text-slate-950"
                    }`}
                  >
                    {d.alert_level} ALERT
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-300 py-1.5 border-y border-slate-800/60 my-1.5">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>ETA: {d.eta_hours}h</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Wind className="w-3 h-3 text-sky-400" />
                    <span>{d.estimated_sustained_wind_kt} kt</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Waves className="w-3 h-3 text-emerald-400" />
                    <span>Surge: {d.estimated_surge_m}m</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 italic mt-1">{d.action_required}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Map Viewport Canvas */}
      {loading ? (
        <div className="w-full h-full flex items-center justify-center bg-slate-950">
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            <span>Streaming Geospatial Layers...</span>
          </div>
        </div>
      ) : (
        <div ref={mapContainer} className="w-full h-full" />
      )}
    </div>
  );
}