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
    <div style={{ position: "fixed", inset: 0, overflowY: "auto", background: "#0a0a0a" }}>
      <style>{`
        body { margin: 0; }
        .zz-nav { display: none; }
        .zz-mob-bot { display: flex; }
        .zz-content { margin-left: 0; }
        @media (min-width: 769px) {
          .zz-nav { display: flex; }
          .zz-mob-bot { display: none; }
          .zz-content { margin-left: 220px; }
        }
      `}</style>

      {/* Navbar sinistra desktop */}
      <div className="zz-nav" style={{ position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 40, width: 220, flexDirection: "column", gap: 6, padding: "32px 20px", background: "rgba(10,10,10,.95)", borderRight: "0.5px solid rgba(255,255,255,.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "#FF4D4D", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><polygon points="10,1 6,8 9,8 5,15 13,6 9,6" fill="white" /></svg>
          </div>
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 22, letterSpacing: -1 }}>Zip<span style={{ color: "#FF4D4D" }}>Zap</span></span>
        </div>
        {[
          { label: "Home", href: "/feed" },
          { label: "Esplora", href: "/explore", active: true },
          { label: "Zap Store", href: "/store", isStore: true },
          { label: "Profilo", href: "/profile" },
        ].map((item) => (
          <a key={item.href} href={item.href} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12, background: item.active ? "rgba(255,255,255,.1)" : "transparent", textDecoration: "none", color: item.isStore ? "#FF4D4D" : "rgba(255,255,255,.8)", fontWeight: 600, fontSize: 14 }}>
            {item.label}
          </a>
        ))}
        <a href="/create" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, background: "#FF4D4D", textDecoration: "none", color: "#fff", fontWeight: 700, fontSize: 14, marginTop: 8 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="2"><path d="M7 1v12M1 7h12" strokeLinecap="round" /></svg>
          Crea contenuto
        </a>
      </div>

      {/* Navbar mobile bottom */}
      <div className="zz-mob-bot" style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40, alignItems: "center", justifyContent: "space-around", padding: "10px 16px 28px", background: "rgba(0,0,0,.9)", borderTop: "0.5px solid rgba(255,255,255,.08)" }}>
        {[
          { href: "/feed", label: "Home" },
          { href: "/explore", label: "Esplora", active: true },
          { href: "/create", label: "Crea", isCreate: true },
          { href: "/store", label: "Store", isStore: true },
          { href: "/profile", label: "Profilo" },
        ].map((item) => (
          <a key={item.href} href={item.href} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textDecoration: "none" }}>
            {item.isCreate ? (
              <div style={{ width: 46, height: 32, borderRadius: 10, background: "#FF4D4D", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#fff" strokeWidth="2"><path d="M9 3v12M3 9h12" strokeLinecap="round" /></svg>
              </div>
            ) : item.isStore ? (
              <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,77,77,.12)", border: "1px solid rgba(255,77,77,.25)", borderRadius: 8, padding: "4px 8px" }}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><polygon points="10,1 6,8 9,8 5,15 13,6 9,6" fill="#FF4D4D" /></svg>
                <span style={{ color: "#FF4D4D", fontSize: 11, fontWeight: 700 }}>Store</span>
              </div>
            ) : (
              <>
                <svg width="22" height="22" viewBox="0 0 20 20" fill="none"
                  stroke={item.active ? "#fff" : "rgba(255,255,255,.35)"}
                  strokeWidth={item.active ? "1.8" : "1.6"}>
                  {item.href === "/feed" && <path d="M2.5 8.5l7.5-5.5 7.5 5.5v9H2.5z" />}
                  {item.href === "/explore" && <><circle cx="10" cy="10" r="6" /><path d="M14 14l2.5 2.5" strokeLinecap="round" /></>}
                  {item.href === "/profile" && <><circle cx="10" cy="7" r="3.5" /><path d="M3 18c0-3.5 3.1-6 7-6s7 2.5 7 6" /></>}
                </svg>
                <span style={{ fontSize: 9, fontWeight: 500, color: item.active ? "#fff" : "rgba(255,255,255,.35)" }}>{item.label}</span>
              </>
            )}
          </a>
        ))}
      </div>

      {/* Contenuto */}
      <div className="zz-content" style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px 120px" }}>

        {/* Header mobile */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "#FF4D4D", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><polygon points="10,1 6,8 9,8 5,15 13,6 9,6" fill="white" /></svg>
          </div>
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 20, letterSpacing: -0.5 }}>Zip<span style={{ color: "#FF4D4D" }}>Zap</span></span>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 28 }}>
          <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="1.5">
              <circle cx="7" cy="7" r="5" /><path d="M11 11l3 3" strokeLinecap="round" />
            </svg>
          </div>
          <input type="text" placeholder="Cerca creator, prodotti, hashtag..."
            style={{ width: "100%", paddingLeft: 44, paddingRight: 16, paddingTop: 14, paddingBottom: 14, borderRadius: 16, background: "#1a1a1a", border: "1.5px solid rgba(255,255,255,.08)", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
        </div>

        {/* Trending */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ color: "rgba(255,255,255,.3)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 14 }}>
            Trending ora
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {trending.map((t, i) => (
              <div key={t.tag} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 14, padding: "12px 16px", cursor: "pointer", background: "#111", border: "0.5px solid rgba(255,255,255,.07)" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#fff" }}>{t.tag}</div>
                  <div style={{ fontSize: 11, marginTop: 2, color: "rgba(255,255,255,.3)" }}>{t.posts} post</div>
                </div>
                <div style={{ fontWeight: 900, fontSize: 18, color: "rgba(255,77,77,.3)" }}>#{i + 1}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Creator suggeriti */}
        <div>
          <div style={{ color: "rgba(255,255,255,.3)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 14 }}>
            Creator suggeriti
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {creators.map((c) => (
              <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 12, borderRadius: 16, padding: "12px 16px", background: "#111", border: "0.5px solid rgba(255,255,255,.07)" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: c.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff", fontSize: 14, flexShrink: 0 }}>
                  {c.initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>@{c.name}</div>
                  <div style={{ fontSize: 12, marginTop: 2, color: "rgba(255,255,255,.35)" }}>{c.cat} · {c.followers} follower</div>
                </div>
                <button style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "1.5px solid #FF4D4D", color: "#FF4D4D", background: "transparent", cursor: "pointer" }}>
                  + Segui
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}