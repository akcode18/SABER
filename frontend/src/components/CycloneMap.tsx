"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Compass,
  Wind,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Layers,
  Activity,
  MapPin,
  X,
  GripHorizontal,
} from "lucide-react";

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

type EnvironmentalLayer = "NONE" | "SST" | "WARM_DEPTH" | "HUMIDITY" | "WIND_SHEAR";

interface ProbeResult {
  coordinates: { lat: number; lon: number };
  basin: string;
  parameters: {
    sst_celsius: number;
    warm_water_depth_m: number;
    relative_humidity_700_500_pct: number;
    vertical_wind_shear_kt: number;
    low_level_vorticity_10e5_s: number;
  };
  genesis_trigger_score: string;
  cyclogenesis_risk: "LOW" | "MODERATE" | "HIGH";
  favorable_conditions: {
    thermal_forcing: string;
    upper_ocean_heat: string;
    shear_environment: string;
    moisture_inflow: string;
  };
}

export default function CycloneMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const probeMarker = useRef<any>(null);

  const [stormData, setStormData] = useState<any>(null);
  const [landfallData, setLandfallData] = useState<DistrictAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeLayer, setActiveLayer] = useState<EnvironmentalLayer>("NONE");
  const [probeData, setProbeData] = useState<ProbeResult | null>(null);

  // States to toggle visibility / minimization
  const [showTelemetry, setShowTelemetry] = useState(true);
  const [showSurveillance, setShowSurveillance] = useState(true);
  const [showLandfall, setShowLandfall] = useState(true);
  const [showProbe, setShowProbe] = useState(true);

  // Dynamic Draggable Positions - initialized with small top margins (y: 16)
  const [posTelemetry, setPosTelemetry] = useState({ x: 20, y: 16 });
  const [posSurveillance, setPosSurveillance] = useState({ x: 1040, y: 16 });
  const [posLandfall, setPosLandfall] = useState({ x: 1040, y: 220 });
  const [posProbe, setPosProbe] = useState({ x: 20, y: 310 });

  // Initialize right-aligned panels dynamically on client mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const rightX = Math.max(20, window.innerWidth - 340);
      setPosSurveillance({ x: rightX, y: 16 });
      setPosLandfall({ x: rightX, y: 220 });
    }
  }, []);

  // Universal Drag Hook - allows dragging right up to y = 12px (below top nav)
  const handleDragStart = (
    e: React.MouseEvent,
    currentPos: { x: number; y: number },
    setPos: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
  ) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = currentPos.x;
    const initialY = currentPos.y;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      setPos({
        x: Math.max(10, Math.min(window.innerWidth - 80, initialX + deltaX)),
        // Top boundary set to 12px so cards can reach right below the navbar
        y: Math.max(12, Math.min(window.innerHeight - 150, initialY + deltaY)),
      });
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

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

  // 2. Initialize Google Maps Standard Base Layer
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
              id: "google-base-tiles",
              type: "raster",
              source: "google-maps-standard",
              minzoom: 0,
              maxzoom: 22,
            },
          ],
        },
        center: [83.0, 17.5],
        zoom: 4.8,
      });

      mapRef.current = map;

      map.on("load", () => {
        // Survey of India Sovereign Boundary Line
        map.addSource("india-official-boundary", {
          type: "geojson",
          data: "https://raw.githubusercontent.com/datameet/maps/master/Country/india-composite.geojson",
        });

        map.addLayer({
          id: "india-official-border-line",
          type: "line",
          source: "india-official-boundary",
          paint: {
            "line-color": "#e11d48",
            "line-width": 1.6,
            "line-opacity": 0.8,
          },
        });

        // Cyclone GeoJSON Layers
        map.addSource("cyclone-source", { type: "geojson", data: stormData });

        // Uncertainty Cone Fill
        map.addLayer({
          id: "uncertainty-cone-fill",
          type: "fill",
          source: "cyclone-source",
          filter: ["==", "layer_type", "cone_of_uncertainty"],
          paint: { "fill-color": "#f97316", "fill-opacity": 0.25 },
        });

        // Uncertainty Cone Border
        map.addLayer({
          id: "uncertainty-cone-line",
          type: "line",
          source: "cyclone-source",
          filter: ["==", "layer_type", "cone_of_uncertainty"],
          paint: { "line-color": "#ea580c", "line-width": 1.5, "line-dasharray": [3, 2] },
        });

        // 120-Hour Forecast Trajectory Line
        map.addLayer({
          id: "trajectory-path",
          type: "line",
          source: "cyclone-source",
          filter: ["==", "layer_type", "forecast_track"],
          paint: { "line-color": "#dc2626", "line-width": 3 },
        });

        // Observation Markers
        map.addLayer({
          id: "bubble-marker-halo",
          type: "circle",
          source: "cyclone-source",
          filter: ["==", "layer_type", "observation"],
          paint: {
            "circle-radius": [
              "interpolate", ["linear"], ["get", "vmax_knots"],
              15, 12,
              35, 18,
              65, 26,
              100, 36
            ],
            "circle-color": "#4285F4",
            "circle-opacity": 0.35,
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#8ab4f8",
          },
        });

        map.addLayer({
          id: "bubble-marker-core",
          type: "circle",
          source: "cyclone-source",
          filter: ["==", "layer_type", "observation"],
          paint: {
            "circle-radius": [
              "interpolate", ["linear"], ["get", "vmax_knots"],
              15, 6,
              35, 10,
              65, 15,
              100, 22
            ],
            "circle-color": "#1a73e8",
            "circle-opacity": 0.95,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });

        // Observation Click Tooltip
        map.on("click", "bubble-marker-core", (e: any) => {
          if (!e.features || !e.features[0]) return;
          const coords = e.features[0].geometry.coordinates.slice();
          const props = e.features[0].properties;

          new maplibregl.Popup({ offset: 12 })
            .setLngLat(coords)
            .setHTML(
              `<div style="color: #0f172a; font-family: Roboto, Arial, sans-serif; font-size: 13px; line-height: 1.5; padding: 4px;">
                <div style="font-weight: 700; color: #1a73e8; margin-bottom: 2px;">${props.category || "Observation Fix"}</div>
                <div><strong>Wind Speed:</strong> ${props.vmax_knots} kt</div>
                <div><strong>Central Pressure:</strong> ${props.mslp_hpa} hPa</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 4px;"><strong>Recorded:</strong> ${new Date(props.timestamp).toUTCString()}</div>
              </div>`
            )
            .addTo(map);
        });

        // Ocean Surveillance Probe on Click
        map.on("click", async (e: any) => {
          const features = map.queryRenderedFeatures(e.point, { layers: ["bubble-marker-core"] });
          if (features.length > 0) return;

          const { lng, lat } = e.lngLat;
          if (lat < 0 || lat > 30 || lng < 45 || lng > 105) return;

          if (probeMarker.current) {
            probeMarker.current.setLngLat([lng, lat]);
          } else {
            probeMarker.current = new maplibregl.Marker({ color: "#1a73e8" })
              .setLngLat([lng, lat])
              .addTo(map);
          }

          setShowProbe(true);
          try {
            const res = await fetch(
              `http://localhost:8000/api/v1/storms/surveillance/point-probe?lat=${lat.toFixed(3)}&lon=${lng.toFixed(3)}`
            );
            if (res.ok) {
              const data = await res.json();
              setProbeData(data);
            }
          } catch (err) {
            console.error("Probe fetch error:", err);
          }
        });

        map.on("mouseenter", "bubble-marker-core", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "bubble-marker-core", () => {
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
        const mapInstance = mapRef.current;
        mapRef.current = null;
        setTimeout(() => {
          try {
            mapInstance.remove();
          } catch {}
        }, 0);
      }
    };
  }, [stormData]);

  const latestObs = stormData?.features?.find(
    (f: any) => f.properties?.layer_type === "observation"
  )?.properties as StormProperties;

  return (
    <div className="relative w-full h-full bg-slate-100 text-slate-800 font-sans overflow-hidden select-none">
      {/* 1. Active System Telemetry Panel (Draggable & Collapsible) */}
      {latestObs && (
        <div
          style={{ transform: `translate3d(${posTelemetry.x}px, ${posTelemetry.y}px, 0)` }}
          className="absolute top-0 left-0 z-20 transition-transform duration-75 ease-out"
        >
          {showTelemetry ? (
            <div className="w-80 p-4 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-xl">
              <div
                onMouseDown={(e) => handleDragStart(e, posTelemetry, setPosTelemetry)}
                className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3 cursor-grab active:cursor-grabbing hover:bg-slate-50/70 -mx-2 px-2 rounded-t-lg transition"
              >
                <div className="flex items-center gap-1.5">
                  <GripHorizontal className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block leading-none">Active System</span>
                    <h2 className="text-base font-bold text-slate-900 leading-tight">{stormData?.storm_id}</h2>
                  </div>
                </div>
                <div className="flex items-center gap-2" onMouseDown={(e) => e.stopPropagation()}>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                    {latestObs.category}
                  </span>
                  <button
                    onClick={() => setShowTelemetry(false)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                    title="Minimize Telemetry"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 mb-3">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <Wind className="w-3.5 h-3.5 text-blue-500" />
                    <span>Max Wind</span>
                  </div>
                  <div className="text-lg font-bold text-slate-800">
                    {latestObs.vmax_knots} <span className="text-xs text-slate-500 font-normal">kt</span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <Compass className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Min Pressure</span>
                  </div>
                  <div className="text-lg font-bold text-slate-800">
                    {latestObs.mslp_hpa} <span className="text-xs text-slate-500 font-normal">hPa</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
                <span>Basin: {stormData?.basin}</span>
                <span>120h Cone Active</span>
              </div>
            </div>
          ) : (
            <div
              onMouseDown={(e) => handleDragStart(e, posTelemetry, setPosTelemetry)}
              className="flex items-center gap-2.5 px-3.5 py-2 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-lg text-xs font-semibold text-slate-800 cursor-grab active:cursor-grabbing hover:bg-slate-50 transition"
            >
              <GripHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <Activity className="w-4 h-4 text-blue-600" />
              <span onClick={() => setShowTelemetry(true)} className="cursor-pointer">
                System: {latestObs.vmax_knots} kt
              </span>
              <button
                onClick={() => setShowTelemetry(true)}
                onMouseDown={(e) => e.stopPropagation()}
                className="p-0.5 rounded text-slate-400 hover:text-slate-700"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. Surveillance Layers Panel (Draggable & Collapsible) */}
      <div
        style={{ transform: `translate3d(${posSurveillance.x}px, ${posSurveillance.y}px, 0)` }}
        className="absolute top-0 left-0 z-20 transition-transform duration-75 ease-out"
      >
        {showSurveillance ? (
          <div className="w-72 bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-200 shadow-xl text-xs">
            <div
              onMouseDown={(e) => handleDragStart(e, posSurveillance, setPosSurveillance)}
              className="flex items-center justify-between mb-2 cursor-grab active:cursor-grabbing hover:bg-slate-50/70 -mx-1 px-1 py-1 rounded transition"
            >
              <div className="flex items-center gap-1.5">
                <GripHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  Surveillance Layers
                </span>
              </div>
              <button
                onClick={() => setShowSurveillance(false)}
                onMouseDown={(e) => e.stopPropagation()}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                title="Minimize Layers"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setActiveLayer("NONE")}
                className={`px-3 py-1.5 rounded-lg border text-left transition ${
                  activeLayer === "NONE"
                    ? "bg-blue-50 border-blue-400 text-blue-700 font-medium"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Track View
              </button>
              <button
                onClick={() => setActiveLayer("SST")}
                className={`px-3 py-1.5 rounded-lg border text-left transition ${
                  activeLayer === "SST"
                    ? "bg-rose-50 border-rose-400 text-rose-700 font-medium"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                SST (&gt;26.5°C)
              </button>
              <button
                onClick={() => setActiveLayer("WARM_DEPTH")}
                className={`px-3 py-1.5 rounded-lg border text-left transition ${
                  activeLayer === "WARM_DEPTH"
                    ? "bg-amber-50 border-amber-400 text-amber-700 font-medium"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                26°C Depth (D26)
              </button>
              <button
                onClick={() => setActiveLayer("HUMIDITY")}
                className={`px-3 py-1.5 rounded-lg border text-left transition ${
                  activeLayer === "HUMIDITY"
                    ? "bg-emerald-50 border-emerald-400 text-emerald-700 font-medium"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                700hPa Moisture
              </button>
              <button
                onClick={() => setActiveLayer("WIND_SHEAR")}
                className={`px-3 py-1.5 rounded-lg border text-left transition ${
                  activeLayer === "WIND_SHEAR"
                    ? "bg-purple-50 border-purple-400 text-purple-700 font-medium"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Wind Shear (VWS)
              </button>
            </div>
          </div>
        ) : (
          <div
            onMouseDown={(e) => handleDragStart(e, posSurveillance, setPosSurveillance)}
            className="flex items-center gap-2.5 px-3.5 py-2 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-lg text-xs font-semibold text-slate-800 cursor-grab active:cursor-grabbing hover:bg-slate-50 transition"
          >
            <GripHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <Layers className="w-4 h-4 text-blue-600" />
            <span onClick={() => setShowSurveillance(true)} className="cursor-pointer">
              Layers ({activeLayer})
            </span>
            <button
              onClick={() => setShowSurveillance(true)}
              onMouseDown={(e) => e.stopPropagation()}
              className="p-0.5 rounded text-slate-400 hover:text-slate-700"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 3. Coastal Landfall Risk Panel (Draggable & Collapsible) */}
      <div
        style={{ transform: `translate3d(${posLandfall.x}px, ${posLandfall.y}px, 0)` }}
        className="absolute top-0 left-0 z-20 transition-transform duration-75 ease-out"
      >
        {showLandfall ? (
          <div className="w-80 max-h-[42vh] flex flex-col p-4 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-xl">
            <div
              onMouseDown={(e) => handleDragStart(e, posLandfall, setPosLandfall)}
              className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5 cursor-grab active:cursor-grabbing hover:bg-slate-50/70 -mx-1 px-1 py-0.5 rounded transition"
            >
              <div className="flex items-center gap-1.5">
                <GripHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold text-slate-800 tracking-wide uppercase">Coastal Landfall Risk</h3>
              </div>
              <div className="flex items-center gap-2" onMouseDown={(e) => e.stopPropagation()}>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                  {landfallData.length} Districts
                </span>
                <button
                  onClick={() => setShowLandfall(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                  title="Minimize Coastal Risk"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto space-y-2 pr-1 text-xs">
              {landfallData.length === 0 ? (
                <p className="text-slate-400 italic py-4 text-center">No coastal districts currently at risk.</p>
              ) : (
                landfallData.map((d, i) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded-lg border ${
                      d.alert_level === "RED"
                        ? "bg-red-50 border-red-200 text-red-900"
                        : d.alert_level === "ORANGE"
                        ? "bg-amber-50 border-amber-200 text-amber-900"
                        : "bg-yellow-50 border-yellow-200 text-yellow-900"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">
                        {d.district}, <span className="font-normal text-slate-500">{d.state}</span>
                      </span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          d.alert_level === "RED"
                            ? "bg-red-600 text-white"
                            : d.alert_level === "ORANGE"
                            ? "bg-amber-500 text-white"
                            : "bg-yellow-400 text-slate-900"
                        }`}
                      >
                        {d.alert_level}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-700 py-1 border-y border-slate-200/60 my-1">
                      <div>ETA: {d.eta_hours}h</div>
                      <div>{d.estimated_sustained_wind_kt} kt</div>
                      <div>Surge: {d.estimated_surge_m}m</div>
                    </div>

                    <p className="text-[10px] text-slate-500 italic mt-0.5">{d.action_required}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div
            onMouseDown={(e) => handleDragStart(e, posLandfall, setPosLandfall)}
            className="flex items-center gap-2.5 px-3.5 py-2 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-lg text-xs font-semibold text-slate-800 cursor-grab active:cursor-grabbing hover:bg-slate-50 transition"
          >
            <GripHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span onClick={() => setShowLandfall(true)} className="cursor-pointer">
              Landfall ({landfallData.length})
            </span>
            <button
              onClick={() => setShowLandfall(true)}
              onMouseDown={(e) => e.stopPropagation()}
              className="p-0.5 rounded text-slate-400 hover:text-slate-700"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 4. Ocean Diagnostic Probe Panel (Draggable & Collapsible) */}
      {probeData && (
        <div
          style={{ transform: `translate3d(${posProbe.x}px, ${posProbe.y}px, 0)` }}
          className="absolute top-0 left-0 z-20 transition-transform duration-75 ease-out"
        >
          {showProbe ? (
            <div className="w-80 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-xl text-slate-800 text-xs">
              <div
                onMouseDown={(e) => handleDragStart(e, posProbe, setPosProbe)}
                className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5 cursor-grab active:cursor-grabbing hover:bg-slate-50/70 -mx-1 px-1 py-0.5 rounded transition"
              >
                <div className="flex items-center gap-1.5">
                  <GripHorizontal className="w-3.5 h-3.5 text-slate-400" />
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block leading-none">
                      Ocean Probe
                    </span>
                    <h4 className="font-bold text-blue-600 text-sm leading-tight">
                      {probeData.coordinates.lat.toFixed(2)}°N, {probeData.coordinates.lon.toFixed(2)}°E
                    </h4>
                  </div>
                </div>
                <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setShowProbe(false)}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition"
                    title="Minimize Probe"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setProbeData(null)}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition"
                    title="Close Probe"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 mb-2.5 border border-slate-200/80">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Cyclogenesis Risk</div>
                  <div className="text-sm font-extrabold text-blue-600">
                    {probeData.cyclogenesis_risk} ({probeData.genesis_trigger_score})
                  </div>
                </div>
                <div className="text-[11px] font-mono bg-white px-2 py-1 rounded text-slate-700 border border-slate-200">
                  {probeData.basin.replace("_", " ")}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center bg-slate-50 px-2 py-1.5 rounded border border-slate-100">
                  <span className="text-slate-600">Sea Surface Temp (SST)</span>
                  <span className="font-mono font-bold text-rose-600">{probeData.parameters.sst_celsius}°C</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 px-2 py-1.5 rounded border border-slate-100">
                  <span className="text-slate-600">26°C Water Depth (D26)</span>
                  <span className="font-mono font-bold text-amber-700">{probeData.parameters.warm_water_depth_m} m</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 px-2 py-1.5 rounded border border-slate-100">
                  <span className="text-slate-600">700–500 hPa Rel. Humidity</span>
                  <span className="font-mono font-bold text-emerald-700">{probeData.parameters.relative_humidity_700_500_pct}%</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 px-2 py-1.5 rounded border border-slate-100">
                  <span className="text-slate-600">Vertical Wind Shear</span>
                  <span className="font-mono font-bold text-slate-800">{probeData.parameters.vertical_wind_shear_kt} kt</span>
                </div>
              </div>
            </div>
          ) : (
            <div
              onMouseDown={(e) => handleDragStart(e, posProbe, setPosProbe)}
              className="flex items-center gap-2.5 px-3.5 py-2 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-lg text-xs font-semibold text-slate-800 cursor-grab active:cursor-grabbing hover:bg-slate-50 transition"
            >
              <GripHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <MapPin className="w-4 h-4 text-blue-600" />
              <span onClick={() => setShowProbe(true)} className="cursor-pointer">
                Probe: {probeData.coordinates.lat.toFixed(1)}°N, {probeData.coordinates.lon.toFixed(1)}°E
              </span>
              <button
                onClick={() => setShowProbe(true)}
                onMouseDown={(e) => e.stopPropagation()}
                className="p-0.5 rounded text-slate-400 hover:text-slate-700"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating Legend (Bottom Center) */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 bg-white/95 backdrop-blur-md px-6 py-2 rounded-2xl shadow-xl border border-slate-200/90 flex items-center gap-8 text-slate-700">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Convective Area</span>
          <div className="flex items-center gap-0.5">
            <span className="w-3.5 h-2 bg-emerald-200 rounded-xs" />
            <span className="w-3.5 h-2 bg-emerald-300 rounded-xs" />
            <span className="w-3.5 h-2 bg-emerald-400 rounded-xs" />
            <span className="w-3.5 h-2 bg-emerald-500 rounded-xs" />
            <span className="w-3.5 h-2 bg-emerald-600 rounded-xs" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 border-l border-slate-200 pl-6">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Wind Intensity (kt)</span>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="w-3.5 h-3.5 rounded-full bg-blue-600" />
            <span className="w-4.5 h-4.5 rounded-full bg-blue-600 border border-white shadow-xs" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 border-l border-slate-200 pl-6">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Forecast Corridor</span>
          <div className="flex flex-col gap-0.5 w-12 items-center">
            <span className="w-full h-0.5 bg-red-600 rounded" />
            <span className="w-full h-0.5 bg-orange-400 rounded" />
          </div>
        </div>
      </div>

      {/* Map Viewport Canvas */}
      {loading ? (
        <div className="w-full h-full flex items-center justify-center bg-slate-100">
          <div className="flex items-center gap-3 text-slate-500 text-sm">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Streaming Geospatial Layers...</span>
          </div>
        </div>
      ) : (
        <div ref={mapContainer} style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }} />
      )}
    </div>
  );
}