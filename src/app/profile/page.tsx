"use client";
import { useState } from "react";
import Link from "next/link";

const posts = [
  { id: 1, color: "#0d1220", hasLink: false, views: "41k" },
  { id: 2, color: "#150d1a", hasLink: true, views: "5.6k" },
  { id: 3, color: "#0d1a10", hasLink: false, views: "12k" },
  { id: 4, color: "#1a1200", hasLink: true, views: "2.2k" },
  { id: 5, color: "#0a1520", hasLink: false, views: "41k" },
  { id: 6, color: "#1a0a0a", hasLink: false, views: "8.8k" },
];

export default function Profile() {
  const [activeTab, setActiveTab] = useState("video");

  return (
    <div className="fixed inset-0 flex" style={{ background: "#0a0a0a" }}>

      {/* Navbar desktop sinistra */}
      <div className="hidden md:flex flex-col items-start gap-4 px-6 py-8 flex-shrink-0"
        style={{ width: 220, background: "rgba(0,0,0,.6)", borderRight: "0.5px solid rgba(255,255,255,.07)" }}>
        <Link href="/" className="flex items-center gap-2 mb-6">
          <div className="flex items-center justify-center rounded-xl"
            style={{ width: 32, height: 32, background: "#FF4D4D" }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <polygon points="10,1 6,8 9,8 5,15 13,6 9,6" fill="white" />
            </svg>
          </div>
          <span className="text-xl font-black text-white tracking-tight">
            Zip<span style={{ color: "#FF4D4D" }}>Zap</span>
          </span>
        </Link>
        {[
          { href: "/feed", label: "Home", icon: <path d="M2.5 8.5l7.5-5.5 7.5 5.5v9H2.5z" /> },
          { href: "/explore", label: "Esplora", icon: <><circle cx="10" cy="10" r="6" /></> },
          { href: "/store", label: "Zap Store", isStore: true },
          { href: "/profile", label: "Profilo", active: true, icon: <><circle cx="10" cy="7" r="3.5" /><path d="M3 18c0-3.5 3.1-6 7-6s7 2.5 7 6" /></> },
        ].map((item, i) => (
          <a key={i} href={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full"
            style={{ background: item.active ? "rgba(255,255,255,.1)" : "transparent" }}>
            {item.isStore ? (
              <div className="flex items-center justify-center rounded-lg"
                style={{ width: 24, height: 24, background: "#FF4D4D" }}>
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                  <polygon points="10,1 6,8 9,8 5,15 13,6 9,6" fill="white" />
                </svg>
              </div>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
                stroke="rgba(255,255,255,.7)" strokeWidth="1.6">{item.icon}</svg>
            )}
            <span className="text-sm font-semibold"
              style={{ color: item.isStore ? "#FF4D4D" : "rgba(255,255,255,.7)" }}>
              {item.label}
            </span>
          </a>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-28 md:pb-8">

        {/* Cover */}
        <div className="relative" style={{ height: 180 }}>
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(135deg, #1a0000 0%, #2a0808 50%, #0a0a0a 100%)" }} />
          <svg className="absolute inset-0 w-full h-full opacity-20"
            viewBox="0 0 600 180" preserveAspectRatio="xMidYMid slice">
            <circle cx="520" cy="20" r="160" fill="#FF4D4D" />
            <circle cx="60" cy="160" r="120" fill="#FF4D4D" />
          </svg>
          <div className="absolute" style={{ bottom: -40, left: 24 }}>
            <div className="rounded-full flex items-center justify-center font-black text-2xl"
              style={{
                width: 80, height: 80,
                background: "#1a0020",
                color: "#FF4D4D",
                border: "4px solid #0a0a0a",
              }}>
              VB
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="px-6 pt-14 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-black text-white text-xl">Vale Beats</div>
              <div className="text-sm mt-1" style={{ color: "rgba(255,255,255,.4)" }}>
                @vale.beats · Musica &amp; Produzione
              </div>
              <div className="text-sm mt-2" style={{ color: "rgba(255,255,255,.6)", lineHeight: 1.6 }}>
                Produco beat con qualsiasi cosa. Samples di cucina, strada, natura. Tutto può diventare musica.
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-4 py-4"
            style={{ borderTop: "0.5px solid rgba(255,255,255,.08)", borderBottom: "0.5px solid rgba(255,255,255,.08)" }}>
            {[["98k", "Follower"], ["342", "Post"], ["4.2M", "Like"]].map(([n, l]) => (
              <div key={l}>
                <div className="font-black text-white text-lg">{n}</div>
                <div className="text-xs mt-0.5"
                  style={{ color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: ".3px" }}>
                  {l}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <button className="flex-1 py-2.5 rounded-xl font-bold text-white text-sm"
              style={{ border: "1px solid rgba(255,255,255,.2)" }}>
              Modifica profilo
            </button>
            <button className="rounded-xl flex items-center justify-center"
              style={{ width: 42, height: 42, border: "1px solid rgba(255,255,255,.2)" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                stroke="rgba(255,255,255,.6)" strokeWidth="1.3">
                <circle cx="13" cy="2.5" r="1.5" />
                <circle cx="3" cy="8" r="1.5" />
                <circle cx="13" cy="13.5" r="1.5" />
                <path d="M4.5 7l7-3.5M4.5 9l7 3.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Link in bio */}
          <div className="mt-4 rounded-2xl px-4 py-3"
            style={{ background: "rgba(255,77,77,.07)", border: "1px solid rgba(255,77,77,.2)" }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold rounded px-1.5 py-0.5"
                style={{ background: "rgba(255,77,77,.15)", color: "#FF4D4D", letterSpacing: ".3px" }}>
                LINK IN BIO
              </span>
              <span className="text-xs font-bold ml-auto rounded px-1.5 py-0.5"
                style={{ background: "rgba(29,158,117,.1)", color: "rgba(29,158,117,.8)" }}>
                apre nel browser
              </span>
            </div>
            <div className="font-bold text-white text-sm">I miei plugin preferiti</div>
            <div className="text-xs mt-0.5" style={{ color: "rgba(255,77,77,.6)" }}>
              plugin-boutique.com/vale.beats
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6"
          style={{ borderColor: "rgba(255,255,255,.07)" }}>
          {["video", "foto", "testo", "linkati"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="flex-1 text-center py-3 font-semibold capitalize"
              style={{
                fontSize: 12,
                color: activeTab === tab ? "#fff" : "rgba(255,255,255,.3)",
                borderBottom: activeTab === tab ? "2px solid #FF4D4D" : "2px solid transparent",
              }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid px-0" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
          {posts.map((p) => (
            <div key={p.id} className="relative cursor-pointer"
              style={{ aspectRatio: ".56", background: p.color }}>
              {p.hasLink && (
                <div className="absolute flex items-center justify-center rounded"
                  style={{ top: 6, right: 6, width: 16, height: 16, background: "rgba(255,77,77,.85)" }}>
                  <svg width="9" height="9" viewBox="0 0 8 8" fill="none"
                    stroke="#fff" strokeWidth="1.2">
                    <path d="M2 4a1.2 1.2 0 0 0 1.7 0l.8-.8a1.2 1.2 0 0 0-1.7-1.7" strokeLinecap="round" />
                    <path d="M6 4a1.2 1.2 0 0 0-1.7 0L3.5 4.8a1.2 1.2 0 0 0 1.7 1.7" strokeLinecap="round" />
                  </svg>
                </div>
              )}
              <div className="absolute font-bold"
                style={{ bottom: 6, left: 6, fontSize: 10, color: "rgba(255,255,255,.7)" }}>
                {p.views}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navbar mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around px-4 pb-6 pt-3 z-30"
        style={{ background: "rgba(0,0,0,.9)", borderTop: "0.5px solid rgba(255,255,255,.08)" }}>
        {[
          { href: "/feed", label: "Home", icon: <path d="M2.5 8.5l7.5-5.5 7.5 5.5v9H2.5z" /> },
          { href: "/explore", label: "Esplora", icon: <><circle cx="10" cy="10" r="6" /></> },
          { href: "/store", label: "Store", isStore: true },
          { href: "/profile", label: "Profilo", active: true, icon: <><circle cx="10" cy="7" r="3.5" /><path d="M3 18c0-3.5 3.1-6 7-6s7 2.5 7 6" /></> },
        ].map((item, i) => (
          <a key={i} href={item.href} className="flex flex-col items-center gap-1">
            {item.isStore ? (
              <div className="flex items-center justify-center rounded-lg px-2 py-1"
                style={{ background: "#FF4D4D" }}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <polygon points="10,1 6,8 9,8 5,15 13,6 9,6" fill="white" />
                </svg>
                <span className="text-white font-black text-xs ml-1">Store</span>
              </div>
            ) : (
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none"
                stroke={item.active ? "#fff" : "rgba(255,255,255,.35)"}
                strokeWidth={item.active ? "1.8" : "1.6"}>
                {item.icon}
              </svg>
            )}
            {!item.isStore && (
              <span style={{ fontSize: 9, fontWeight: 500, color: item.active ? "#fff" : "rgba(255,255,255,.35)" }}>
                {item.label}
              </span>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}