"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldAlert,
  MapPin,
  Waves,
  History,
  CheckCircle2,
  Radio,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [daemonStatus, setDaemonStatus] = useState<"ACTIVE" | "STALLED" | "OFFLINE">("ACTIVE");

  useEffect(() => {
    const checkHealth = () => {
      fetch("http://localhost:8000/api/v1/storms/system/health")
        .then((res) => res.json())
        .then((data) => {
          if (data.daemon_sync === "ACTIVE") {
            setDaemonStatus("ACTIVE");
          } else if (data.redis === "ONLINE") {
            setDaemonStatus("STALLED");
          } else {
            setDaemonStatus("OFFLINE");
          }
        })
        .catch(() => setDaemonStatus("OFFLINE"));
    };

    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: "Live Map", href: "/", icon: MapPin },
    { name: "Live Cyclone", href: "/live-cyclone", icon: Waves, badge: "Surveillance" },
    { name: "Alert Center", href: "/alerts", icon: ShieldAlert, highlight: true },
    { name: "Historical Catalog", href: "/historical", icon: History },
    { name: "Validation Metrics", href: "/validation", icon: CheckCircle2 },
  ];

  return (
    <header className="z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xl px-4 md:px-6 py-2.5 flex items-center justify-between transition-colors duration-200">
      {/* Brand Identity */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-50 border border-blue-200/80 rounded-xl shadow-2xs">
          <ShieldAlert className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-sm md:text-base font-bold tracking-wide flex items-center gap-2 text-slate-900 leading-tight">
            SABER
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80 font-bold uppercase">
              OPERATIONAL
            </span>
          </h1>
          <p className="text-[11px] text-slate-500 hidden sm:block">
            North Indian Ocean Tropical Cyclone Early Warning System
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex items-center gap-1.5 sm:gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.highlight) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs ${
                  isActive
                    ? "bg-red-600 text-white ring-2 ring-red-400/30"
                    : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-red-600"}`} />
                <span>{item.name}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/70"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.name}</span>
              {item.badge && !isActive && (
                <span className="hidden md:inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
              )}
            </Link>
          );
        })}

        {/* Live Status Indicator */}
        <div className="hidden lg:flex items-center gap-2 pl-3 ml-2 border-l border-slate-200/80 font-medium text-xs font-mono">
  <span
    className={`w-2 h-2 rounded-full ${
      daemonStatus === "ACTIVE"
        ? "bg-emerald-500 animate-pulse"
        : daemonStatus === "STALLED"
        ? "bg-amber-500"
        : "bg-rose-500"
    }`}
  />
  <span className={daemonStatus === "ACTIVE" ? "text-slate-700" : "text-amber-700 font-semibold"}>
    {daemonStatus === "ACTIVE"
      ? "Sync Daemon Active"
      : daemonStatus === "STALLED"
      ? "Daemon Stalled"
      : "Backend Offline"}
  </span>
</div>
      </nav>
    </header>
  );
}