"use client";
import { useState, useEffect, useRef } from "react";
import { useFollow } from "@/hooks/usePost";
import Comments from "@/components/Comments";
import { createClient } from "@/lib/supabase/client";

type Post = {
  id: string;
  userId: string;
  user: string;
  initials: string;
  color: string;
  caption: string;
  hashtags: string;
  likes: number;
  comments: number;
  shares: number;
  hasLink: boolean;
  linkName: string;
  linkMeta: string;
  earn: string;
  type: string;
  mediaUrl: string;
  postType: string;
};

const mockPosts: Post[] = [
  {
    id: "1", userId: "user-1", user: "astro.sky", initials: "AS", color: "#1a3a5c",
    caption: "Via Lattea dal Gran Sasso — 4 ore di esposizione, zero filtri",
    hashtags: "#astronomia #fotografia #italia",
    likes: 41200, comments: 3100, shares: 8700,
    hasLink: false, linkName: "", linkMeta: "", earn: "", type: "LIBERO",
    mediaUrl: "", postType: "text",
  },
  {
    id: "2", userId: "user-2", user: "mario.reviews", initials: "MR", color: "#0d3320",
    caption: "Il miglior auricolare sotto i 50€ — recensione onesta dopo 3 mesi",
    hashtags: "#tech #gadget #recensione",
    likes: 5600, comments: 387, shares: 1100,
    hasLink: true, linkName: "Sony WF-1000XM5 · €249", linkMeta: "amazon.it · browser nativo",
    earn: "+€6", type: "LINK", mediaUrl: "", postType: "text",
  },
  {
    id: "3", userId: "user-3", user: "vale.beats", initials: "VB", color: "#3d0a2e",
    caption: "Beat fatta in 60 secondi con samples di cucina",
    hashtags: "#musica #produzione #beatmaking",
    likes: 98000, comments: 14000, shares: 22000,
    hasLink: false, linkName: "", linkMeta: "", earn: "", type: "LIBERO",
    mediaUrl: "", postType: "text",
  },
];

const colors = ["#1a3a5c", "#0d3320", "#3d0a2e", "#2a1a4a", "#1a2a0a", "#4a1a0a"];

