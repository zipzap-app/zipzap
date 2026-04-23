"use client";
import Link from "next/link";

const trending = [
  { tag: "#tecnologia", posts: "128k" },
  { tag: "#musica", posts: "94k" },
  { tag: "#moda", posts: "76k" },
  { tag: "#fotografia", posts: "61k" },
  { tag: "#cucina", posts: "54k" },
  { tag: "#sport", posts: "48k" },
  { tag: "#arte", posts: "39k" },
  { tag: "#viaggi", posts: "33k" },
];

const creators = [
  { initials: "VB", name: "vale.beats", cat: "Musica", color: "#1a0020", followers: "98k" },
  { initials: "AS", name: "astro.sky", cat: "Fotografia", color: "#0a1525", followers: "72k" },
  { initials: "MR", name: "mario.reviews", cat: "Tech", color: "#002010", followers: "54k" },
  { initials: "GF", name: "giada.fashion", cat: "Moda", color: "#1a0010", followers: "41k" },
];

export default function Explore() {
  return (
    <div className="fixed inset-0 overflow-y-auto" style={{ background: "#0a0a0a" }}>
      <div className="max-w-2xl mx-auto px-4 py-8 pb-28">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/feed" className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-xl"
              style={{ width: 36, height: 36, background: "#FF4D4D" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <polygon points="10,1 6,8 9,8 5,15 13,6 9,6" fill="white" />
              </svg>
            </div>
            <span className="text-xl font-black text-white tracking-tight">
              Zip<span style={{ color: "#FF4D4D" }}>Zap</span>
            </span>
          </Link>
        </div>

        {/* Search bar */}
        <div className="relative mb-8">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
              stroke="rgba(255,255,255,.3)" strokeWidth="1.5">
              <circle cx="7" cy="7" r="5" />
              <path d="M11 11l3 3" strokeLinecap="round" />
            </svg>
          </div>
          <input type="text" placeholder="Cerca creator, prodotti, hashtag..."
            className="w-full pl-10 pr-4 py-4 rounded-2xl text-white text-sm outline-none"
            style={{ background: "#1a1a1a", border: "1.5px solid rgba(255,255,255,.08)" }} />
        </div>

        {/* Trending */}
        <div className="mb-8">
          <div className="text-xs font-bold mb-4"
            style={{ color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: ".5px" }}>
            Trending ora
          </div>
          <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {trending.map((t, i) => (
              <div key={t.tag} className="flex items-center justify-between rounded-xl px-4 py-3 cursor-pointer"
                style={{ background: "#111", border: "0.5px solid rgba(255,255,255,.07)" }}>
                <div>
                  <div className="font-bold text-sm text-white">{t.tag}</div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,.3)" }}>{t.posts} post</div>
                </div>
                <div className="font-black text-lg" style={{ color: "rgba(255,77,77,.3)" }}>#{i + 1}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Creator suggeriti */}
        <div>
          <div className="text-xs font-bold mb-4"
            style={{ color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: ".5px" }}>
            Creator suggeriti
          </div>
          <div className="flex flex-col gap-3">
            {creators.map((c) => (
              <div key={c.name} className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: "#111", border: "0.5px solid rgba(255,255,255,.07)" }}>
                <div className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
                  style={{ width: 44, height: 44, background: c.color, fontSize: 14 }}>
                  {c.initials}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-white text-sm">@{c.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,.35)" }}>{c.cat} · {c.followers} follower</div>
                </div>
                <button className="px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ border: "1.5px solid #FF4D4D", color: "#FF4D4D" }}>
                  + Segui
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navbar mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around px-4 pb-6 pt-3"
        style={{ background: "rgba(0,0,0,.9)", borderTop: "0.5px solid rgba(255,255,255,.08)" }}>
        {[
          { href: "/feed", label: "Home", icon: <path d="M2.5 8.5l7.5-5.5 7.5 5.5v9H2.5z" /> },
          { href: "/explore", label: "Esplora", active: true, icon: <><circle cx="10" cy="10" r="6" /><path d="M14 14l2.5 2.5" strokeLinecap="round" /></> },
          { href: "/store", label: "Store", isStore: true },
          { href: "/profile", label: "Profilo", icon: <><circle cx="10" cy="7" r="3.5" /><path d="M3 18c0-3.5 3.1-6 7-6s7 2.5 7 6" /></> },
        ].map((item, i) => (
          <a key={i} href={item.href} className="flex flex-col items-center gap-1">
            {item.isStore ? (
              <div className="flex items-center justify-center rounded-lg px-2 py-1" style={{ background: "#FF4D4D" }}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <polygon points="10,1 6,8 9,8 5,15 13,6 9,6" fill="white" />
                </svg>
                <span className="text-white font-black text-xs ml-1">Store</span>
              </div>
            ) : (
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none"
                stroke={item.active ? "#fff" : "rgba(255,255,255,.35)"} strokeWidth={item.active ? "1.8" : "1.6"}>
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

      {/* Navbar desktop sinistra */}
      <div className="hidden md:flex fixed left-0 top-0 bottom-0 flex-col items-start gap-4 px-6 py-8"
        style={{ width: 220, background: "rgba(0,0,0,.6)", borderRight: "0.5px solid rgba(255,255,255,.07)" }}>
        <Link href="/" className="flex items-center gap-2 mb-6">
          <div className="flex items-center justify-center rounded-xl" style={{ width: 32, height: 32, background: "#FF4D4D" }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <polygon points="10,1 6,8 9,8 5,15 13,6 9,6" fill="white" />
            </svg>
          </div>
          <span className="text-xl font-black text-white tracking-tight">Zip<span style={{ color: "#FF4D4D" }}>Zap</span></span>
        </Link>
        {[
          { href: "/feed", label: "Home", icon: <path d="M2.5 8.5l7.5-5.5 7.5 5.5v9H2.5z" /> },
          { href: "/explore", label: "Esplora", active: true, icon: <><circle cx="10" cy="10" r="6" /></> },
          { href: "/store", label: "Zap Store", isStore: true },
          { href: "/profile", label: "Profilo", icon: <><circle cx="10" cy="7" r="3.5" /><path d="M3 18c0-3.5 3.1-6 7-6s7 2.5 7 6" /></> },
        ].map((item, i) => (
          <a key={i} href={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full"
            style={{ background: item.active ? "rgba(255,255,255,.1)" : "transparent" }}>
            {item.isStore ? (
              <div className="flex items-center justify-center rounded-lg" style={{ width: 24, height: 24, background: "#FF4D4D" }}>
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                  <polygon points="10,1 6,8 9,8 5,15 13,6 9,6" fill="white" />
                </svg>
              </div>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
                stroke="rgba(255,255,255,.7)" strokeWidth="1.6">{item.icon}</svg>
            )}
            <span className="text-sm font-semibold" style={{ color: item.isStore ? "#FF4D4D" : "rgba(255,255,255,.7)" }}>
              {item.label}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}