"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Conversation = {
  userId: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  lastMessage: string;
  lastTime: string;
  unread: number;
};

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "ora";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}g`;
}

export default function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      setCurrentUserId(user.id);

      // Carica tutti i messaggi inviati/ricevuti
      const { data: messages } = await supabase
        .from("messages")
        .select("*, sender:sender_id(id, username, full_name, avatar_url), recipient:recipient_id(id, username, full_name, avatar_url)")
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (!messages) { setLoading(false); return; }

      // Raggruppa per conversazione
      const convMap = new Map<string, Conversation>();
      for (const msg of messages) {
        const other = msg.sender_id === user.id ? msg.recipient : msg.sender;
        if (!other || convMap.has(other.id)) continue;
        convMap.set(other.id, {
          userId: other.id,
          username: other.username || "utente",
          full_name: other.full_name || "",
          avatar_url: other.avatar_url,
          lastMessage: msg.content,
          lastTime: msg.created_at,
          unread: 0,
        });
      }

      // Conta non letti
      const { data: unreadData } = await supabase
        .from("messages")
        .select("sender_id")
        .eq("recipient_id", user.id)
        .eq("read", false);

      if (unreadData) {
        for (const m of unreadData) {
          const conv = convMap.get(m.sender_id);
          if (conv) conv.unread++;
        }
      }

      setConversations(Array.from(convMap.values()));
      setLoading(false);
    }
    load();
  }, []);

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
          { label: "Notifiche", href: "/notifications" },
          { label: "Messaggi", href: "/messages", active: true },
          { label: "Zap Store", href: "/store", isStore: true },
          { label: "Profilo", href: "/profile" },
        ].map((item: any) => (
          <a key={item.href} href={item.href} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12, background: item.active ? "rgba(255,255,255,.1)" : "transparent", textDecoration: "none", color: item.isStore ? "#FF4D4D" : "rgba(255,255,255,.8)", fontWeight: 600, fontSize: 14 }}>
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
          { href: "/create", isCreate: true },
          { href: "/messages", isMsg: true, active: true },
          { href: "/profile", label: "Profilo" },
        ].map((item: any) => (
          <a key={item.href} href={item.href} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textDecoration: "none" }}>
            {item.isCreate ? (
              <div style={{ width: 46, height: 32, borderRadius: 10, background: "#FF4D4D", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#fff" strokeWidth="2"><path d="M9 3v12M3 9h12" strokeLinecap="round" /></svg>
              </div>
            ) : item.isMsg ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            ) : (
              <span style={{ fontSize: 9, color: item.active ? "#fff" : "rgba(255,255,255,.35)" }}>{item.label}</span>
            )}
          </a>
        ))}
      </div>

      {/* Contenuto */}
      <div className="zz-content" style={{ minHeight: "100vh", background: "#0a0a0a", paddingBottom: 100 }}>
        <div style={{ padding: "48px 24px 24px", maxWidth: 600 }}>
          <h1 style={{ color: "#fff", fontWeight: 900, fontSize: 24, margin: "0 0 24px" }}>💬 Messaggi</h1>

          {loading ? (
            <p style={{ color: "rgba(255,255,255,.3)", fontSize: 13 }}>Caricamento...</p>
          ) : conversations.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "60px 0" }}>
              <div style={{ fontSize: 48 }}>💬</div>
              <p style={{ color: "rgba(255,255,255,.3)", fontSize: 14, textAlign: "center" }}>
                Nessun messaggio ancora.<br />
                Vai sul profilo di un utente per scrivergli.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {conversations.map(conv => {
                const initials = (conv.full_name || conv.username || "?")[0].toUpperCase();
                return (
                  <a key={conv.userId} href={`/messages/${conv.userId}`}
                    style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 16, background: conv.unread > 0 ? "rgba(255,77,77,.06)" : "rgba(255,255,255,.03)", border: conv.unread > 0 ? "0.5px solid rgba(255,77,77,.15)" : "0.5px solid rgba(255,255,255,.05)", textDecoration: "none", marginBottom: 4 }}>
                    {/* Avatar */}
                    <div style={{ width: 50, height: 50, borderRadius: "50%", background: "#1a1a2e", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      {conv.avatar_url
                        ? <img src={conv.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                        : <span style={{ color: "#FF4D4D", fontWeight: 700, fontSize: 18 }}>{initials}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ color: "#fff", fontWeight: conv.unread > 0 ? 700 : 600, fontSize: 14 }}>@{conv.username}</span>
                        <span style={{ color: "rgba(255,255,255,.3)", fontSize: 11 }}>{timeAgo(conv.lastTime)}</span>
                      </div>
                      <div style={{ color: conv.unread > 0 ? "rgba(255,255,255,.7)" : "rgba(255,255,255,.35)", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {conv.lastMessage}
                      </div>
                    </div>
                    {conv.unread > 0 && (
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#FF4D4D", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                        {conv.unread}
                      </div>
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