"use client";

import React, { useEffect, useRef, useState } from "react";
import {
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
  Activity,
  Copy,
  Check,
  FileText,
} from "lucide-react";

const ARNAB_DATA = {
  status_headline: "FAIR-WEATHER SURVEILLANCE • RECENT EVENT ARCHIVE",
  observation_source: "INSAT-3DR / IMD Synoptic Doppler Radar Mesh",
  arnab_dossier: {
    system_name: "Deep Depression (Arnab Precursor)",
    landfall_point: "Southwest of Kalingapatnam (North Andhra Pradesh / South Odisha Coast)",
    landfall_coords: [84.1, 18.3],
    classification: {
      official_stage: "Deep Depression (DD)",
      predicted_peak_category: "Severe Cyclonic Storm (Near Landfall Threshold)",
      peak_wind_knots: 35,
      peak_wind_kmh: 65,
      central_min_pressure_hpa: 990,
      dvorak_intensity_t_number: "T2.0 - T2.5",
      cyclone_pattern: "Sheared Cloud Cluster with Low-Level Inflow Convergence",
      confidence_level: "94% Model Consensus",
      classification_verdict:
        "Retained severe rain-bearing deep depression structure throughout coastal crossing; sustained core wind speed remained capped below cyclonic storm gale threshold (34 kt) prior to inland degradation over Odisha.",
    },
    remote_sensing: {
      primary_satellite: "INSAT-3DR / 3DS (TIR-1 & Sounder Profile)",
      doppler_radars_engaged: ["DWR Visakhapatnam", "DWR Gopalpur", "DWR Paradip"],
      ocean_thermal_forcing: "SST 29.5°C over Western Bay of Bengal; D26 Isotherm Depth 80m",
      environmental_shear: "Moderate vertical wind shear (12–15 kt) at 200–800 hPa layer",
    },
    impacted_districts: [
      { name: "Srikakulam", state: "Andhra Pradesh", impact: "Coastal gale gusts, localized surge, and power grid disruption." },
      { name: "Ganjam", state: "Odisha", impact: "Intense downpours; flash flood alerts in lower catchments of Rushikulya." },
      { name: "Gajapati", state: "Odisha", impact: "Landslides in hilly terrains; inundation along road links." },
      { name: "Koraput & Nuapada", state: "Odisha", impact: "Heavy monsoon-coupled runoff; stream overflow." },
      { name: "Bastar & Raipur", state: "Chhattisgarh", impact: "Inland remnant depression rains replenishing reservoirs." },
    ],
    rainfall_surge_envelope: [
      { zone: "North Coastal Andhra Pradesh", accum: "150 mm – 220 mm", consequence: "Flash waterlogging in low-lying coastal belts." },
      { zone: "South Odisha (Ganjam & Gajapati)", accum: "180 mm – 280 mm", consequence: "Isolated extremely heavy falls causing hill slips." },
      { zone: "Chhattisgarh & Vidarbha Remnant Corridor", accum: "75 mm – 130 mm", consequence: "Widespread monsoon enhancement." },
    ],
    track_fixes: [
      { time: "22 Sep 06:00 UTC", lat: 16.2, lon: 86.8, vmax: 25, mslp: 1004, stage: "Well-Marked Low (WML)" },
      { time: "22 Sep 18:00 UTC", lat: 16.8, lon: 85.9, vmax: 28, mslp: 1000, stage: "Depression (D)" },
      { time: "23 Sep 06:00 UTC", lat: 17.5, lon: 85.2, vmax: 32, mslp: 994, stage: "Deep Depression (DD)" },
      { time: "23 Sep 18:00 UTC", lat: 18.1, lon: 84.4, vmax: 35, mslp: 990, stage: "Peak Intensity (Near Landfall)" },
      { time: "24 Sep 00:00 UTC", lat: 18.3, lon: 84.1, vmax: 30, mslp: 996, stage: "Landfall (SW of Kalingapatnam)" },
      { time: "24 Sep 12:00 UTC", lat: 19.4, lon: 83.2, vmax: 25, mslp: 1002, stage: "Inland Depression (Odisha)" },
      { time: "25 Sep 06:00 UTC", lat: 20.5, lon: 82.5, vmax: 20, mslp: 1006, stage: "Dissipating Remnant (Nuapada)" },
    ],
  },
  genesis_hotspots: [
    {
      region: "South-East Bay of Bengal / Andaman Sea",
      coordinates: [92.5, 10.5],
      sst_celsius: 29.6,
      d26_depth_m: 80,
      shear_kt: 11.6,
      genesis_probability: "LOW (25%)",
      assessment: "Thermal reservoir deep (80m); vertical shear at 11.6 kt. Monitored for low level vortex consolidation.",
    },
    {
      region: "East-Central Arabian Sea",
      coordinates: [70.8, 14.8],
      sst_celsius: 28.2,
      d26_depth_m: 50,
      shear_kt: 18.6,
      genesis_probability: "VERY LOW (5%)",
      assessment: "Hostile vertical wind shear (18.6 kt) actively inhibiting convective cloud cluster alignment.",
    },
  ],
};

