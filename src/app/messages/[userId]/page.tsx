"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read: boolean;
};

type Profile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
};

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "ora";
  if (s < 3600) return `${Math.floor(s / 60)}m fa`;
  if (s < 86400) return `${Math.floor(s / 3600)}h fa`;
  return `${Math.floor(s / 86400)}g fa`;
}

export default function Chat() {
  const params = useParams();
  const otherUserId = params?.userId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherProfile, setOtherProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      setCurrentUserId(user.id);

      // Profilo dell'altro utente
      const { data: profile } = await supabase.from("profiles").select("id, username, full_name, avatar_url").eq("id", otherUserId).single();
      if (profile) setOtherProfile(profile);

      // Carica messaggi
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
        .order("created_at", { ascending: true });

      if (msgs) setMessages(msgs);

      // Segna come letti
      await supabase.from("messages").update({ read: true }).eq("sender_id", otherUserId).eq("recipient_id", user.id).eq("read", false);

      setLoading(false);
    }
    load();
  }, [otherUserId]);

  // Realtime
  useEffect(() => {
    if (!currentUserId) return;
    const supabase = createClient();
    const channel = supabase.channel("messages-realtime")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `recipient_id=eq.${currentUserId}`,
      }, (payload) => {
        if (payload.new.sender_id === otherUserId) {
          setMessages(prev => [...prev, payload.new as Message]);
          supabase.from("messages").update({ read: true }).eq("id", payload.new.id);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, otherUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!newMsg.trim() || !currentUserId || sending) return;
    setSending(true);
    const supabase = createClient();
    const content = newMsg.trim();
    setNewMsg("");

    const { data } = await supabase.from("messages").insert({
      sender_id: currentUserId,
      recipient_id: otherUserId,
      content,
    }).select().single();

    if (data) setMessages(prev => [...prev, data]);

    // Notifica
    await supabase.from("notifications").insert({
      recipient_id: otherUserId,
      sender_id: currentUserId,
      type: "message",
      post_id: null,
      comment_text: content.slice(0, 80),
    });

    setSending(false);
    inputRef.current?.focus();
  }

  const initials = (otherProfile?.full_name || otherProfile?.username || "?")[0]?.toUpperCase();

  if (loading) return (
    <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a" }}>
      <p style={{ color: "rgba(255,255,255,.3)", fontSize: 13 }}>Caricamento...</p>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: "#0a0a0a" }}>
      <style>{`body { margin: 0; }`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "48px 20px 16px", background: "rgba(10,10,10,.95)", borderBottom: "0.5px solid rgba(255,255,255,.08)", flexShrink: 0 }}>
        <button onClick={() => window.location.href = "/messages"}
          style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,.08)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="1.5"><path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
          {otherProfile?.avatar_url
            ? <img src={otherProfile.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
            : <span style={{ color: "#FF4D4D", fontWeight: 700, fontSize: 16 }}>{initials}</span>}
        </div>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>@{otherProfile?.username || "utente"}</div>
          {otherProfile?.full_name && <div style={{ color: "rgba(255,255,255,.4)", fontSize: 12 }}>{otherProfile.full_name}</div>}
        </div>
      </div>

      {/* Messaggi */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px" }}>
        {messages.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "40px 0" }}>
            <div style={{ fontSize: 40 }}>👋</div>
            <p style={{ color: "rgba(255,255,255,.3)", fontSize: 13, textAlign: "center" }}>
              Inizia la conversazione con @{otherProfile?.username}
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMine = msg.sender_id === currentUserId;
          const showTime = i === 0 || new Date(msg.created_at).getTime() - new Date(messages[i - 1].created_at).getTime() > 300000;
          return (
            <div key={msg.id}>
              {showTime && (
                <div style={{ textAlign: "center", color: "rgba(255,255,255,.2)", fontSize: 10, margin: "12px 0 8px" }}>
                  {timeAgo(msg.created_at)}
                </div>
              )}
              <div style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", marginBottom: 6 }}>
                <div style={{
                  maxWidth: "75%", padding: "10px 14px", borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: isMine ? "#FF4D4D" : "rgba(255,255,255,.1)",
                  color: "#fff", fontSize: 14, lineHeight: 1.5, wordBreak: "break-word",
                }}>
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "12px 16px 32px", background: "rgba(10,10,10,.95)", borderTop: "0.5px solid rgba(255,255,255,.08)", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            ref={inputRef}
            value={newMsg}
            onChange={e => setNewMsg(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={`Scrivi a @${otherProfile?.username}...`}
            style={{ flex: 1, padding: "12px 16px", borderRadius: 24, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.1)", color: "#fff", fontSize: 14, outline: "none" }}
          />
          <button onClick={sendMessage} disabled={!newMsg.trim() || sending}
            style={{ width: 44, height: 44, borderRadius: "50%", background: newMsg.trim() ? "#FF4D4D" : "rgba(255,255,255,.1)", border: "none", cursor: newMsg.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background .2s" }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="2">
              <path d="M19 10L1 1l4 9-4 9 18-9z" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}