"use client";

import React, { useState, useMemo } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  Wind,
  Clock,
  MapPin,
  Filter,
  CheckCircle2,
  RefreshCw,
  Search,
  Copy,
  Check,
} from "lucide-react";

type RiskTier = "CRITICAL" | "HIGH" | "MODERATE" | "INFORMATIONAL";
type RegionFilter = "ALL" | "BAY_OF_BENGAL" | "ARABIAN_SEA" | "ANDHRA_PRADESH" | "ODISHA" | "WEST_BENGAL" | "TAMIL_NADU";

interface AlertRecord {
  id: string;
  cyclone_name: string;
  region: string;
  basin_key: "BAY_OF_BENGAL" | "ARABIAN_SEA";
  state_key: "ANDHRA_PRADESH" | "ODISHA" | "WEST_BENGAL" | "TAMIL_NADU" | "CENTRAL_INDIA";
  risk_level: RiskTier;
  wind_speed_kt: number;
  wind_speed_kmh: number;
  time: string;
  headline: string;
  description: string;
  bulletin_source: string;
}

const OPERATIONAL_ALERTS: AlertRecord[] = [
  // 1. Critical Alerts
  {
    id: "ALT-2026-001",
    cyclone_name: "Deep Depression (Arnab Precursor)",
    region: "Kalingapatnam & Srikakulam Coastal Strip",
    basin_key: "BAY_OF_BENGAL",
    state_key: "ANDHRA_PRADESH",
    risk_level: "CRITICAL",
    wind_speed_kt: 35,
    wind_speed_kmh: 65,
    time: "2026-09-24 00:00 UTC",
    headline: "Coastal Landfall Crossing & Gale Force Inundation",
    description: "Core eyewall crossing initiated southwest of Kalingapatnam. Destructive coastal gusts (65–75 km/h) paired with 0.8m–1.2m astronomical surge. Immediate suspension of port handling and total cessation of offshore operations enforced.",
    bulletin_source: "IMD RSMC New Delhi Special Tropical Cyclone Bulletin 14",
  },
  {
    id: "ALT-2026-002",
    cyclone_name: "Deep Depression (Arnab Precursor)",
    region: "South Odisha (Gopalpur, Ganjam, Gajapati)",
    basin_key: "BAY_OF_BENGAL",
    state_key: "ODISHA",
    risk_level: "CRITICAL",
    wind_speed_kt: 32,
    wind_speed_kmh: 60,
    time: "2026-09-24 03:30 UTC",
    headline: "Extremely Heavy Rainfall & Flash Inundation Alert",
    description: "Intense feeder bands delivering rainfall rates exceeding 25 mm/hr across lower catchments of the Rushikulya and Vansadhara rivers. High vulnerability to slope destabilization and localized flash runoff in hilly tracts.",
    bulletin_source: "State Emergency Operations Centre (SEOC) Bhubaneswar",
  },

  // 2. High-Risk Alerts
  {
    id: "ALT-2026-003",
    cyclone_name: "Deep Depression (Arnab Precursor)",
    region: "North Coastal Andhra Pradesh (Visakhapatnam)",
    basin_key: "BAY_OF_BENGAL",
    state_key: "ANDHRA_PRADESH",
    risk_level: "HIGH",
    wind_speed_kt: 28,
    wind_speed_kmh: 52,
    time: "2026-09-23 18:00 UTC",
    headline: "Squally Winds & Port Signal Cautionary Warning",
    description: "Local Cautionary Signal No. 3 hoisted at Visakhapatnam and Gangavaram ports. High wave run-up (2.8m–3.4m) along beaches; small craft, mechanized trawlers, and beachside structures to remain secured.",
    bulletin_source: "Cyclone Warning Centre (CWC) Visakhapatnam",
  },
  {
    id: "ALT-2026-004",
    cyclone_name: "Deep Depression (Arnab Precursor)",
    region: "Interior Odisha (Rayagada & Nuapada Remnant Corridor)",
    basin_key: "BAY_OF_BENGAL",
    state_key: "ODISHA",
    risk_level: "HIGH",
    wind_speed_kt: 25,
    wind_speed_kmh: 46,
    time: "2026-09-24 12:00 UTC",
    headline: "Inland Remnant Track & Drainage Inundation",
    description: "Depression center propagating northwestward into Odisha interior. Sustained rainfall accumulations of 120–180 mm forecasted over 24 hours, presenting risks of rural waterlogging and road link washouts.",
    bulletin_source: "IMD Bhubaneswar Meteorological Centre",
  },

  // 3. Moderate Alerts
  {
    id: "ALT-2026-005",
    cyclone_name: "South-East Bay Disturbance Area",
    region: "South-East Bay of Bengal / Andaman Sea",
    basin_key: "BAY_OF_BENGAL",
    state_key: "CENTRAL_INDIA",
    risk_level: "MODERATE",
    wind_speed_kt: 20,
    wind_speed_kmh: 37,
    time: "2026-09-29 12:00 UTC",
    headline: "Deep Oceanic Thermal Reservoir Cyclogenesis Advisory",
    description: "Surface waters at 29.6°C with 26°C isotherm depth exceeding 80m. Low-level cyclonic vortex consolidation monitored; low vertical wind shear corridor could favor marginal organization over the next 72–120 hours.",
    bulletin_source: "IMD Tropical Weather Outlook (TWO)",
  },
  {
    id: "ALT-2026-006",
    cyclone_name: "Coastal West Bengal Sector",
    region: "Northwest Bay / Digha & Sundarbans",
    basin_key: "BAY_OF_BENGAL",
    state_key: "WEST_BENGAL",
    risk_level: "MODERATE",
    wind_speed_kt: 18,
    wind_speed_kmh: 33,
    time: "2026-09-29 06:00 UTC",
    headline: "Moisture Inflow Squall Watch & Tidal Swell",
    description: "Strong southerly low-level wind surge feeding peripheral convective bands into the Gangetic delta. Fishermen advised against venturing into deep outer sea zones through Wednesday morning.",
    bulletin_source: "Regional Meteorological Centre (RMC) Kolkata",
  },

  // 4. Informational Alerts
  {
    id: "ALT-2026-007",
    cyclone_name: "Arabian Sea Synoptic Watch",
    region: "East-Central Arabian Sea",
    basin_key: "ARABIAN_SEA",
    state_key: "CENTRAL_INDIA",
    risk_level: "INFORMATIONAL",
    wind_speed_kt: 12,
    wind_speed_kmh: 22,
    time: "2026-09-29 15:00 UTC",
    headline: "Synoptic Shear Regime Analysis: Genesis Inhibited",
    description: "Environmental vertical wind shear remains hostile at 18.6 kt in the mid-troposphere, preventing cloud convective cluster alignment. Basin expected to remain in a stable, non-cyclonic state over the 5-day horizon.",
    bulletin_source: "RSMC Fair-Weather Synoptic Assessment",
  },
  {
    id: "ALT-2026-008",
    cyclone_name: "Coromandel Sector Watch",
    region: "North Tamil Nadu Coastline (Chennai to Nagapattinam)",
    basin_key: "BAY_OF_BENGAL",
    state_key: "TAMIL_NADU",
    risk_level: "INFORMATIONAL",
    wind_speed_kt: 10,
    wind_speed_kmh: 19,
    time: "2026-09-29 17:30 UTC",
    headline: "Routine Coastal Surveillance & Port Operations Normal",
    description: "Surface wind fields remain light and variable. Sea conditions slight to moderate; routine merchant shipping and offshore transit operations proceed unimpeded across southern regional ports.",
    bulletin_source: "Area Cyclone Warning Centre (ACWC) Chennai",
  },
];

