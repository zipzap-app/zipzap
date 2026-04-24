"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const path = usePathname();
  const hide = ["/", "/login", "/register", "/onboarding"];
  if (hide.includes(path)) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-4 pb-6 pt-3"
      style={{
        background: "rgba(0,0,0,.9)",
        borderTop: "0.5px solid rgba(255,255,255,.08)",
        backdropFilter: "blur(12px)",
      }}>

      <Link href="/feed" className="flex flex-col items-center gap-1">
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none"
          stroke={path === "/feed" ? "#fff" : "rgba(255,255,255,.35)"}
          strokeWidth={path === "/feed" ? "1.8" : "1.6"}>
          <path d="M2.5 8.5l7.5-5.5 7.5 5.5v9H2.5z" />
        </svg>
        <span style={{ fontSize: 9, fontWeight: 500, color: path === "/feed" ? "#fff" : "rgba(255,255,255,.35)" }}>
          Home
        </span>
      </Link>

      <Link href="/explore" className="flex flex-col items-center gap-1">
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none"
          stroke={path === "/explore" ? "#fff" : "rgba(255,255,255,.35)"}
          strokeWidth={path === "/explore" ? "1.8" : "1.6"}>
          <circle cx="10" cy="10" r="6" />
          <path d="M14 14l2.5 2.5" strokeLinecap="round" />
        </svg>
        <span style={{ fontSize: 9, fontWeight: 500, color: path === "/explore" ? "#fff" : "rgba(255,255,255,.35)" }}>
          Esplora
        </span>
      </Link>

      {/* Pulsante + centrale */}
      <Link href="/create" className="flex flex-col items-center gap-1">
        <div className="flex items-center justify-center rounded-2xl"
          style={{ width: 46, height: 34, background: "#FF4D4D" }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
            stroke="#fff" strokeWidth="2">
            <path d="M9 3v12M3 9h12" strokeLinecap="round" />
          </svg>
        </div>
        <span style={{ fontSize: 9, fontWeight: 500, color: "rgba(255,255,255,.35)" }}>
          Crea
        </span>
      </Link>

      <Link href="/store" className="flex flex-col items-center gap-1">
        <div className="flex items-center justify-center rounded-lg px-2 py-1"
          style={{
            background: path === "/store" ? "#FF4D4D" : "rgba(255,77,77,.12)",
            border: path === "/store" ? "none" : "1px solid rgba(255,77,77,.25)",
          }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <polygon points="10,1 6,8 9,8 5,15 13,6 9,6"
              fill={path === "/store" ? "#fff" : "#FF4D4D"} />
          </svg>
          <span className="font-black text-xs ml-1"
            style={{ color: path === "/store" ? "#fff" : "#FF4D4D" }}>
            Store
          </span>
        </div>
      </Link>

      <Link href="/profile" className="flex flex-col items-center gap-1">
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none"
          stroke={path === "/profile" ? "#fff" : "rgba(255,255,255,.35)"}
          strokeWidth={path === "/profile" ? "1.8" : "1.6"}>
          <circle cx="10" cy="7" r="3.5" />
          <path d="M3 18c0-3.5 3.1-6 7-6s7 2.5 7 6" />
        </svg>
        <span style={{ fontSize: 9, fontWeight: 500, color: path === "/profile" ? "#fff" : "rgba(255,255,255,.35)" }}>
          Profilo
        </span>
      </Link>

    </nav>
  );
}