function formatCount(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function PostActions({ post, onComment, muted, onToggleMute, volume, onVolumeChange }: {
  post: Post;
  onComment: () => void;
  muted: boolean;
  onToggleMute: () => void;
  volume: number;
  onVolumeChange: (v: number) => void;
}) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [showVolume, setShowVolume] = useState(false);
  const { following, toggleFollow } = useFollow(post.userId, false);

  function toggleLike() {
    setLiked((l) => !l);
    setLikesCount((c) => liked ? c - 1 : c + 1);
  }

  return (
    <div style={{ position: "absolute", right: 16, bottom: 100, zIndex: 30, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>

      {/* Avatar + segui */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <button onClick={toggleFollow} style={{ width: 44, height: 44, borderRadius: "50%", border: `2px solid ${following ? "#FF4D4D" : "rgba(255,255,255,.8)"}`, background: post.color, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          {post.initials}
        </button>
        <button onClick={toggleFollow} style={{ width: 18, height: 18, borderRadius: "50%", background: following ? "#1D9E75" : "#FF4D4D", color: "#fff", fontSize: 12, fontWeight: 700, marginTop: -9, border: "none", cursor: "pointer" }}>
          {following ? "✓" : "+"}
        </button>
      </div>

      {/* Like */}
      <button onClick={toggleLike} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, border: "none", background: "none", cursor: "pointer" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: liked ? "rgba(255,77,77,.25)" : "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="22" height="22" viewBox="0 0 20 20" fill={liked ? "#FF4D4D" : "none"} stroke={liked ? "#FF4D4D" : "#fff"} strokeWidth="1.6">
            <path d="M10 17S4 13.5 4 8a4.5 4.5 0 0 1 6-4.24A4.5 4.5 0 0 1 16 8C16 13.5 10 17 10 17z" />
          </svg>
        </div>
        <span style={{ color: "rgba(255,255,255,.8)", fontSize: 11 }}>{formatCount(likesCount)}</span>
      </button>

      {/* Commenti */}
      <button onClick={onComment} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, border: "none", background: "none", cursor: "pointer" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="1.6">
            <path d="M3 3h14v10H3z" /><path d="M7 17h6M10 13v4" />
          </svg>
        </div>
        <span style={{ color: "rgba(255,255,255,.8)", fontSize: 11 }}>{formatCount(post.comments)}</span>
      </button>

      {/* Condividi */}
      <button style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, border: "none", background: "none", cursor: "pointer" }}
        onClick={() => {
          if (navigator.share) navigator.share({ title: post.user, text: post.caption, url: window.location.href });
          else navigator.clipboard.writeText(window.location.href);
        }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="1.6">
            <path d="M17 7L10 4 3 7l7 3.5L17 7z" />
            <path d="M3 11l7 3.5L17 11M3 15l7 3.5L17 15" />
          </svg>
        </div>
        <span style={{ color: "rgba(255,255,255,.8)", fontSize: 11 }}>{formatCount(post.shares)}</span>
      </button>

      {/* Volume — solo se c'è video */}
      {post.postType === "video" && post.mediaUrl && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <button
            onClick={() => { onToggleMute(); setShowVolume((v) => !v); }}
            style={{ width: 48, height: 48, borderRadius: "50%", background: muted ? "rgba(255,77,77,.2)" : "rgba(255,255,255,.15)", border: muted ? "1px solid rgba(255,77,77,.4)" : "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            {muted ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#FF4D4D" strokeWidth="1.6">
                <path d="M3 7h3l4-4v14l-4-4H3z" />
                <path d="M14 7l3 3-3 3M17 7l-3 3 3 3" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="1.6">
                <path d="M3 7h3l4-4v14l-4-4H3z" />
                <path d="M13 7a4 4 0 0 1 0 6M15 5a7 7 0 0 1 0 10" strokeLinecap="round" />
              </svg>
            )}
          </button>

          {/* Slider volume verticale */}
          {showVolume && !muted && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "rgba(0,0,0,.6)", borderRadius: 20, padding: "12px 8px" }}>
              <input
                type="range" min="0" max="1" step="0.05"
                value={volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                style={{
                  writingMode: "vertical-lr" as any,
                  direction: "rtl" as any,
                  width: 4,
                  height: 80,
                  cursor: "pointer",
                  accentColor: "#FF4D4D",
                }}
              />
              <span style={{ color: "rgba(255,255,255,.6)", fontSize: 9 }}>{Math.round(volume * 100)}%</span>
            </div>
          )}
        </div>
      )}

      {/* Guadagno affiliato */}
      {post.hasLink && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ background: "rgba(29,158,117,.3)", border: "1px solid rgba(29,158,117,.6)", color: "#4dffb8", fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "3px 8px" }}>
            {post.earn}
          </div>
          <span style={{ color: "#4dffb8", fontSize: 9, fontWeight: 700 }}>live</span>
        </div>
      )}
    </div>
  );
}

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [current, setCurrent] = useState(0);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    async function loadPosts() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("posts")
          .select("*, profiles(username, full_name, avatar_url)")
          .order("created_at", { ascending: false })
          .limit(20);
        if (data && data.length > 0) {
          setPosts(data.map((p, i) => ({
            id: p.id,
            userId: p.user_id,
            user: p.profiles?.username || "utente",
            initials: (p.profiles?.full_name || p.profiles?.username || "U")[0].toUpperCase(),
            color: colors[i % colors.length],
            caption: p.caption || "",
            hashtags: "",
            likes: p.likes_count || 0,
            comments: p.comments_count || 0,
            shares: 0,
            hasLink: !!p.link_url,
            linkName: p.link_url || "",
            linkMeta: p.link_url ? "apre nel browser" : "",
            earn: "+€6",
            type: p.link_url ? "LINK" : "LIBERO",
            mediaUrl: p.media_url || "",
            postType: p.type || "text",
          })));
        } else {
          setPosts(mockPosts);
        }
      } catch {
        setPosts(mockPosts);
      }
      setLoadingPosts(false);
    }
    loadPosts();
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = muted;
    }
  }, [volume, muted, current]);

  function handleVolumeChange(v: number) {
    setVolume(v);
    if (videoRef.current) videoRef.current.volume = v;
    if (v === 0) setMuted(true);
    else setMuted(false);
  }

  function handleToggleMute() {
    const newMuted = !muted;
    setMuted(newMuted);
    if (videoRef.current) videoRef.current.muted = newMuted;
  }

  if (loadingPosts) {
    return (
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#FF4D4D", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
              <polygon points="10,1 6,8 9,8 5,15 13,6 9,6" fill="white" />
            </svg>
          </div>
          <p style={{ color: "rgba(255,255,255,.5)", fontSize: 13 }}>Caricamento...</p>
        </div>
      </div>
    );
  }

  const post = posts[current];

  if (!post) {
    return (
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
        <p style={{ color: "rgba(255,255,255,.4)", fontSize: 13 }}>Nessun post disponibile</p>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", background: `linear-gradient(160deg, ${post.color} 0%, #1a1a2e 50%, #000 100%)`, transition: "background 0.5s" }}>

      <style>{`
        @media (max-width: 768px) { .zz-desktop { display: none !important; } }
        @media (min-width: 769px) { .zz-mobile { display: none !important; } }
        input[type=range] { -webkit-appearance: slider-vertical; }
      `}</style>

      {/* Media fullscreen */}
      {post.mediaUrl && (
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          {post.postType === "video" ? (
            <video
              ref={videoRef}
              key={post.id}
              src={post.mediaUrl}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              autoPlay loop playsInline
              muted={muted}
            />
          ) : (
            <img src={post.mediaUrl} alt="post" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
        </div>
      )}

      {/* Overlay gradiente */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1, background: "linear-gradient(to top, rgba(0,0,0,.88) 0%, rgba(0,0,0,.0) 40%, rgba(0,0,0,.35) 100%)" }} />

      {/* Navbar sinistra desktop */}
      <div className="zz-desktop" style={{ position: "absolute", left: 0, top: 0, bottom: 0, zIndex: 20, width: 220, display: "flex", flexDirection: "column", gap: 6, padding: "32px 20px", background: "rgba(0,0,0,.5)", borderRight: "0.5px solid rgba(255,255,255,.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "#FF4D4D", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <polygon points="10,1 6,8 9,8 5,15 13,6 9,6" fill="white" />
            </svg>
          </div>
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 22, letterSpacing: -1 }}>
            Zip<span style={{ color: "#FF4D4D" }}>Zap</span>
          </span>
        </div>
        {[
          { label: "Home", href: "/feed", active: true },
          { label: "Esplora", href: "/explore" },
          { label: "Zap Store", href: "/store", isStore: true },
          { label: "Profilo", href: "/profile" },
        ].map((item) => (
          <a key={item.href} href={item.href} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12, background: item.active ? "rgba(255,255,255,.12)" : "transparent", textDecoration: "none", color: item.isStore ? "#FF4D4D" : "rgba(255,255,255,.85)", fontWeight: 600, fontSize: 14 }}>
            {item.label}
          </a>
        ))}
      </div>

      {/* Topbar mobile */}
      <div className="zz-mobile" style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 20, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "44px 16px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: "#FF4D4D", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <polygon points="10,1 6,8 9,8 5,15 13,6 9,6" fill="white" />
            </svg>
          </div>
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 18, letterSpacing: -0.5 }}>
            Zip<span style={{ color: "#FF4D4D" }}>Zap</span>
          </span>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          <span style={{ color: "#fff", fontSize: 13, borderBottom: "1.5px solid #fff", paddingBottom: 2 }}>Per te</span>
          <span style={{ color: "rgba(255,255,255,.4)", fontSize: 13 }}>Seguiti</span>
        </div>
      </div>

      {/* Tab Per te desktop */}
      <div className="zz-desktop" style={{ position: "absolute", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 20, display: "flex", gap: 24 }}>
        <span style={{ color: "#fff", fontWeight: 600, fontSize: 14, borderBottom: "2px solid #fff", paddingBottom: 4, cursor: "pointer" }}>Per te</span>
        <span style={{ color: "rgba(255,255,255,.4)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Seguiti</span>
      </div>

      {/* Contenuto post in basso */}
      <div style={{ position: "absolute", bottom: 100, left: 16, right: 80, zIndex: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 520 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", border: "2px solid rgba(255,255,255,.9)", background: post.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
              {post.initials}
            </div>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 16, textShadow: "0 1px 4px rgba(0,0,0,.5)" }}>@{post.user}</span>
            <span style={{ border: "1.5px solid rgba(255,255,255,.7)", borderRadius: 20, padding: "2px 10px", color: "#fff", fontSize: 12, fontWeight: 600 }}>+ Segui</span>
          </div>
          <p style={{ color: "#fff", fontSize: 15, lineHeight: 1.55, maxWidth: 440, textShadow: "0 1px 6px rgba(0,0,0,.6)" }}>
            {post.caption}
          </p>
          {post.hashtags && <p style={{ color: "rgba(255,255,255,.6)", fontSize: 13 }}>{post.hashtags}</p>}
          {post.hasLink && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(0,0,0,.6)", border: "1px solid rgba(255,77,77,.5)", borderRadius: 12, padding: "9px 14px", maxWidth: 320, cursor: "pointer" }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,77,77,.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#FF4D4D" strokeWidth="1.4">
                  <path d="M5 7a2 2 0 0 0 2.8 0l1.4-1.4a2 2 0 0 0-2.8-2.8L5.5 3.4" strokeLinecap="round" />
                  <path d="M9 7a2 2 0 0 0-2.8 0L4.8 8.4A2 2 0 0 0 7.6 11.2L8.5 10.3" strokeLinecap="round" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.linkName}</div>
                <div style={{ color: "rgba(255,255,255,.45)", fontSize: 10, marginTop: 2 }}>{post.linkMeta}</div>
              </div>
              <div style={{ background: "#FF4D4D", color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: 4, padding: "2px 7px", flexShrink: 0 }}>APRI</div>
            </div>
          )}
        </div>
      </div>

      {/* Azioni destra */}
      <PostActions
        post={post}
        onComment={() => setCommentPostId(post.id)}
        muted={muted}
        onToggleMute={handleToggleMute}
        volume={volume}
        onVolumeChange={handleVolumeChange}
      />

      {/* Frecce navigazione */}
      <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", zIndex: 20, display: "flex", flexDirection: "column", gap: 8 }}>
        <button onClick={() => { setCurrent((c) => Math.max(0, c - 1)); }} style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "rgba(255,255,255,.15)", cursor: "pointer", opacity: current === 0 ? .3 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="1.8">
            <path d="M2 9l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button onClick={() => { setCurrent((c) => Math.min(posts.length - 1, c + 1)); }} style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "rgba(255,255,255,.15)", cursor: "pointer", opacity: current === posts.length - 1 ? .3 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="1.8">
            <path d="M2 5l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Navbar mobile bottom */}
      <div className="zz-mobile" style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30, display: "flex", alignItems: "center", justifyContent: "space-around", padding: "10px 16px 28px", background: "rgba(0,0,0,.88)", borderTop: "0.5px solid rgba(255,255,255,.08)" }}>
        {[
          { href: "/feed", label: "Home", active: true },
          { href: "/explore", label: "Esplora" },
          { href: "/create", label: "Crea", isCreate: true },
          { href: "/store", label: "Store", isStore: true },
          { href: "/profile", label: "Profilo" },
        ].map((item) => (
          <a key={item.href} href={item.href} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textDecoration: "none" }}>
            {item.isCreate ? (
              <div style={{ width: 46, height: 32, borderRadius: 10, background: "#FF4D4D", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#fff" strokeWidth="2">
                  <path d="M9 3v12M3 9h12" strokeLinecap="round" />
                </svg>
              </div>
            ) : item.isStore ? (
              <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,77,77,.12)", border: "1px solid rgba(255,77,77,.25)", borderRadius: 8, padding: "4px 8px" }}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <polygon points="10,1 6,8 9,8 5,15 13,6 9,6" fill="#FF4D4D" />
                </svg>
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
                <span style={{ fontSize: 9, fontWeight: 500, color: item.active ? "#fff" : "rgba(255,255,255,.35)" }}>
                  {item.label}
                </span>
              </>
            )}
          </a>
        ))}
      </div>

      {/* Modal commenti */}
      {commentPostId && (
        <Comments postId={commentPostId} onClose={() => setCommentPostId(null)} />
      )}
    </div>
  );
}