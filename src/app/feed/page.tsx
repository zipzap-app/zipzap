"use client";
import { useState } from "react";

const posts = [
  {
    id: 1,
    user: "astro.sky",
    initials: "AS",
    color: "#0a1525",
    caption: "Via Lattea dal Gran Sasso — 4 ore di esposizione, zero filtri",
    hashtags: "#astronomia #fotografia #italia",
    likes: "41k", comments: "3.1k", shares: "8.7k",
    hasLink: false, type: "LIBERO",
  },
  {
    id: 2,
    user: "mario.reviews",
    initials: "MR",
    color: "#001510",
    caption: "Il miglior auricolare sotto i 50€ — recensione onesta dopo 3 mesi",
    hashtags: "#tech #gadget #recensione",
    likes: "5.6k", comments: "387", shares: "1.1k",
    hasLink: true, linkName: "Sony WF-1000XM5 · €249", linkMeta: "amazon.it · browser nativo", earn: "+€6", type: "LINK",
  },
  {
    id: 3,
    user: "vale.beats",
    initials: "VB",
    color: "#150010",
    caption: "Beat fatta in 60 secondi con samples di cucina — padella, bollitore, forchetta",
    hashtags: "#musica #produzione #beatmaking",
    likes: "98k", comments: "14k", shares: "22k",
    hasLink: false, type: "LIBERO",
  },
];

