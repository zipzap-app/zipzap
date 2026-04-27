"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

type AudioRow = {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration: number | null;
  uploader_id: string | null;
  source: string;
};

type TopPost = {
  id: string;
  type: string;
  media_url: string | null;
  caption: string | null;
  views_count: number | null;
  text_bg_color?: string | null;
};

function formatCount(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function formatDuration(s: number | null) {
  if (!s) return "";
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function AudioSheet({
  audioId,
  fallbackTitle,
  fallbackArtist,
  fallbackUrl,
  postId,
  postOwnerId,
  onClose,
}: {
  audioId: string | null;
  fallbackTitle?: string | null;
  fallbackArtist?: string | null;
  fallbackUrl?: string | null;
  postId?: string;
  postOwnerId?: string;
  onClose: () => void;
}) {
  const [audio, setAudio] = useState<AudioRow | null>(null);
  const [postCount, setPostCount] = useState(0);
  const [topPosts, setTopPosts] = useState<TopPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      let audioData: AudioRow | null = null;

      if (audioId) {
        const { data } = await supabase.from("audios").select("*").eq("id", audioId).single();
        if (data) audioData = data as any;
      }

      // Fallback: se non trovo l'audio nel DB ma ho i metadati dal post
      if (!audioData && (fallbackTitle || fallbackUrl)) {
        audioData = {
          id: "fallback",
          title: fallbackTitle || "Audio",
          artist: fallbackArtist || "",
          url: fallbackUrl || "",
          duration: null,
          uploader_id: null,
          source: "library",
        };
      }

      setAudio(audioData);

      if (audioId && audioData && audioData.id !== "fallback") {
        // Conta i post che usano questo audio
        const { count } = await supabase.from("posts").select("*", { count: "exact", head: true }).eq("audio_id", audioId);
        setPostCount(count || 0);

        // Top 10 post più visti con questo audio
        const { data: topData } = await supabase
          .from("posts")
          .select("id, type, media_url, caption, views_count, text_bg_color")
          .eq("audio_id", audioId)
          .eq("visibility", "public")
          .order("views_count", { ascending: false })
          .limit(10);
        if (topData) setTopPosts(topData as any);

        // Verifica se è preferito dall'utente corrente
        if (user) {
          const { data: favData } = await supabase
            .from("audio_favorites")
            .select("audio_id")
            .eq("user_id", user.id)
            .eq("audio_id", audioId)
            .maybeSingle();
          setIsFavorite(!!favData);
        }
      }

      setLoading(false);
    }
    load();

    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [audioId, fallbackTitle, fallbackUrl, fallbackArtist]);

  function togglePlay() {
    if (!audio?.url) return;
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    if (!audioRef.current) {
      const a = new Audio(audio.url);
      a.volume = 0.7;
      audioRef.current = a;
      a.onended = () => {
        setIsPlaying(false);
        setProgress(0);
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
    audioRef.current.play().catch(() => {});
    setIsPlaying(true);
    intervalRef.current = setInterval(() => {
      const a = audioRef.current;
      if (a && a.duration) setProgress((a.currentTime / a.duration) * 100);
    }, 200);
  }

  async function toggleFavorite() {
    if (!audio) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login"; return; }

    // Caso normale: audio già nel DB
    if (audio.id !== "fallback") {
      if (isFavorite) {
        await supabase.from("audio_favorites").delete().eq("user_id", user.id).eq("audio_id", audio.id);
        setIsFavorite(false);
      } else {
        await supabase.from("audio_favorites").insert({ user_id: user.id, audio_id: audio.id });
        setIsFavorite(true);
      }
      return;
    }

    // Caso fallback: l'audio non è in DB, lo creo o trovo via URL
    if (!audio.url) return;

    // Cerca se esiste già un audio con la stessa URL
    let resolvedId: string | null = null;
    const { data: existing } = await supabase
      .from("audios")
      .select("id")
      .eq("url", audio.url)
      .limit(1)
      .maybeSingle();

    if (existing) {
      resolvedId = existing.id;
    } else {
      // Crea nuova riga audio
      const { data: newAudio } = await supabase.from("audios").insert({
        title: audio.title || "Audio",
        artist: audio.artist || "",
        url: audio.url,
        uploader_id: user.id,
        source: "user",
      }).select().single();
      if (newAudio) resolvedId = newAudio.id;
    }

    if (!resolvedId) return;

    // Aggiungi ai preferiti
    await supabase.from("audio_favorites").insert({ user_id: user.id, audio_id: resolvedId });
    setIsFavorite(true);
    // Aggiorna lo stato locale dell'audio così non ricade più nel ramo "fallback"
    setAudio(prev => prev ? { ...prev, id: resolvedId! } : prev);

    // Se il post è dell'utente corrente, aggiorna anche il post col nuovo audio_id
    if (postId && postOwnerId === user.id) {
      await supabase.from("posts").update({ audio_id: resolvedId }).eq("id", postId);
    }
  }

  function useAudio() {
    if (!audio || audio.id === "fallback") return;
    // Salvo l'audio scelto in sessionStorage; /create lo legge al mount
    try {
      sessionStorage.setItem("zz_preselected_audio", JSON.stringify({
        id: audio.id,
        title: audio.title,
        artist: audio.artist,
        url: audio.url,
        duration: audio.duration,
      }));
    } catch {}
    window.location.href = "/create";
  }

  function openPost(postId: string) {
    window.location.href = `/feed?postId=${postId}`;
  }

  return (
    <div onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "flex-end", background: "rgba(0,0,0,.7)", backdropFilter: "blur(4px)" }}>
      <div onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxHeight: "85vh", overflowY: "auto", borderRadius: "20px 20px 0 0", background: "#111", border: "0.5px solid rgba(255,255,255,.1)", padding: "20px 20px 32px" }}>

        {/* Header con pulsante chiudi */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <button onClick={onClose} type="button"
            style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,.08)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="1.7"><path d="M2 2l10 10M12 2L2 12" strokeLinecap="round" /></svg>
          </button>
        </div>

        {loading ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "rgba(255,255,255,.4)", fontSize: 13 }}>Caricamento...</div>
        ) : !audio ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "rgba(255,255,255,.4)", fontSize: 13 }}>Audio non disponibile</div>
        ) : (
          <>
            {/* Cover + titolo */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <div style={{ width: 96, height: 96, borderRadius: 20, background: "linear-gradient(135deg, #FF4D4D 0%, #c33 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(255,77,77,.3)" }}>
                <svg width="40" height="40" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.4">
                  <circle cx="4" cy="12" r="2" /><circle cx="12" cy="10" r="2" /><path d="M6 12V4l8-2v8" strokeLinecap="round" />
                </svg>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 18 }}>{audio.title}</div>
                <div style={{ color: "rgba(255,255,255,.55)", fontSize: 13, marginTop: 3 }}>
                  {audio.artist}
                  {audio.duration ? ` · ${formatDuration(audio.duration)}` : ""}
                </div>
                {audio.source === "user" && (
                  <div style={{ display: "inline-block", marginTop: 6, fontSize: 9, fontWeight: 700, color: "#4dffb8", background: "rgba(29,158,117,.15)", border: "1px solid rgba(29,158,117,.3)", borderRadius: 4, padding: "2px 7px" }}>
                    AUDIO ORIGINALE
                  </div>
                )}
              </div>
            </div>

            {/* Player + favoriti */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <button onClick={togglePlay} type="button"
                style={{ flex: 1, padding: "12px 0", borderRadius: 14, background: "rgba(255,77,77,.12)", border: "1px solid rgba(255,77,77,.35)", color: "#FF4D4D", fontWeight: 700, fontSize: 14, cursor: audio.url ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: audio.url ? 1 : .4 }}
                disabled={!audio.url}>
                {isPlaying ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="2" y="2" width="3.5" height="10" rx="1" fill="#FF4D4D" />
                    <rect x="8.5" y="2" width="3.5" height="10" rx="1" fill="#FF4D4D" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3.5 2L11 7l-7.5 5V2z" fill="#FF4D4D" />
                  </svg>
                )}
                {isPlaying ? "Stop preview" : "Play preview"}
              </button>
              <button onClick={toggleFavorite} type="button"
                title={isFavorite ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
                style={{ width: 50, padding: "12px 0", borderRadius: 14, background: isFavorite ? "rgba(255,200,0,.15)" : "rgba(255,255,255,.06)", border: isFavorite ? "1px solid rgba(255,200,0,.4)" : "1px solid rgba(255,255,255,.1)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill={isFavorite ? "#FFD700" : "none"} stroke={isFavorite ? "#FFD700" : "rgba(255,255,255,.7)"} strokeWidth="1.5">
                  <path d="M10 2l2.5 5 5.5.8-4 3.9.95 5.5L10 14.6 5.05 17.2 6 11.7 2 7.8l5.5-.8L10 2z" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Progress bar */}
            {isPlaying && (
              <div style={{ height: 3, background: "rgba(255,255,255,.08)", borderRadius: 2, overflow: "hidden", marginBottom: 16 }}>
                <div style={{ height: "100%", background: "#FF4D4D", width: `${progress}%`, transition: "width .2s" }} />
              </div>
            )}

            {/* CTA Usa */}
            {audio.id !== "fallback" && (
              <button onClick={useAudio} type="button"
                style={{ width: "100%", padding: "13px 0", borderRadius: 14, background: "#FF4D4D", border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 18 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="2"><path d="M7 1v12M1 7h12" strokeLinecap="round" /></svg>
                Usa questo audio
              </button>
            )}

            {/* Conteggio + top post */}
            {audio.id !== "fallback" && (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ color: "rgba(255,255,255,.4)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".4px" }}>
                    Top post con questo audio
                  </div>
                  <div style={{ color: "#FF4D4D", fontSize: 12, fontWeight: 700 }}>
                    {formatCount(postCount)} {postCount === 1 ? "post" : "post"}
                  </div>
                </div>

                {topPosts.length === 0 ? (
                  <div style={{ padding: "20px 0", textAlign: "center", color: "rgba(255,255,255,.3)", fontSize: 12 }}>
                    Sei il primo a usare questo audio
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
                    {topPosts.map(p => (
                      <div key={p.id} onClick={() => openPost(p.id)}
                        style={{ position: "relative", aspectRatio: ".7", borderRadius: 8, overflow: "hidden", cursor: "pointer", background: "#1a1a1a" }}>
                        {p.media_url && p.type === "video" && <video src={p.media_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted playsInline />}
                        {p.media_url && p.type === "photo" && <img src={p.media_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                        {!p.media_url && (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 6, background: p.text_bg_color || "linear-gradient(135deg, #1a1a2e, #0a0a1a)" }}>
                            <span style={{ color: "rgba(255,255,255,.7)", fontSize: 9, fontWeight: 600, textAlign: "center", lineHeight: 1.3 }}>
                              {(p.caption || "").slice(0, 30)}
                            </span>
                          </div>
                        )}
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px 6px 4px", background: "linear-gradient(to top, rgba(0,0,0,.85), transparent)", display: "flex", alignItems: "center", gap: 3 }}>
                          <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.6"><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" /><circle cx="8" cy="8" r="2" /></svg>
                          <span style={{ color: "#fff", fontSize: 9, fontWeight: 700 }}>{formatCount(p.views_count || 0)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}