"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  Compass,
  Wind,
  ArrowLeft,
  Calendar,
  Layers,
  ChevronRight,
} from "lucide-react";

interface StormSummary {
  id: string;
  name: string;
  basin: string;
  status: string;
  first_detected_at: string;
}

interface TrackPoint {
  timestamp: string;
  lat: number;
  lon: number;
  vmax_knots: number;
  mslp_hpa: number;
  category: string;
}

interface StormDetails {
  id: string;
  name: string;
  basin: string;
  status: string;
  peak_vmax_knots: number;
  lowest_mslp_hpa: number;
  total_fixes: number;
  track_history: TrackPoint[];
  geojson: any;
}

export default function HistoricalPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  const [stormList, setStormList] = useState<StormSummary[]>([]);
  const [selectedStormId, setSelectedStormId] = useState<string>("");
  const [stormDetails, setStormDetails] = useState<StormDetails | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // 1. Fetch List of Historical Cyclones
  useEffect(() => {
    fetch("http://localhost:8000/api/v1/storms/historical/list")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch list");
        return res.json();
      })
      .then((data) => {
        setStormList(data);
        if (Array.isArray(data) && data.length > 0) {
          setSelectedStormId(data[0].id);
        }
        setLoadingList(false);
      })
      .catch((err) => {
        console.error("Failed to load historical storms:", err);
        setLoadingList(false);
      });
  }, []);

  // 2. Fetch Selected Cyclone Details
  useEffect(() => {
    if (!selectedStormId) return;

    setLoadingDetails(true);
    fetch(`http://localhost:8000/api/v1/storms/historical/${selectedStormId}/details`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch storm details");
        return res.json();
      })
      .then((data) => {
        setStormDetails(data);
        setLoadingDetails(false);
      })
      .catch((err) => {
        console.error("Failed to fetch storm details:", err);
        setLoadingDetails(false);
      });
  }, [selectedStormId]);

  // 3. Render / Update Map
  useEffect(() => {
    if (!mapContainer.current || !stormDetails?.geojson) return;

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

    const renderMap = () => {
      const maplibregl = (window as any).maplibregl;
      if (!maplibregl || !mapContainer.current) return;

      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {}
        mapRef.current = null;
      }

      const firstFix = stormDetails.track_history?.[0];
      const startCoord: [number, number] = firstFix
        ? [firstFix.lon, firstFix.lat]
        : [85.0, 18.0];

      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            "google-maps-standard": {
              type: "raster",
              tiles: [
                "https://mt0.google.com/vt/lyrs=m&hl=en&gl=IN&x={x}&y={y}&z={z}",
                "https://mt1.google.com/vt/lyrs=m&hl=en&gl=IN&x={x}&y={y}&z={z}",
                "https://mt2.google.com/vt/lyrs=m&hl=en&gl=IN&x={x}&y={y}&z={z}",
                "https://mt3.google.com/vt/lyrs=m&hl=en&gl=IN&x={x}&y={y}&z={z}",
              ],
              tileSize: 256,
              maxzoom: 20,
            },
          },
          layers: [
            {
              id: "google-base",
              type: "raster",
              source: "google-maps-standard",
              minzoom: 0,
              maxzoom: 22,
            },
          ],
        },
        center: startCoord,
        zoom: 4.8,
      });

      mapRef.current = map;

      map.on("load", () => {
        // Survey of India sovereign border line
        map.addSource("india-official-boundary", {
          type: "geojson",
          data: "https://raw.githubusercontent.com/datameet/maps/master/Country/india-composite.geojson",
        });

        map.addLayer({
          id: "india-border-line",
          type: "line",
          source: "india-official-boundary",
          paint: {
            "line-color": "#e11d48",
            "line-width": 1.5,
            "line-opacity": 0.8,
          },
        });

        // Add Cyclone GeoJSON Source
        map.addSource("historical-cyclone", {
          type: "geojson",
          data: stormDetails.geojson,
        });

        // Historical Track Path (Solid Crimson Line)
        map.addLayer({
          id: "history-line",
          type: "line",
          source: "historical-cyclone",
          filter: ["==", "layer_type", "historical_lifetime_track"],
          paint: {
            "line-color": "#dc2626",
            "line-width": 3.5,
          },
        });

        // Observation Points Outer Halo
        map.addLayer({
          id: "history-points-glow",
          type: "circle",
          source: "historical-cyclone",
          filter: ["==", "layer_type", "historical_fix"],
          paint: {
            "circle-radius": [
              "interpolate", ["linear"], ["get", "vmax_knots"],
              25, 8,
              65, 14,
              120, 22
            ],
            "circle-color": "#2563eb",
            "circle-opacity": 0.35,
          },
        });

        // Observation Points Solid Core
        map.addLayer({
          id: "history-points-core",
          type: "circle",
          source: "historical-cyclone",
          filter: ["==", "layer_type", "historical_fix"],
          paint: {
            "circle-radius": [
              "interpolate", ["linear"], ["get", "vmax_knots"],
              25, 4,
              65, 8,
              120, 12
            ],
            "circle-color": "#1d4ed8",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });

        // Tooltip popup on point click
        map.on("click", "history-points-core", (e: any) => {
          if (!e.features || !e.features[0]) return;
          const coords = e.features[0].geometry.coordinates.slice();
          const props = e.features[0].properties;

          new maplibregl.Popup({ offset: 10 })
            .setLngLat(coords)
            .setHTML(
              `<div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; color: #0f172a;">
                <b style="color: #dc2626;">${props.category || "Observation"}</b><br/>
                <b>Vmax:</b> ${props.vmax_knots} kt<br/>
                <b>Pressure:</b> ${props.mslp_hpa} hPa
              </div>`
            )
            .addTo(map);
        });

        map.on("mouseenter", "history-points-core", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "history-points-core", () => {
          map.getCanvas().style.cursor = "";
        });

        // Zoom / Fit to storm path bounds
        if (stormDetails.track_history && stormDetails.track_history.length > 1) {
          const bounds = new maplibregl.LngLatBounds();
          stormDetails.track_history.forEach((pt) => {
            bounds.extend([pt.lon, pt.lat]);
          });
          map.fitBounds(bounds, { padding: 80, maxZoom: 6 });
        }
      });
    };

    if (!(window as any).maplibregl) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js";
      script.async = true;
      script.onload = renderMap;
      document.body.appendChild(script);
    } else {
      renderMap();
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (
        event.reason?.name === "AbortError" ||
        event.reason?.message?.includes("signal is aborted without reason")
      ) {
        event.preventDefault();
      }
    };
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      if (mapRef.current) {
        const m = mapRef.current;
        mapRef.current = null;
        setTimeout(() => {
          try {
            m.remove();
          } catch {}
        }, 0);
      }
    };
  }, [stormDetails]);

  return (
    <div className="flex h-full w-full bg-slate-100 font-sans overflow-hidden">
      {/* LEFT SIDEBAR: Cyclone Selection & Catalog */}
      <aside className="w-96 flex flex-col bg-white border-r border-slate-200 z-10 shadow-md">
        {/* Navigation Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Live Monitor</span>
          </Link>
          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
            IBTrACS ARCHIVE
          </span>
        </div>

        {/* Title Header */}
        <div className="p-5 border-b border-slate-100">
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            Historical Cyclones
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            North Indian Ocean severe weather catalog
          </p>
        </div>

        {/* List of Storms */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {loadingList ? (
            <p className="text-xs text-slate-400 italic">Loading catalog...</p>
          ) : stormList.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No historical records found.</p>
          ) : (
            stormList.map((storm) => {
              const isSelected = storm.id === selectedStormId;
              const stormYear = storm.first_detected_at
                ? new Date(storm.first_detected_at).getFullYear()
                : "N/A";

              return (
                <button
                  key={storm.id}
                  onClick={() => setSelectedStormId(storm.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                    isSelected
                      ? "bg-blue-50 border-blue-400 shadow-xs"
                      : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {storm.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {storm.basin === "BAY_OF_BENGAL" ? "BoB" : "AS"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                      <Calendar className="w-3 h-3" />
                      <span>{stormYear}</span>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 transition ${
                      isSelected ? "text-blue-600 translate-x-0.5" : "text-slate-300"
                    }`}
                  />
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* RIGHT SIDE: Map Canvas & Telemetry Overlay */}
      <main className="flex-1 relative h-full">
        {/* Top Floating Metric HUD */}
        {stormDetails && (
          <div className="absolute top-4 left-6 z-20 flex gap-3 pointer-events-none">
            <div className="bg-white/95 backdrop-blur-md px-4 py-3 rounded-xl border border-slate-200 shadow-lg flex items-center gap-3 pointer-events-auto">
              <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                <Wind className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Peak Intensity</span>
                <span className="text-base font-extrabold text-slate-900">
                  {stormDetails.peak_vmax_knots}{" "}
                  <span className="text-xs font-normal text-slate-500">kt</span>
                </span>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-md px-4 py-3 rounded-xl border border-slate-200 shadow-lg flex items-center gap-3 pointer-events-auto">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Minimum Pressure</span>
                <span className="text-base font-extrabold text-slate-900">
                  {stormDetails.lowest_mslp_hpa}{" "}
                  <span className="text-xs font-normal text-slate-500">hPa</span>
                </span>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-md px-4 py-3 rounded-xl border border-slate-200 shadow-lg flex items-center gap-3 pointer-events-auto">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Lifetime Fixes</span>
                <span className="text-base font-extrabold text-slate-900">
                  {stormDetails.total_fixes}{" "}
                  <span className="text-xs font-normal text-slate-500">points</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Loading Spinner Indicator (Non-destructive overlay) */}
        {loadingDetails && (
          <div className="absolute top-20 right-6 z-30 flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-lg shadow-sm border border-slate-200 text-xs text-slate-600 font-medium">
            <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Updating Track...</span>
          </div>
        )}

        {/* Map Viewport Canvas - Permanent Container */}
        <div ref={mapContainer} className="w-full h-full" />
      </main>
    </div>
  );
}