export default function AlertsManagementPage() {
  const [selectedRisk, setSelectedRisk] = useState<RiskTier | "ALL">("ALL");
  const [selectedRegion, setSelectedRegion] = useState<RegionFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 1-Click RSMC Bulletin Dissemination Function
  const handleExportBulletin = (alert: AlertRecord) => {
    const formattedBulletin = `
======================================================================
INDIA METEOROLOGICAL DEPARTMENT / RSMC NEW DELHI
TROPICAL WEATHER ADVISORY & COASTAL WARNING BULLETIN
PLATFORM: SABER EARLY WARNING SYSTEM
REFERENCE IDENTIFIER: ${alert.id}
TIME OF ISSUE: ${alert.time}
----------------------------------------------------------------------
1. TARGET CYCLONIC SYSTEM: ${alert.cyclone_name.toUpperCase()}
2. GEOGRAPHIC IMPACT SECTOR: ${alert.region.toUpperCase()}
3. OPERATIONAL WARNING TIER: ${alert.risk_level} ALERT
4. ESTIMATED PEAK SUSTAINED SURFACE WIND: ${alert.wind_speed_kt} KT (${alert.wind_speed_kmh} KM/H)
5. ISSUING AUTHORITY: ${alert.bulletin_source}

SYNOPSIS & ACTION DIRECTIVE:
${alert.headline}
${alert.description}

DISASTER MANAGEMENT DIRECTIVE:
Activate district emergency operation centers (DEOC). Secure offshore 
vessels, suspend small craft navigation, and alert coastal taluks.
======================================================================`.trim();

    navigator.clipboard.writeText(formattedBulletin);
    setCopiedId(alert.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const counts = useMemo(() => {
    return {
      all: OPERATIONAL_ALERTS.length,
      critical: OPERATIONAL_ALERTS.filter((a) => a.risk_level === "CRITICAL").length,
      high: OPERATIONAL_ALERTS.filter((a) => a.risk_level === "HIGH").length,
      moderate: OPERATIONAL_ALERTS.filter((a) => a.risk_level === "MODERATE").length,
      informational: OPERATIONAL_ALERTS.filter((a) => a.risk_level === "INFORMATIONAL").length,
    };
  }, []);

  const filteredAlerts = useMemo(() => {
    return OPERATIONAL_ALERTS.filter((alert) => {
      if (selectedRisk !== "ALL" && alert.risk_level !== selectedRisk) {
        return false;
      }
      if (selectedRegion !== "ALL") {
        const matchesBasin = alert.basin_key === selectedRegion;
        const matchesState = alert.state_key === selectedRegion;
        if (!matchesBasin && !matchesState) return false;
      }
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const combined = `${alert.cyclone_name} ${alert.region} ${alert.headline} ${alert.description}`.toLowerCase();
        if (!combined.includes(query)) return false;
      }
      return true;
    });
  }, [selectedRisk, selectedRegion, searchQuery]);

  const getTierTheme = (tier: RiskTier) => {
    switch (tier) {
      case "CRITICAL":
        return {
          border: "border-red-300",
          bg: "bg-red-50/70",
          badge: "bg-red-600 text-white",
          text: "text-red-900",
          indicator: "bg-red-600",
          icon: <ShieldAlert className="w-5 h-5 text-red-600" />,
        };
      case "HIGH":
        return {
          border: "border-amber-300",
          bg: "bg-amber-50/70",
          badge: "bg-amber-500 text-white",
          text: "text-amber-900",
          indicator: "bg-amber-500",
          icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
        };
      case "MODERATE":
        return {
          border: "border-yellow-300",
          bg: "bg-yellow-50/70",
          badge: "bg-yellow-400 text-slate-900",
          text: "text-yellow-900",
          indicator: "bg-yellow-500",
          icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
        };
      case "INFORMATIONAL":
        return {
          border: "border-blue-200",
          bg: "bg-blue-50/50",
          badge: "bg-blue-600 text-white",
          text: "text-blue-900",
          indicator: "bg-blue-500",
          icon: <Info className="w-5 h-5 text-blue-600" />,
        };
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50 font-sans p-6 pb-20 select-none text-slate-800">
      <main className="max-w-7xl mx-auto w-full space-y-6">
        {/* Tier Metric Counters */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button
            onClick={() => setSelectedRisk(selectedRisk === "CRITICAL" ? "ALL" : "CRITICAL")}
            className={`p-4 rounded-2xl border text-left transition-all ${
              selectedRisk === "CRITICAL"
                ? "bg-red-50 border-red-400 shadow-sm ring-2 ring-red-400/20"
                : "bg-white border-slate-200 hover:border-red-200 hover:bg-red-50/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-red-600">Critical Alerts</span>
              <ShieldAlert className="w-4 h-4 text-red-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">{counts.critical}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Landfall & Direct Coastal Gale</div>
          </button>

          <button
            onClick={() => setSelectedRisk(selectedRisk === "HIGH" ? "ALL" : "HIGH")}
            className={`p-4 rounded-2xl border text-left transition-all ${
              selectedRisk === "HIGH"
                ? "bg-amber-50 border-amber-400 shadow-sm ring-2 ring-amber-400/20"
                : "bg-white border-slate-200 hover:border-amber-200 hover:bg-amber-50/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">High-Risk Alerts</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">{counts.high}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Severe Squall & Flash Inflow</div>
          </button>

          <button
            onClick={() => setSelectedRisk(selectedRisk === "MODERATE" ? "ALL" : "MODERATE")}
            className={`p-4 rounded-2xl border text-left transition-all ${
              selectedRisk === "MODERATE"
                ? "bg-yellow-50 border-yellow-400 shadow-sm ring-2 ring-yellow-400/20"
                : "bg-white border-slate-200 hover:border-yellow-200 hover:bg-yellow-50/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-yellow-700">Moderate Alerts</span>
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">{counts.moderate}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Pre-Genesis & Offshore Caution</div>
          </button>

          <button
            onClick={() => setSelectedRisk(selectedRisk === "INFORMATIONAL" ? "ALL" : "INFORMATIONAL")}
            className={`p-4 rounded-2xl border text-left transition-all ${
              selectedRisk === "INFORMATIONAL"
                ? "bg-blue-50 border-blue-400 shadow-sm ring-2 ring-blue-400/20"
                : "bg-white border-slate-200 hover:border-blue-200 hover:bg-blue-50/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Informational</span>
              <Info className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">{counts.informational}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Synoptic Surveillance Baseline</div>
          </button>
        </section>

        {/* Filters & Search Toolbar */}
        <section className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mr-2">
              <Filter className="w-3.5 h-3.5 text-blue-600" /> Region:
            </span>

            {(
              [
                ["ALL", "All Regions"],
                ["BAY_OF_BENGAL", "Bay of Bengal"],
                ["ARABIAN_SEA", "Arabian Sea"],
                ["ANDHRA_PRADESH", "Andhra Pradesh"],
                ["ODISHA", "Odisha"],
                ["WEST_BENGAL", "West Bengal"],
                ["TAMIL_NADU", "Tamil Nadu"],
              ] as [RegionFilter, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedRegion(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  selectedRegion === key
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cyclone, district, or keyword..."
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>

            <button
              onClick={() => {
                setSelectedRisk("ALL");
                setSelectedRegion("ALL");
                setSearchQuery("");
              }}
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 transition"
              title="Reset Filters"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* Alerts Feed List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
            <span>
              Showing <strong>{filteredAlerts.length}</strong> active operational advisories
            </span>
            <span>Sorted by Warning Urgency & Observation Timestamp</span>
          </div>

          {filteredAlerts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Alerts Match the Active Filters</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No cyclonic advisories or coastal warnings match the selected severity tier and regional constraints.
              </p>
              <button
                onClick={() => {
                  setSelectedRisk("ALL");
                  setSelectedRegion("ALL");
                  setSearchQuery("");
                }}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const theme = getTierTheme(alert.risk_level);

              return (
                <article
                  key={alert.id}
                  className={`bg-white rounded-2xl border ${theme.border} shadow-2xs hover:shadow-md transition-all overflow-hidden`}
                >
                  <div className={`p-4 ${theme.bg} border-b ${theme.border} flex flex-col md:flex-row md:items-center justify-between gap-2`}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-white shadow-2xs shrink-0">{theme.icon}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm font-bold text-slate-900">{alert.cyclone_name}</h2>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase ${theme.badge}`}>
                            {alert.risk_level} ALERT
                          </span>
                        </div>
                        <div className="text-xs font-medium text-slate-600 mt-0.5 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{alert.region}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs">
                        <Wind className="w-3.5 h-3.5 text-blue-600" />
                        <span className="font-bold text-slate-900">{alert.wind_speed_kt} kt</span>
                        <span className="text-[10px] text-slate-500">({alert.wind_speed_kmh} km/h)</span>
                      </div>

                      <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-slate-700">{alert.time}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="text-sm font-bold text-slate-900">{alert.headline}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{alert.description}</p>

                    <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-2">
                      <div className="flex items-center gap-3">
                        <span>Authority: <strong className="text-slate-700">{alert.bulletin_source}</strong></span>
                        <span className="font-mono text-[10px] text-slate-400">ID: {alert.id}</span>
                      </div>

                      <button
                        onClick={() => handleExportBulletin(alert)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-xs font-semibold transition cursor-pointer shadow-2xs"
                      >
                        {copiedId === alert.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Copied to Clipboard!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Export RSMC Bulletin</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
}