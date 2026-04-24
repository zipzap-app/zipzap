"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Comment = {
  id: string;
  content: string;
  created_at: string;
  profiles: { username: string; full_name: string; avatar_url: string | null };
};

export default function Comments({
  postId,
  onClose,
}: {
  postId: string;
  onClose: () => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadComments();
  }, [postId]);

  async function loadComments() {
    const supabase = createClient();
    const { data } = await supabase
      .from("comments")
      .select("*, profiles(username, full_name, avatar_url)")
      .eq("post_id", postId)
      .order("created_at", { ascending: false });
    setComments((data as Comment[]) || []);
    setLoading(false);
  }

  async function sendComment() {
    if (!newComment.trim() || sending) return;
    setSending(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSending(false); return; }
    await supabase.from("comments").insert({
      post_id: postId,
      user_id: user.id,
      content: newComment.trim(),
    });
    setNewComment("");
    await loadComments();
    setSending(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end"
      style={{ background: "rgba(0,0,0,.7)" }}
      onClick={onClose}>
      <div className="w-full rounded-t-3xl flex flex-col"
        style={{
          background: "#111",
          border: "0.5px solid rgba(255,255,255,.1)",
          maxHeight: "75vh",
        }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "0.5px solid rgba(255,255,255,.08)" }}>
          <span className="font-black text-white text-base">Commenti</span>
          <button onClick={onClose}
            className="rounded-full flex items-center justify-center"
            style={{ width: 28, height: 28, background: "rgba(255,255,255,.08)" }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
              stroke="rgba(255,255,255,.6)" strokeWidth="1.5">
              <path d="M2 2l8 8M10 2l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Lista commenti */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm" style={{ color: "rgba(255,255,255,.3)" }}>Caricamento...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <p className="font-bold text-white text-sm">Nessun commento</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,.3)" }}>
                Sii il primo a commentare
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
                    style={{ width: 36, height: 36, background: "#1a0020", fontSize: 13, color: "#FF4D4D" }}>
                    {c.profiles?.full_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-white text-sm">
                        @{c.profiles?.username || "utente"}
                      </span>
                      <span className="text-xs" style={{ color: "rgba(255,255,255,.25)" }}>
                        {new Date(c.created_at).toLocaleDateString("it-IT")}
                      </span>
                    </div>
                    <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,.8)", lineHeight: 1.5 }}>
                      {c.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input commento */}
        <div className="px-5 py-4 flex gap-3 items-center"
          style={{ borderTop: "0.5px solid rgba(255,255,255,.08)" }}>
          <input
            type="text"
            placeholder="Scrivi un commento..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendComment()}
            className="flex-1 rounded-2xl px-4 py-2.5 text-white text-sm outline-none"
            style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,.08)" }} />
          <button onClick={sendComment} disabled={!newComment.trim() || sending}
            className="rounded-2xl flex items-center justify-center font-bold text-white text-sm px-4 py-2.5"
            style={{
              background: newComment.trim() ? "#FF4D4D" : "rgba(255,255,255,.08)",
              color: newComment.trim() ? "#fff" : "rgba(255,255,255,.3)",
            }}>
            {sending ? "..." : "Invia"}
          </button>
        </div>
      </div>
    </div>
  );
}