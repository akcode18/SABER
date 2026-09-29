"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Radio,
  Calendar,
  CloudRain,
  Satellite,
  Compass,
  Wind,
  Gauge,
  MapPin,
  Waves,
  ChevronDown,
  ChevronUp,
  Activity
} from "lucide-react";

// Baseline Ground Truth (IMD Best Track for Deep Depression / Arnab Precursor)
const ARNAB_DATA = {
  status_headline: "FAIR-WEATHER SURVEILLANCE • RECENT EVENT ARCHIVE",
  observation_source: "INSAT-3DR / IMD Synoptic Doppler Radar Mesh",
  arnab_dossier: {
    system_name: "Deep Depression ('Arnab' Precursor)",
    official_designation: "IMD BOB 05 / Deep Depression",
    origin_region: "West-Central & Adjoining Northwest Bay of Bengal",
    origin_coords: [86.8, 16.2],
    landfall_point: "Southwest of Kalingapatnam (North Andhra Pradesh / South Odisha Coast)",
    landfall_coords: [84.1, 18.3],
    landfall_window: "Night of 23–24 September 2026",
    current_status: "Weakened into a Well-Marked Low / Dissipated over Central India",

    classification: {
      official_stage: "Deep Depression (DD)",
      predicted_peak_category: "Borderline Cyclonic Storm (CS)",
      peak_wind_knots: 35.0,
      peak_wind_kmh: "65 km/h (gusting to 75 km/h)",
      central_min_pressure_hpa: 990.0,
      dvorak_intensity_t_number: "T2.0 - T2.5",
      confidence_level: "94% (High Doppler Radar Agreement)",
      cyclone_pattern: "Curved Band Pattern with Sheared Convection",
      classification_verdict: "Remained an intense Deep Depression; fell 2 kt short of the 34-kt sustained threshold required for official WMO naming as 'Cyclone Arnab'."
    },

    remote_sensing: {
      primary_satellite: "INSAT-3DR / INSAT-3DS (TIR-1 10.8µm & Water Vapor 6.9µm)",
      doppler_radars_engaged: ["DWR Visakhapatnam", "DWR Gopalpur", "DWR Paradip"],
      ocean_thermal_forcing: "SST 29.8°C with D26 depth of 75m in western Bay",
      environmental_shear: "Moderate north-easterly shear (15-20 kt) preventing eye-wall symmetry"
    },

    impacted_districts: [
      { name: "Srikakulam / Kalingapatnam", state: "Andhra Pradesh", alert: "RED ALERT", impact: "Direct Eye Landfall; Gale winds 65-75 km/h and localized sea water inundation" },
      { name: "Gopalpur / Ganjam", state: "Odisha", alert: "RED ALERT", impact: "Torrential coastal downpours; extensive sea surge and tree-fall damage" },
      { name: "Visakhapatnam", state: "Andhra Pradesh", alert: "ORANGE WARNING", impact: "Severe squalls; Local Cautionary Signal No. 3 hoisted at port" },
      { name: "Rayagada & Nuapada", state: "Odisha", alert: "ORANGE WARNING", impact: "Inland riverine flooding; over 20,000 residents impacted across low-lying blocks" }
    ],

    rainfall_surge_envelope: [
      { zone: "Odisha (Ganjam, Gajapati, Puri, Rayagada)", accum: "150 - 240 mm (Extremely Heavy)", consequence: "Riverine swell in Rushikulya & Vansadhara basins" },
      { zone: "North Coastal Andhra Pradesh (Srikakulam, Vizianagaram)", accum: "115 - 180 mm (Very Heavy)", consequence: "Waterlogging across lowlands & agricultural fields" },
      { zone: "Chhattisgarh & East Madhya Pradesh", accum: "80 - 130 mm (Heavy)", consequence: "Inundation of rural road networks along remnant track" },
      { zone: "Uttar Pradesh & Bihar", accum: "60 - 110 mm (Heavy Inflow)", consequence: "Downpours in drainage catchments of Gandak and Ghaghara rivers" }
    ],

    track_fixes: [
      { time: "22 Sep 06:00 UTC", lat: 16.2, lon: 86.8, vmax: 25.0, mslp: 1002.0, stage: "Well-Marked Low (WML)" },
      { time: "22 Sep 18:00 UTC", lat: 16.8, lon: 85.9, vmax: 28.0, mslp: 998.0, stage: "Depression (D)" },
      { time: "23 Sep 06:00 UTC", lat: 17.5, lon: 85.2, vmax: 32.0, mslp: 994.0, stage: "Deep Depression (DD)" },
      { time: "23 Sep 18:00 UTC", lat: 18.1, lon: 84.4, vmax: 35.0, mslp: 990.0, stage: "Peak Intensity (Near Landfall)" },
      { time: "24 Sep 00:00 UTC", lat: 18.3, lon: 84.1, vmax: 30.0, mslp: 994.0, stage: "Landfall (SW of Kalingapatnam)" },
      { time: "24 Sep 12:00 UTC", lat: 19.4, lon: 83.2, vmax: 25.0, mslp: 998.0, stage: "Inland Depression (Odisha)" },
      { time: "25 Sep 06:00 UTC", lat: 20.5, lon: 82.5, vmax: 20.0, mslp: 1002.0, stage: "Dissipating Remnant (Nuapada)" }
    ]
  },

  initial_genesis_hotspots: [
    {
      region: "South-East Bay of Bengal / Andaman Sea",
      coordinates: [92.5, 10.5],
      sst_celsius: 29.8,
      d26_depth_m: 82,
      shear_kt: 12.0,
      genesis_probability: "LOW (25%)",
      assessment: "Warm thermal layer present, but broad anticyclonic wind flow inhibits immediate vortex consolidation."
    },
    {
      region: "East-Central Arabian Sea",
      coordinates: [70.8, 14.8],
      sst_celsius: 28.4,
      d26_depth_m: 52,
      shear_kt: 19.5,
      genesis_probability: "VERY LOW (10%)",
      assessment: "Elevated vertical wind shear (>18 kt) hostile to organized tropical cyclogenesis."
    }
  ]
};

