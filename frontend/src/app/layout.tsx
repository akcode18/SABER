import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SABER | North Indian Ocean Cyclone Monitoring System",
  description: "Operational Tropical Cyclone Early Warning Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full overflow-hidden">
      <body className={`${inter.className} h-screen w-screen flex flex-col overflow-hidden bg-slate-100 text-slate-800`}>
        {/* Top Navbar */}
        <Navbar />
        {/* Viewport container strictly restricted to remaining height below navbar */}
        <main className="flex-1 min-h-0 w-full relative overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}