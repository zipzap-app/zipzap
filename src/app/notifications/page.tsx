"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Notification = {
  id: string;
  type: string;
  read: boolean;
  created_at: string;
  post_id: string | null;
  comment_text: string | null;
  sender: { username: string; avatar_url: string | null; full_name: string };
};

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "ora";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}g`;
}

function notifIcon(type: string) {
  if (type === "like") return { icon: "❤️", label: "ha messo like al tuo post", color: "#FF4D4D" };
  if (type === "comment") return { icon: "💬", label: "ha commentato il tuo post", color: "#60a5fa" };
  if (type === "bookmark") return { icon: "🔖", label: "ha salvato il tuo post", color: "#FFD700" };
  if (type === "follow") return { icon: "👤", label: "ha iniziato a seguirti", color: "#4dffb8" };
  return { icon: "🔔", label: "nuova notifica", color: "#fff" };
}

export default function Notifications() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }

      const { data } = await supabase
        .from("notifications")
        .select("*, sender:sender_id(username, avatar_url, full_name)")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (data) setNotifs(data as any);

      // Segna tutte come lette
      await supabase.from("notifications").update({ read: true }).eq("recipient_id", user.id).eq("read", false);

      setLoading(false);
    }
    load();
  }, []);

  const unread = notifs.filter(n => !n.read).length;

  return (
    <>
      <style>{`
        body { margin: 0; background: #0a0a0a; }
        .zz-nav { display: none; }
        .zz-mob-bot { display: flex; }
        .zz-content { margin-left: 0; }
        @media (min-width: 769px) {
          .zz-nav { display: flex; }
          .zz-mob-bot { display: none; }
          .zz-content { margin-left: 220px; }
        }
      `}</style>

      {/* Sidebar desktop */}
      <div className="zz-nav" style={{ position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 40, width: 220, flexDirection: "column", gap: 6, padding: "32px 20px", background: "rgba(10,10,10,.95)", borderRight: "0.5px solid rgba(255,255,255,.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "#FF4D4D", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><polygon points="10,1 6,8 9,8 5,15 13,6 9,6" fill="white" /></svg>
          </div>
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 22, letterSpacing: -1 }}>Zip<span style={{ color: "#FF4D4D" }}>Zap</span></span>
        </div>
        {[
          { label: "Home", href: "/feed" },
          { label: "Esplora", href: "/explore" },
          { label: "Notifiche", href: "/notifications", active: true },
          { label: "Messaggi", href: "/messages" },
          { label: "Zap Store", href: "/store", isStore: true },
          { label: "Profilo", href: "/profile" },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12, background: (item as any).active ? "rgba(255,255,255,.1)" : "transparent", textDecoration: "none", color: (item as any).isStore ? "#FF4D4D" : "rgba(255,255,255,.8)", fontWeight: 600, fontSize: 14 }}>
            {item.label}
          </a>
        ))}
        <a href="/create" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, background: "#FF4D4D", textDecoration: "none", color: "#fff", fontWeight: 700, fontSize: 14, marginTop: 8 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="2"><path d="M7 1v12M1 7h12" strokeLinecap="round" /></svg>
          Crea contenuto
        </a>
      </div>

      {/* Bottom nav mobile */}
      <div className="zz-mob-bot" style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40, alignItems: "center", justifyContent: "space-around", padding: "10px 16px 28px", background: "rgba(0,0,0,.9)", borderTop: "0.5px solid rgba(255,255,255,.08)" }}>
        {[
          { href: "/feed", label: "Home" },
          { href: "/explore", label: "Esplora" },
          { href: "/create", label: "Crea", isCreate: true },
          { href: "/notifications", label: "🔔", active: true },
          { href: "/profile", label: "Profilo" },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textDecoration: "none" }}>
            {(item as any).isCreate ? (
              <div style={{ width: 46, height: 32, borderRadius: 10, background: "#FF4D4D", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#fff" strokeWidth="2"><path d="M9 3v12M3 9h12" strokeLinecap="round" /></svg>
              </div>
            ) : (
              <span style={{ fontSize: item.label === "🔔" ? 20 : 9, fontWeight: 500, color: (item as any).active ? "#fff" : "rgba(255,255,255,.35)" }}>{item.label}</span>
            )}
          </a>
        ))}
      </div>

      {/* Contenuto */}
      <div className="zz-content" style={{ minHeight: "100vh", background: "#0a0a0a", paddingBottom: 100 }}>
        <div style={{ padding: "48px 24px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <h1 style={{ color: "#fff", fontWeight: 900, fontSize: 24, margin: 0 }}>Notifiche</h1>
            {unread > 0 && (
              <div style={{ background: "#FF4D4D", color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: 20, padding: "2px 8px" }}>{unread} nuove</div>
            )}
          </div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
              <p style={{ color: "rgba(255,255,255,.3)", fontSize: 13 }}>Caricamento...</p>
            </div>
          ) : notifs.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "60px 0" }}>
              <div style={{ fontSize: 40 }}>🔔</div>
              <p style={{ color: "rgba(255,255,255,.3)", fontSize: 14, textAlign: "center" }}>Nessuna notifica ancora.<br />Quando qualcuno interagisce con i tuoi post apparirà qui.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {notifs.map(n => {
                const { icon, label, color } = notifIcon(n.type);
                const sender = n.sender as any;
                const initials = (sender?.full_name || sender?.username || "?")[0].toUpperCase();
                return (
                  <a key={n.id} href={n.post_id ? `/feed?postId=${n.post_id}` : "/profile"}
                    style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 16, background: n.read ? "transparent" : "rgba(255,77,77,.05)", border: n.read ? "none" : "0.5px solid rgba(255,77,77,.15)", textDecoration: "none", marginBottom: 4 }}>
                    {/* Avatar mittente */}
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <div style={{ width: 46, height: 46, borderRadius: "50%", background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        {sender?.avatar_url
                          ? <img src={sender.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <span style={{ color: "#FF4D4D", fontWeight: 700, fontSize: 16 }}>{initials}</span>}
                      </div>
                      <div style={{ position: "absolute", bottom: -2, right: -2, width: 20, height: 20, borderRadius: "50%", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>
                        {icon}
                      </div>
                    </div>

                    {/* Testo */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: "#fff", fontSize: 14, lineHeight: 1.4 }}>
                        <span style={{ fontWeight: 700 }}>@{sender?.username || "utente"}</span>
                        <span style={{ color: "rgba(255,255,255,.6)", fontWeight: 400 }}> {label}</span>
                      </div>
                      {n.comment_text && (
                        <div style={{ color: "rgba(255,255,255,.4)", fontSize: 12, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          "{n.comment_text}"
                        </div>
                      )}
                      <div style={{ color: "rgba(255,255,255,.25)", fontSize: 11, marginTop: 4 }}>{timeAgo(n.created_at)}</div>
                    </div>

                    {!n.read && (
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF4D4D", flexShrink: 0 }} />
                    )}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}