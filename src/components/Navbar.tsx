"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const path = usePathname();
  const hide = ["/", "/login", "/register"];
  if (hide.includes(path)) return null;

  const links = [
    {
      href: "/feed",
      label: "Home",
      icon: <path d="M2.5 8.5l7.5-5.5 7.5 5.5v9H2.5z" />,
    },
    {
      href: "/explore",
      label: "Esplora",
      icon: <><circle cx="10" cy="10" r="6" /><path d="M14 14l2.5 2.5" strokeLinecap="round" /></>,
    },
    {
      href: "/store",
      label: "Zap Store",
      isStore: true,
    },
    {
      href: "/profile",
      label: "Profilo",
      icon: <><circle cx="10" cy="7" r="3.5" /><path d="M3 18c0-3.5 3.1-6 7-6s7 2.5 7 6" /></>,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-4 pb-6 pt-3"
      style={{
        background: "rgba(0,0,0,.9)",
        borderTop: "0.5px solid rgba(255,255,255,.08)",
        backdropFilter: "blur(12px)",
      }}
    >
      {links.map((item) => {
        const active = path === item.href;

        if (item.isStore) {
          return (
            <Link key={item.href} href={item.href}
              className="flex flex-col items-center gap-1">
              <div className="flex items-center justify-center rounded-xl px-3 py-1.5"
                style={{
                  background: active ? "#FF4D4D" : "rgba(255,77,77,.12)",
                  border: active ? "none" : "1px solid rgba(255,77,77,.25)",
                }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <polygon points="10,1 6,8 9,8 5,15 13,6 9,6"
                    fill={active ? "#fff" : "#FF4D4D"} />
                </svg>
                <span className="font-black text-xs ml-1"
                  style={{ color: active ? "#fff" : "#FF4D4D" }}>
                  Store
                </span>
              </div>
            </Link>
          );
        }

        return (
          <Link key={item.href} href={item.href}
            className="flex flex-col items-center gap-1">
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none"
              stroke={active ? "#fff" : "rgba(255,255,255,.35)"}
              strokeWidth={active ? "1.8" : "1.6"}>
              {item.icon}
            </svg>
            <span style={{
              fontSize: 9,
              fontWeight: 500,
              color: active ? "#fff" : "rgba(255,255,255,.35)",
            }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}