export default function LiveCyclonePage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [isDossierOpen, setIsDossierOpen] = useState(true);
  const [liveHotspots, setLiveHotspots] = useState(ARNAB_DATA.initial_genesis_hotspots);
  const [lastSocketUpdate, setLastSocketUpdate] = useState<string>("Connecting to WebSocket...");
  const [socketConnected, setSocketConnected] = useState<boolean>(false);

  // 1. Automated WebSocket Connection (Polls every 10 min from FastAPI)
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connect = () => {
      try {
        ws = new WebSocket("ws://localhost:8000/api/v1/storms/ws/genesis-surveillance");

        ws.onopen = () => {
          setSocketConnected(true);
          setLastSocketUpdate("Connected • Awaiting first frame");
        };

        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.hotspots) {
              setLiveHotspots(payload.hotspots);
              setLastSocketUpdate(payload.timestamp);
            }
          } catch (e) {
            console.error("WebSocket payload error:", e);
          }
        };

        ws.onclose = () => {
          setSocketConnected(false);
          setLastSocketUpdate("Disconnected • Reconnecting in 5s");
          reconnectTimeout = setTimeout(connect, 5000);
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch (err) {
        setSocketConnected(false);
        reconnectTimeout = setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, []);

  // 2. Initialize MapLibre Canvas
  useEffect(() => {
    if (!mapContainer.current) return;

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
        try { mapRef.current.remove(); } catch {}
        mapRef.current = null;
      }

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
            { id: "google-base", type: "raster", source: "google-maps-standard", minzoom: 0, maxzoom: 22 },
          ],
        },
        center: [84.2, 18.2],
        zoom: 5.4,
      });

      mapRef.current = map;

      map.on("load", () => {
        map.resize();

        // Sovereign Survey of India Boundary
        map.addSource("india-official-boundary", {
          type: "geojson",
          data: "https://raw.githubusercontent.com/datameet/maps/master/Country/india-composite.geojson",
        });

        map.addLayer({
          id: "india-border-line",
          type: "line",
          source: "india-official-boundary",
          paint: { "line-color": "#e11d48", "line-width": 1.5, "line-opacity": 0.85 },
        });

        // Heavy Rainfall Surge Envelope
        map.addSource("rainfall-envelope-source", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [[
                [82.0, 16.5],
                [86.5, 17.5],
                [87.5, 20.8],
                [84.5, 22.8],
                [81.2, 21.5],
                [82.0, 16.5]
              ]]
            }
          }
        });

        map.addLayer({
          id: "rainfall-envelope-fill",
          type: "fill",
          source: "rainfall-envelope-source",
          paint: { "fill-color": "#0284c7", "fill-opacity": 0.22 }
        });

        map.addLayer({
          id: "rainfall-envelope-line",
          type: "line",
          source: "rainfall-envelope-source",
          paint: { "line-color": "#0369a1", "line-width": 1.5, "line-dasharray": [2, 2], "line-opacity": 0.7 }
        });

        // Arnab Lifetime Track Line
        const track = ARNAB_DATA.arnab_dossier.track_fixes;
        const coords = track.map((pt) => [pt.lon, pt.lat]);

        map.addSource("arnab-track-source", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: { type: "LineString", coordinates: coords },
          },
        });

        map.addLayer({
          id: "arnab-track-line",
          type: "line",
          source: "arnab-track-source",
          paint: { "line-color": "#ea580c", "line-width": 4 },
        });

        // Past Observation Markers
        track.forEach((fix) => {
          const el = document.createElement("div");
          el.className = "w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow-md cursor-pointer";
          new maplibregl.Marker({ element: el })
            .setLngLat([fix.lon, fix.lat])
            .setPopup(
              new maplibregl.Popup({ offset: 8 }).setHTML(
                `<div style="font-family: sans-serif; font-size: 11px; color: #0f172a; padding: 2px;">
                  <strong style="color: #dc2626;">${fix.stage}</strong><br/>
                  <b>Time:</b> ${fix.time}<br/>
                  <b>Wind:</b> ${fix.vmax} kt | <b>MSLP:</b> ${fix.mslp} hPa
                </div>`
              )
            )
            .addTo(map);
        });

        // Landfall Point Pin
        const lfEl = document.createElement("div");
        lfEl.className = "px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded shadow-lg border border-white cursor-pointer";
        lfEl.innerText = "LANDFALL: KALINGAPATNAM";
        new maplibregl.Marker({ element: lfEl })
          .setLngLat(ARNAB_DATA.arnab_dossier.landfall_coords)
          .setPopup(
            new maplibregl.Popup({ offset: 10 }).setHTML(
              `<div style="font-family: sans-serif; font-size: 12px; color: #0f172a;">
                <strong style="color: #dc2626;">Deep Depression Landfall</strong><br/>
                Crossed: Night of 23–24 September 2026<br/>
                Near Kalingapatnam (North AP / South Odisha)<br/>
                Peak Sustained Winds: 65 km/h
              </div>`
            )
          )
          .addTo(map);

        updateGenesisMarkers(map);
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
  }, []);

  // 3. Update Genesis Hotspot Markers dynamically when liveHotspots changes
  const updateGenesisMarkers = (map: any) => {
    const maplibregl = (window as any).maplibregl;
    if (!map || !maplibregl) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    liveHotspots.forEach((h: any) => {
      const pin = document.createElement("div");
      pin.className = "px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-semibold border border-white shadow-md flex items-center gap-1 cursor-pointer";
      pin.innerHTML = `<span>★</span><span>${h.genesis_probability}</span>`;

      const marker = new maplibregl.Marker({ element: pin })
        .setLngLat(h.coordinates)
        .setPopup(
          new maplibregl.Popup({ offset: 12 }).setHTML(
            `<div style="font-family: sans-serif; font-size: 12px; color: #0f172a; padding: 2px;">
              <strong>${h.region}</strong><br/>
              SST: ${h.sst_celsius}°C | Depth: ${h.d26_depth_m}m<br/>
              Wind Shear: ${h.shear_kt} kt<br/>
              <em>${h.assessment}</em>
            </div>`
          )
        )
        .addTo(map);

      markersRef.current.push(marker);
    });
  };

  useEffect(() => {
    if (mapRef.current && mapRef.current.isStyleLoaded()) {
      updateGenesisMarkers(mapRef.current);
    }
  }, [liveHotspots]);

  const dossier = ARNAB_DATA.arnab_dossier;

  return (
    <div className="flex h-screen w-screen bg-slate-100 font-sans overflow-hidden select-none">
      {/* SIDEBAR */}
      <aside className="w-[430px] flex flex-col bg-white border-r border-slate-200 z-10 shadow-xl h-full shrink-0">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition">
            <ArrowLeft className="w-4 h-4" /> Live Map
          </Link>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
            <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
            <span>OPERATIONAL SURVEILLANCE</span>
          </div>
        </div>

        <div className="p-4 border-b border-slate-100">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            CURRENT SYNOPTIC REGIME
          </span>
          <h1 className="text-base font-bold text-slate-900 mt-0.5">
            {ARNAB_DATA.status_headline}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Source: {ARNAB_DATA.observation_source}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* ARNAB CASE FILE CARD */}
          <div className="rounded-2xl border border-slate-200 shadow-xs overflow-hidden bg-white">
            <button
              onClick={() => setIsDossierOpen(!isDossierOpen)}
              className="w-full p-4 bg-gradient-to-r from-rose-50 via-white to-amber-50 flex items-center justify-between text-left hover:brightness-95 transition"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-rose-600" />
                    Recent Activity: Arnab Precursor
                  </span>
                  <span className="text-[9px] font-mono font-bold bg-rose-600 text-white px-1.5 py-0.5 rounded">
                    LANDFALL
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  IMD Deep Depression • Landfall near Kalingapatnam
                </div>
              </div>
              <div className="p-1 rounded-full bg-white border border-slate-200 text-slate-500">
                {isDossierOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {isDossierOpen && (
              <div className="p-4 space-y-4 border-t border-slate-100 bg-slate-50/50">
                {/* 1. CLASSIFICATION CARD */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-blue-600" />
                      Cyclone Intensity & Classification
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {dossier.classification.confidence_level}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Official Stage</div>
                      <div className="text-xs font-bold text-slate-800 mt-0.5">{dossier.classification.official_stage}</div>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Predicted Category</div>
                      <div className="text-xs font-bold text-rose-600 mt-0.5">{dossier.classification.predicted_peak_category}</div>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                        <Wind className="w-3 h-3 text-slate-400" /> Peak Wind Speed
                      </div>
                      <div className="text-xs font-bold text-slate-800 mt-0.5">
                        {dossier.classification.peak_wind_knots} kt <span className="font-normal text-slate-500">({dossier.classification.peak_wind_kmh})</span>
                      </div>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                        <Gauge className="w-3 h-3 text-slate-400" /> Central Pressure
                      </div>
                      <div className="text-xs font-bold text-slate-800 mt-0.5">
                        {dossier.classification.central_min_pressure_hpa} hPa
                      </div>
                    </div>
                  </div>

                  <div className="p-2 bg-blue-50/70 rounded-lg border border-blue-100 text-[11px] text-blue-900 space-y-0.5">
                    <div><strong>Dvorak Curve:</strong> {dossier.classification.dvorak_intensity_t_number}</div>
                    <div><strong>Pattern:</strong> {dossier.classification.cyclone_pattern}</div>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed italic border-t border-slate-100 pt-2">
                    {dossier.classification.classification_verdict}
                  </p>
                </div>

                {/* 2. REMOTE SENSING SOURCES */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Satellite className="w-3.5 h-3.5 text-indigo-600" />
                    Remote Sensing & Satellite Sources
                  </span>
                  <div className="space-y-1 text-[11px] text-slate-600">
                    <div><strong>Satellite Feed:</strong> {dossier.remote_sensing.primary_satellite}</div>
                    <div><strong>Doppler Stations:</strong> {dossier.remote_sensing.doppler_radars_engaged.join(", ")}</div>
                    <div><strong>Thermal Forcing:</strong> {dossier.remote_sensing.ocean_thermal_forcing}</div>
                    <div><strong>Wind Shear:</strong> {dossier.remote_sensing.environmental_shear}</div>
                  </div>
                </div>

                {/* 3. IMPACTED DISTRICTS */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-600" />
                    Coastal & Inland Impact Areas
                  </span>
                  <div className="space-y-1.5">
                    {dossier.impacted_districts.map((d: any, idx: number) => (
                      <div key={idx} className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-[11px]">
                        <span className="font-bold text-slate-800">{d.name} ({d.state}):</span>{" "}
                        <span className="text-slate-600">{d.impact}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. RAINFALL SURGE ENVELOPE */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <CloudRain className="w-3.5 h-3.5 text-sky-600" />
                    Precipitation Surge by State
                  </span>
                  <div className="space-y-1.5">
                    {dossier.rainfall_surge_envelope.map((r: any, idx: number) => (
                      <div key={idx} className="p-2 bg-sky-50/50 rounded-lg border border-sky-100 text-[11px]">
                        <div className="flex justify-between font-bold text-slate-900">
                          <span>{r.zone}</span>
                          <span className="text-sky-700">{r.accum}</span>
                        </div>
                        <div className="text-slate-500 text-[10px] mt-0.5">{r.consequence}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. TRAJECTORY FIX HISTORY */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-amber-600" />
                    Trajectory Fix History
                  </span>
                  <div className="divide-y divide-slate-100 text-[11px]">
                    {dossier.track_fixes.map((f: any, idx: number) => (
                      <div key={idx} className="py-1.5 flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-slate-800">{f.stage}</div>
                          <div className="text-[10px] text-slate-400">{f.time} • {f.lat}°N, {f.lon}°E</div>
                        </div>
                        <div className="font-mono font-bold text-rose-600">{f.vmax} kt</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* MONITORED CYCLOGENESIS HOTSPOTS (LIVE SOCKET) */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase tracking-wide text-[10px] flex items-center gap-1">
                <Waves className="w-3.5 h-3.5 text-blue-600" /> Monitored Cyclogenesis Basins
              </span>
              <div className="flex items-center gap-1.5 text-[9px] font-mono">
                <span className={`w-2 h-2 rounded-full ${socketConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                <span className="text-slate-500">{socketConnected ? "Live (10m Cycle)" : "Connecting"}</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 font-mono">
              Last evaluation: {lastSocketUpdate}
            </div>

            {liveHotspots.map((h: any, i: number) => (
              <div key={i} className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">{h.region}</span>
                  <span className="text-[10px] font-bold text-blue-700">{h.genesis_probability}</span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-600 bg-white/80 p-1.5 rounded border border-blue-100/60 font-mono">
                  <span>SST: {h.sst_celsius}°C</span>
                  <span>D26: {h.d26_depth_m}m</span>
                  <span>Shear: {h.shear_kt}kt</span>
                </div>
                <p className="text-[11px] text-slate-500">{h.assessment}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* MAP VIEWPORT */}
      <main className="flex-1 relative h-full w-full overflow-hidden">
        <div ref={mapContainer} style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }} />
      </main>
    </div>
  );
}