export default function Feed() {
  const [current, setCurrent] = useState(0);
  const [liked, setLiked] = useState<number[]>([]);
  const post = posts[current];

  function toggleLike() {
    setLiked((prev) => prev.includes(post.id) ? prev.filter((id) => id !== post.id) : [...prev, post.id]);
  }

  return (
    <div className="fixed inset-0 flex" style={{ background: `linear-gradient(170deg, ${post.color} 0%, #000 100%)`, transition: "background 0.4s" }}>

      {/* Overlay */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,.9) 0%, rgba(0,0,0,.1) 50%, rgba(0,0,0,.4) 100%)" }} />

      {/* Navbar sinistra — solo desktop */}
      <div className="hidden md:flex flex-col items-start gap-6 px-6 py-8 relative z-30" style={{ width: 240, flexShrink: 0 }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center justify-center rounded-xl" style={{ width: 36, height: 36, background: "#FF4D4D" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><polygon points="10,1 6,8 9,8 5,15 13,6 9,6" fill="white" /></svg>
          </div>
          <span className="text-2xl font-black text-white tracking-tight">Zip<span style={{ color: "#FF4D4D" }}>Zap</span></span>
        </div>
        {[
          { label: "Home", href: "/feed", icon: <path d="M2.5 8.5l7.5-5.5 7.5 5.5v9H2.5z" />, active: true },
          { label: "Esplora", href: "/explore", icon: <><circle cx="10" cy="10" r="6" /><path d="M14 14l2.5 2.5" strokeLinecap="round" /></> },
          { label: "Zap Store", href: "/store", isStore: true },
          { label: "Profilo", href: "/profile", icon: <><circle cx="10" cy="7" r="3.5" /><path d="M3 18c0-3.5 3.1-6 7-6s7 2.5 7 6" /></> },
        ].map((item, i) => (
          <a key={i} href={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full"
            style={{ background: item.active ? "rgba(255,255,255,.1)" : "transparent" }}>
            {item.isStore ? (
              <div className="flex items-center justify-center rounded-lg" style={{ width: 28, height: 28, background: "#FF4D4D" }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><polygon points="10,1 6,8 9,8 5,15 13,6 9,6" fill="white" /></svg>
              </div>
            ) : (
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="rgba(255,255,255,.8)" strokeWidth="1.6">{item.icon}</svg>
            )}
            <span className="font-semibold text-sm" style={{ color: item.isStore ? "#FF4D4D" : "rgba(255,255,255,.8)" }}>{item.label}</span>
          </a>
        ))}
      </div>

      {/* Feed center */}
      <div className="flex-1 relative flex flex-col justify-end pb-24 md:pb-8 px-4 md:px-12 z-10">

        {/* Topbar mobile */}
        <div className="md:hidden absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-10 pb-2 z-20">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-lg" style={{ width: 26, height: 26, background: "#FF4D4D" }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><polygon points="10,1 6,8 9,8 5,15 13,6 9,6" fill="white" /></svg>
            </div>
            <span className="font-black text-white text-lg tracking-tight">Zip<span style={{ color: "#FF4D4D" }}>Zap</span></span>
          </div>
          <div className="flex gap-3 text-xs" style={{ color: "rgba(255,255,255,.5)" }}>
            <span className="text-white border-b border-white pb-0.5">Per te</span>
            <span>Seguiti</span>
          </div>
        </div>

        {/* Tab desktop */}
        <div className="hidden md:flex absolute top-6 left-1/2 -translate-x-1/2 gap-6 z-20">
          <span className="text-white font-semibold text-sm border-b-2 border-white pb-1 cursor-pointer">Per te</span>
          <span className="font-semibold text-sm pb-1 cursor-pointer" style={{ color: "rgba(255,255,255,.4)" }}>Seguiti</span>
        </div>

        {/* Type tag */}
        <div className="absolute top-10 right-4 md:top-6 md:right-8 z-20 text-xs font-bold px-2 py-0.5 rounded"
          style={{
            background: post.hasLink ? "rgba(255,77,77,.2)" : "rgba(255,255,255,.1)",
            color: post.hasLink ? "#FF4D4D" : "rgba(255,255,255,.5)",
            border: post.hasLink ? "1px solid rgba(255,77,77,.3)" : "none",
          }}>
          {post.type}
        </div>

        {/* Bottom content */}
        <div className="flex flex-col gap-3 max-w-lg">
          <div className="flex items-center gap-2">
            <div className="rounded-full border-2 flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
              style={{ width: 42, height: 42, background: post.color, borderColor: "rgba(255,255,255,.8)" }}>
              {post.initials}
            </div>
            <span className="font-bold text-white text-base">{post.user}</span>
            <span className="text-xs font-semibold rounded-full px-3 py-1 ml-1"
              style={{ border: "1.5px solid rgba(255,255,255,.7)", color: "#fff" }}>+ Segui</span>
          </div>
          <p className="text-sm md:text-base font-medium" style={{ color: "rgba(255,255,255,.9)", lineHeight: 1.55, maxWidth: 420 }}>
            {post.caption}
          </p>
          <p className="text-sm" style={{ color: "rgba(255,255,255,.4)" }}>{post.hashtags}</p>
          {post.hasLink && (
            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 cursor-pointer"
              style={{ background: "rgba(0,0,0,.5)", border: "1px solid rgba(255,77,77,.45)", maxWidth: 320 }}>
              <div className="rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ width: 32, height: 32, background: "rgba(255,77,77,.15)" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#FF4D4D" strokeWidth="1.4">
                  <path d="M5 7a2 2 0 0 0 2.8 0l1.4-1.4a2 2 0 0 0-2.8-2.8L5.5 3.4" strokeLinecap="round" />
                  <path d="M9 7a2 2 0 0 0-2.8 0L4.8 8.4A2 2 0 0 0 7.6 11.2L8.5 10.3" strokeLinecap="round" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white truncate">{post.linkName}</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,.4)" }}>{post.linkMeta}</div>
              </div>
              <div className="text-xs font-bold text-white rounded px-2 py-1" style={{ background: "#FF4D4D" }}>APRI</div>
            </div>
          )}
        </div>
      </div>

      {/* Side actions — destra */}
      <div className="absolute right-4 md:right-8 bottom-28 md:bottom-16 z-20 flex flex-col items-center gap-5">
        <div className="flex flex-col items-center">
          <div className="rounded-full border-2 border-white flex items-center justify-center font-bold text-white text-sm"
            style={{ width: 46, height: 46, background: post.color }}>
            {post.initials}
          </div>
          <div className="rounded-full flex items-center justify-center font-bold text-white"
            style={{ width: 18, height: 18, background: "#FF4D4D", fontSize: 12, marginTop: -9 }}>+</div>
        </div>
        <button onClick={toggleLike} className="flex flex-col items-center gap-1">
          <div className="rounded-full flex items-center justify-center"
            style={{ width: 48, height: 48, background: "rgba(255,255,255,.12)" }}>
            <svg width="22" height="22" viewBox="0 0 20 20"
              fill={liked.includes(post.id) ? "#FF4D4D" : "none"}
              stroke={liked.includes(post.id) ? "#FF4D4D" : "#fff"} strokeWidth="1.6">
              <path d="M10 17S4 13.5 4 8a4.5 4.5 0 0 1 6-4.24A4.5 4.5 0 0 1 16 8C16 13.5 10 17 10 17z" />
            </svg>
          </div>
          <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,.7)" }}>{post.likes}</span>
        </button>
        <div className="flex flex-col items-center gap-1">
          <div className="rounded-full flex items-center justify-center"
            style={{ width: 48, height: 48, background: "rgba(255,255,255,.12)" }}>
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="1.6">
              <path d="M3 3h14v10H3z" /><path d="M7 17h6M10 13v4" />
            </svg>
          </div>
          <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,.7)" }}>{post.comments}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="rounded-full flex items-center justify-center"
            style={{ width: 48, height: 48, background: "rgba(255,255,255,.12)" }}>
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="1.6">
              <path d="M17 7L10 4 3 7l7 3.5L17 7z" /><path d="M3 11l7 3.5L17 11M3 15l7 3.5L17 15" />
            </svg>
          </div>
          <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,.7)" }}>{post.shares}</span>
        </div>
        {post.hasLink && (
          <div className="flex flex-col items-center gap-1">
            <div className="rounded-full px-2 py-1"
              style={{ background: "rgba(29,158,117,.25)", border: "1px solid rgba(29,158,117,.5)", color: "#4dffb8", fontSize: 10, fontWeight: 700 }}>
              {post.earn}
            </div>
            <span style={{ color: "#4dffb8", fontSize: 9, fontWeight: 700 }}>live</span>
          </div>
        )}
      </div>

      {/* Arrows navigazione */}
      <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
        <button onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          className="flex items-center justify-center rounded-full"
          style={{ width: 36, height: 36, background: "rgba(255,255,255,.1)", opacity: current === 0 ? .3 : 1 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="1.8">
            <path d="M2 9l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button onClick={() => setCurrent((c) => Math.min(posts.length - 1, c + 1))}
          className="flex items-center justify-center rounded-full"
          style={{ width: 36, height: 36, background: "rgba(255,255,255,.1)", opacity: current === posts.length - 1 ? .3 : 1 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="1.8">
            <path d="M2 5l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Navbar mobile bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around px-4 pb-6 pt-3"
        style={{ background: "rgba(0,0,0,.85)", borderTop: "0.5px solid rgba(255,255,255,.08)" }}>
        {[
          { href: "/feed", label: "Home", active: true, icon: <path d="M2.5 8.5l7.5-5.5 7.5 5.5v9H2.5z" /> },
          { href: "/explore", label: "Esplora", icon: <><circle cx="10" cy="10" r="6" /><path d="M14 14l2.5 2.5" strokeLinecap="round" /></> },
          { href: "/store", label: "Store", isStore: true },
          { href: "/profile", label: "Profilo", icon: <><circle cx="10" cy="7" r="3.5" /><path d="M3 18c0-3.5 3.1-6 7-6s7 2.5 7 6" /></> },
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