export default function LiveCyclonePage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  const [isBasinCollapsed, setIsBasinCollapsed] = useState(false);
  const [isDossierOpen, setIsDossierOpen] = useState(true);
  const [dossierCopied, setDossierCopied] = useState(false);

  // Live WebSocket state
  const [liveHotspots, setLiveHotspots] = useState(ARNAB_DATA.genesis_hotspots);
  const [socketConnected, setSocketConnected] = useState(false);
  const [lastSocketUpdate, setLastSocketUpdate] = useState("2026-09-29 20:58:56 UTC");

  // RSMC Dossier Export Function
  const handleExportArnabDossier = () => {
    const text = `
======================================================================
SABER OPERATIONAL TROPICAL CYCLONE DOSSIER & POST-LANDFALL ANALYSIS
SYSTEM IDENTIFIER: ${ARNAB_DATA.arnab_dossier.system_name.toUpperCase()}
OFFICIAL CLASSIFICATION: ${ARNAB_DATA.arnab_dossier.classification.official_stage}
LANDFALL SECTOR: ${ARNAB_DATA.arnab_dossier.landfall_point.toUpperCase()}
PEAK INTENSITY: ${ARNAB_DATA.arnab_dossier.classification.peak_wind_knots} KT (${ARNAB_DATA.arnab_dossier.classification.peak_wind_kmh} KM/H) | MSLP: ${ARNAB_DATA.arnab_dossier.classification.central_min_pressure_hpa} HPA
CONFIDENCE AGREEMENT: ${ARNAB_DATA.arnab_dossier.classification.confidence_level}
----------------------------------------------------------------------
REMOTE SENSING & RADAR COVERAGE:
- Primary Satellite: ${ARNAB_DATA.arnab_dossier.remote_sensing.primary_satellite}
- Doppler Radar Network: ${ARNAB_DATA.arnab_dossier.remote_sensing.doppler_radars_engaged.join(", ")}
- Thermal Forcing: ${ARNAB_DATA.arnab_dossier.remote_sensing.ocean_thermal_forcing}
- Environmental Shear: ${ARNAB_DATA.arnab_dossier.remote_sensing.environmental_shear}

CLASSIFICATION VERDICT:
${ARNAB_DATA.arnab_dossier.classification.classification_verdict}

KEY COASTAL DISTRICT IMPACTS:
${ARNAB_DATA.arnab_dossier.impacted_districts.map((d) => `- ${d.name} (${d.state}): ${d.impact}`).join("\n")}

PRECIPITATION SURGE FOOTPRINT:
${ARNAB_DATA.arnab_dossier.rainfall_surge_envelope.map((r) => `- ${r.zone}: ${r.accum} (${r.consequence})`).join("\n")}
======================================================================`.trim();

    navigator.clipboard.writeText(text);
    setDossierCopied(true);
    setTimeout(() => setDossierCopied(false), 2500);
  };

  // WebSocket Live Connection
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWebSocket = () => {
      try {
        ws = new WebSocket("ws://localhost:8000/api/v1/storms/ws/genesis-surveillance");

        ws.onopen = () => setSocketConnected(true);

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const hotspots = data.genesis_hotspots || data.hotspots;
            if (hotspots) {
              setLiveHotspots(hotspots);
              setLastSocketUpdate(data.timestamp || new Date().toISOString());
            }
          } catch (e) {
            console.error("Malformed WebSocket JSON:", e);
          }
        };

        ws.onclose = () => {
          setSocketConnected(false);
          reconnectTimeout = setTimeout(connectWebSocket, 5000);
        };

        ws.onerror = () => {
          setSocketConnected(false);
          if (ws) ws.close();
        };
      } catch (err) {
        setSocketConnected(false);
        reconnectTimeout = setTimeout(connectWebSocket, 5000);
      }
    };

    connectWebSocket();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  // Map Initialization
  useEffect(() => {
    if (!mapContainer.current) return;

    const renderMap = () => {
      const maplibregl = (window as any).maplibregl;
      if (!maplibregl || !mapContainer.current) return;

      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {}
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
          layers: [{ id: "google-base", type: "raster", source: "google-maps-standard", minzoom: 0, maxzoom: 22 }],
        },
        center: [84.5, 18.2],
        zoom: 5.2,
      });

      mapRef.current = map;

      map.on("load", () => {
        // 1. Sovereign Survey of India boundary
        map.addSource("india-official-boundary", {
          type: "geojson",
          data: "https://raw.githubusercontent.com/datameet/maps/master/Country/india-composite.geojson",
        });

        map.addLayer({
          id: "india-border-line",
          type: "line",
          source: "india-official-boundary",
          paint: { "line-color": "#e11d48", "line-width": 1.5, "line-opacity": 0.8 },
        });

        // 2. Cone of Uncertainty Polygon
        map.addSource("arnab-cone-source", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [86.8, 15.9],
                  [86.2, 16.5],
                  [85.4, 17.2],
                  [84.4, 17.8],
                  [83.8, 18.2],
                  [82.0, 20.6],
                  [83.1, 21.0],
                  [84.5, 18.8],
                  [85.8, 18.4],
                  [86.5, 17.5],
                  [87.2, 16.5],
                  [86.8, 15.9],
                ],
              ],
            },
          },
        });

        map.addLayer({
          id: "arnab-cone-fill",
          type: "fill",
          source: "arnab-cone-source",
          paint: { "fill-color": "#f59e0b", "fill-opacity": 0.22 },
        });

        map.addLayer({
          id: "arnab-cone-line",
          type: "line",
          source: "arnab-cone-source",
          paint: { "line-color": "#f59e0b", "line-width": 1.5, "line-dasharray": [3, 2] },
        });

        // 3. Precipitation Envelope
        map.addSource("rainfall-envelope-source", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [82.0, 16.5],
                  [86.5, 17.5],
                  [87.5, 20.5],
                  [84.5, 22.5],
                  [81.5, 21.5],
                  [82.0, 16.5],
                ],
              ],
            },
          },
        });

        map.addLayer({
          id: "rainfall-envelope-fill",
          type: "fill",
          source: "rainfall-envelope-source",
          paint: { "fill-color": "#0284c7", "fill-opacity": 0.18 },
        });

        map.addLayer({
          id: "rainfall-envelope-line",
          type: "line",
          source: "rainfall-envelope-source",
          paint: { "line-color": "#0369a1", "line-width": 1.5, "line-dasharray": [2, 2], "line-opacity": 0.6 },
        });

        // 4. Trajectory Track
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
          paint: { "line-color": "#ea580c", "line-width": 3.5 },
        });

        // 5. Point Circles
        const pointsGeoJSON = {
          type: "FeatureCollection",
          features: track.map((fix) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [fix.lon, fix.lat] },
            properties: fix,
          })),
        };

        map.addSource("arnab-points-source", {
          type: "geojson",
          data: pointsGeoJSON,
        });

        map.addLayer({
          id: "arnab-points-glow",
          type: "circle",
          source: "arnab-points-source",
          paint: {
            "circle-radius": 10,
            "circle-color": "#2563eb",
            "circle-opacity": 0.25,
          },
        });

        map.addLayer({
          id: "arnab-points-core",
          type: "circle",
          source: "arnab-points-source",
          paint: {
            "circle-radius": 5,
            "circle-color": "#2563eb",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });

        map.on("click", "arnab-points-core", (e: any) => {
          if (!e.features || !e.features[0]) return;
          const props = e.features[0].properties;
          const coord = e.features[0].geometry.coordinates;

          new maplibregl.Popup({ offset: 10 })
            .setLngLat(coord)
            .setHTML(
              `<div style="font-family: sans-serif; font-size: 11px; color: #0f172a; padding: 2px;">
                <strong style="color: #ea580c;">${props.stage}</strong><br/>
                <b>Time:</b> ${props.time}<br/>
                <b>Wind:</b> ${props.vmax} kt | <b>MSLP:</b> ${props.mslp} hPa
              </div>`
            )
            .addTo(map);
        });

        // 6. Landfall Callout Pin (Kalingapatnam)
        const lfEl = document.createElement("div");
        lfEl.className =
          "px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded shadow-lg border border-white cursor-pointer";
        lfEl.innerText = "LANDFALL: KALINGAPATNAM";
        new maplibregl.Marker({ element: lfEl })
          .setLngLat(ARNAB_DATA.arnab_dossier.landfall_coords)
          .setPopup(
            new maplibregl.Popup({ offset: 10 }).setHTML(
              `<div style="font-family: sans-serif; font-size: 12px; color: #0f172a;">
                <strong style="color: #dc2626;">Deep Depression Landfall</strong><br/>
                Crossed: Night of 23–24 September 2026<br/>
                Peak Wind: 65 km/h | 990 hPa
              </div>`
            )
          )
          .addTo(map);

        // 7. Genesis Basin Markers
        liveHotspots.forEach((h: any) => {
          const pin = document.createElement("div");
          pin.className =
            "px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-semibold border border-white shadow-md flex items-center gap-1 cursor-pointer";
          pin.innerHTML = `<span>★</span><span>${h.genesis_probability}</span>`;
          new maplibregl.Marker({ element: pin })
            .setLngLat(h.coordinates)
            .setPopup(
              new maplibregl.Popup({ offset: 12 }).setHTML(
                `<div style="font-family: sans-serif; font-size: 12px; color: #0f172a;">
                  <strong>${h.region}</strong><br/>
                  SST: ${h.sst_celsius}°C | Depth: ${h.d26_depth_m}m<br/>
                  Shear: ${h.shear_kt} kt<br/>
                  <em>${h.assessment}</em>
                </div>`
              )
            )
            .addTo(map);
        });
      });
    };

    if (!(window as any).maplibregl) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js";
      script.async = true;
      script.onload = renderMap;
      document.body.appendChild(script);
    } else {
      renderMap();
    }
  }, [liveHotspots]);

  const dossier = ARNAB_DATA.arnab_dossier;

  return (
    <div className="flex h-full w-full bg-slate-100 font-sans overflow-hidden select-none">
      {/* SIDEBAR */}
      <aside className="w-[430px] flex flex-col bg-white border-r border-slate-200 z-10 shadow-xl h-full shrink-0">
        <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
            BASIN SYNOPTIC REGIME
          </span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>SURVEILLANCE MODE</span>
          </div>
        </div>

        <div className="p-4 border-b border-slate-100">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            CURRENT SYNOPTIC REGIME
          </span>
          <h1 className="text-sm font-bold text-slate-900 mt-0.5">{ARNAB_DATA.status_headline}</h1>
          <p className="text-xs text-slate-500 mt-0.5">Source: {ARNAB_DATA.observation_source}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* 1. MONITORED CYCLOGENESIS BASINS (SEATED BEFORE RECENT ACTIVITY) */}
          <div className="rounded-2xl border border-blue-200 bg-white shadow-xs overflow-hidden transition-all">
            <div
              onClick={() => setIsBasinCollapsed(!isBasinCollapsed)}
              className="p-3 bg-gradient-to-r from-blue-50 via-sky-50 to-white flex items-center justify-between cursor-pointer border-b border-blue-100 select-none hover:brightness-95 transition"
            >
              <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Waves className="w-3.5 h-3.5 text-blue-600" />
                Monitored Cyclogenesis Basins
              </span>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[9px] font-mono bg-white px-2 py-0.5 rounded-full border border-blue-100 shadow-2xs">
                  <span className={`w-1.5 h-1.5 rounded-full ${socketConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                  <span className="text-slate-600">{socketConnected ? "Live (10m Cycle)" : "Offline"}</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsBasinCollapsed(!isBasinCollapsed);
                  }}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-white transition"
                >
                  {isBasinCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isBasinCollapsed && (
              <div className="p-3 space-y-2.5 bg-slate-50/50">
                <div className="text-[10px] text-slate-400 font-mono">
                  Last evaluation: {lastSocketUpdate}
                </div>

                {liveHotspots.map((h: any, i: number) => (
                  <div key={i} className="p-3 bg-white rounded-xl border border-blue-100 shadow-2xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 text-xs">{h.region}</span>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        {h.genesis_probability}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-[10px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 font-mono">
                      <div>SST: <strong className="text-slate-800">{h.sst_celsius}°C</strong></div>
                      <div>D26: <strong className="text-slate-800">{h.d26_depth_m}m</strong></div>
                      <div>Shear: <strong className="text-slate-800">{h.shear_kt}kt</strong></div>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-snug">{h.assessment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. RECENT ACTIVITY: ARNAB PRECURSOR (WITH 1-CLICK DOSSIER EXPORT) */}
          <div className="rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all bg-white">
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
                  <span className="text-[9px] font-mono font-bold bg-rose-600 text-white px-1.5 py-0.2 rounded">
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
                {/* 1-Click Operational Export Bar */}
                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>RSMC Case Record</span>
                  </div>
                  <button
                    onClick={handleExportArnabDossier}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition cursor-pointer"
                  >
                    {dossierCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-blue-600" />
                        <span>Copy Full Dossier</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Intensity & Classification */}
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
                        {dossier.classification.peak_wind_knots} kt{" "}
                        <span className="font-normal text-slate-500">({dossier.classification.peak_wind_kmh} km/h)</span>
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

                {/* Satellite Sources */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Satellite className="w-3.5 h-3.5 text-indigo-600" />
                    Remote Sensing & Satellite Sources
                  </span>
                  <div className="space-y-1 text-[11px] text-slate-600">
                    <div><strong>Satellite Feed:</strong> {dossier.remote_sensing.primary_satellite}</div>
                    <div><strong>Doppler Radars:</strong> {dossier.remote_sensing.doppler_radars_engaged.join(", ")}</div>
                    <div><strong>Ocean Thermal Forcing:</strong> {dossier.remote_sensing.ocean_thermal_forcing}</div>
                    <div><strong>Wind Shear:</strong> {dossier.remote_sensing.environmental_shear}</div>
                  </div>
                </div>

                {/* Impacted Districts */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-600" />
                    Coastal & Inland Impact Areas
                  </span>
                  <div className="space-y-1.5">
                    {dossier.impacted_districts.map((d, idx) => (
                      <div key={idx} className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-[11px]">
                        <span className="font-bold text-slate-800">{d.name} ({d.state}):</span>{" "}
                        <span className="text-slate-600">{d.impact}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rainfall Surge Envelope */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <CloudRain className="w-3.5 h-3.5 text-sky-600" />
                    Precipitation Surge by State
                  </span>
                  <div className="space-y-1.5">
                    {dossier.rainfall_surge_envelope.map((r, idx) => (
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

                {/* Track Fixes */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-amber-600" />
                    Trajectory Fix History
                  </span>
                  <div className="divide-y divide-slate-100 text-[11px]">
                    {dossier.track_fixes.map((f, idx) => (
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
        </div>
      </aside>

      {/* MAP VIEWPORT */}
      <main className="flex-1 relative h-full w-full overflow-hidden">
        <div ref={mapContainer} style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }} />
      </main>
    </div>
  );
}