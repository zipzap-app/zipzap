"use client";
import { useState, useEffect, useRef } from "react";
import Comments from "@/components/Comments";
import { createClient } from "@/lib/supabase/client";

const FONT_FAMILIES: Record<string, string> = {
  sans: "-apple-system, sans-serif",
  serif: "Georgia, serif",
  mono: "monospace",
  rounded: "Helvetica Neue, sans-serif",
};

type Post = {
  id: string;
  userId: string;
  user: string;
  initials: string;
  color: string;
  caption: string;
  likes: number;
  comments: number;
  hasLink: boolean;
  linkName: string;
  linkMeta: string;
  earn: string;
  type: string;
  mediaUrl: string;
  mediaUrls: string[];
  postType: string;
  musicUrl: string | null;
  musicTitle: string | null;
  musicArtist: string | null;
  overlayText: string | null;
  overlayPosition: string;
  overlayData: any[] | null;
  visibility: string;
};

const mockPosts: Post[] = [
  { id: "1", userId: "user-1", user: "astro.sky", initials: "AS", color: "#1a3a5c", caption: "Via Lattea dal Gran Sasso — 4 ore di esposizione", likes: 41200, comments: 3100, hasLink: false, linkName: "", linkMeta: "", earn: "", type: "LIBERO", mediaUrl: "", mediaUrls: [], postType: "text", musicUrl: null, musicTitle: null, musicArtist: null, overlayText: null, overlayPosition: "bottom", overlayData: null, visibility: "public" },
  { id: "2", userId: "user-2", user: "vale.beats", initials: "VB", color: "#3d0a2e", caption: "Beat fatta in 60 secondi con samples di cucina", likes: 98000, comments: 14000, hasLink: false, linkName: "", linkMeta: "", earn: "", type: "LIBERO", mediaUrl: "", mediaUrls: [], postType: "text", musicUrl: null, musicTitle: null, musicArtist: null, overlayText: null, overlayPosition: "bottom", overlayData: null, visibility: "public" },
];

const colors = ["#1a3a5c", "#0d3320", "#3d0a2e", "#2a1a4a", "#1a2a0a", "#4a1a0a"];

function formatCount(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function NavDesktop({ active }: { active?: string }) {
  return (
    <div className="zz-desktop" style={{ position: "absolute", left: 0, top: 0, bottom: 0, zIndex: 20, width: 200, display: "flex", flexDirection: "column", gap: 6, padding: "28px 16px", background: "rgba(0,0,0,.5)", borderRight: "0.5px solid rgba(255,255,255,.06)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: "#FF4D4D", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><polygon points="10,1 6,8 9,8 5,15 13,6 9,6" fill="white" /></svg>
        </div>
        <span style={{ color: "#fff", fontWeight: 900, fontSize: 20, letterSpacing: -1 }}>Zip<span style={{ color: "#FF4D4D" }}>Zap</span></span>
      </div>
      {[
        { label: "Home", href: "/feed" },
        { label: "Esplora", href: "/explore" },
        { label: "Zap Store", href: "/store", isStore: true },
        { label: "Profilo", href: "/profile" },
      ].map(item => (
        <a key={item.href} href={item.href} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, background: active === item.href ? "rgba(255,255,255,.1)" : "transparent", textDecoration: "none", color: (item as any).isStore ? "#FF4D4D" : "rgba(255,255,255,.85)", fontWeight: 600, fontSize: 13 }}>
          {item.label}
        </a>
      ))}
      <a href="/create" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "#FF4D4D", textDecoration: "none", color: "#fff", fontWeight: 700, fontSize: 13, marginTop: 8 }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="2"><path d="M7 1v12M1 7h12" strokeLinecap="round" /></svg>
        Crea contenuto
      </a>
    </div>
  );
}

export default function Feed() {
  const [feedTab, setFeedTab] = useState<"perTe" | "seguiti">("perTe");
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [followedPosts, setFollowedPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingFollowed, setLoadingFollowed] = useState(false);
  const [current, setCurrent] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [showVolume, setShowVolume] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shareMsg, setShareMsg] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);

  const posts = feedTab === "perTe" ? allPosts : followedPosts;

  function mapPost(p: any, i: number): Post {
    return {
      id: p.id, userId: p.user_id,
      user: p.profiles?.username || "utente",
      initials: (p.profiles?.full_name || p.profiles?.username || "U")[0].toUpperCase(),
      color: colors[i % colors.length],
      caption: p.caption || "",
      likes: p.likes_count || 0, comments: p.comments_count || 0,
      hasLink: !!p.link_url, linkName: p.link_url || "",
      linkMeta: p.link_url ? "apre nel browser" : "", earn: "+€6",
      type: p.link_url ? "LINK" : "LIBERO",
      mediaUrl: p.media_url || "",
      mediaUrls: p.media_urls || [],
      postType: p.type || "text",
      musicUrl: p.music_url || null,
      musicTitle: p.music_title || null,
      musicArtist: p.music_artist || null,
      overlayText: p.overlay_text || null,
      overlayPosition: p.overlay_position || "bottom",
      overlayData: Array.isArray(p.overlay_data) && p.overlay_data.length > 0 ? p.overlay_data : null,
      visibility: p.visibility || "public",
    };
  }

  useEffect(() => {
    async function loadPosts() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const targetPostId = new URLSearchParams(window.location.search).get("postId");

        if (user) {
          setCurrentUserId(user.id);
          const { data: follows } = await supabase.from("follows").select("following_id").eq("follower_id", user.id);
          const ids = (follows || []).map((f: any) => f.following_id);
          setFollowingIds(ids);
          const { data } = await supabase
            .from("posts")
            .select("*, profiles(username, full_name, avatar_url)")
            .order("created_at", { ascending: false })
            .limit(50);
          if (data && data.length > 0) {
            const filtered = data.filter((p: any) => {
              if (p.visibility === "private") return p.user_id === user.id;
              if (p.visibility === "friends") return ids.includes(p.user_id) || p.user_id === user.id;
              return true;
            });
            const mapped = filtered.map(mapPost);
            setAllPosts(mapped);
            if (targetPostId) {
              const idx = mapped.findIndex(p => p.id === targetPostId);
              if (idx > -1) setCurrent(idx);
              window.history.replaceState({}, "", "/feed");
            }
          } else {
            setAllPosts(mockPosts);
          }
        } else {
          const { data } = await supabase
            .from("posts")
            .select("*, profiles(username, full_name, avatar_url)")
            .eq("visibility", "public")
            .order("created_at", { ascending: false })
            .limit(20);
          const mapped = data && data.length > 0 ? data.map(mapPost) : mockPosts;
          setAllPosts(mapped);
          if (targetPostId) {
            const idx = mapped.findIndex(p => p.id === targetPostId);
            if (idx > -1) setCurrent(idx);
            window.history.replaceState({}, "", "/feed");
          }
        }
      } catch { setAllPosts(mockPosts); }
      setLoadingPosts(false);
    }
    loadPosts();
  }, []);

  useEffect(() => {
    if (feedTab !== "seguiti" || followedPosts.length > 0) return;
    async function loadFollowedPosts() {
      setLoadingFollowed(true);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || followingIds.length === 0) { setFollowedPosts([]); setLoadingFollowed(false); return; }
        const { data } = await supabase
          .from("posts")
          .select("*, profiles(username, full_name, avatar_url)")
          .in("user_id", followingIds)
          .in("visibility", ["public", "friends"])
          .order("created_at", { ascending: false })
          .limit(20);
        setFollowedPosts(data && data.length > 0 ? data.map(mapPost) : []);
      } catch {}
      setLoadingFollowed(false);
    }
    loadFollowedPosts();
  }, [feedTab, followingIds]);

  useEffect(() => { setCurrent(0); setCarouselIndex(0); }, [feedTab]);
  useEffect(() => { setCarouselIndex(0); }, [current]);

  useEffect(() => {
    if (musicRef.current) { musicRef.current.pause(); musicRef.current.src = ""; }
    const post = posts[current];
    if (post?.musicUrl) {
      const audio = new Audio(post.musicUrl);
      audio.volume = volume;
      audio.loop = true;
      if (!muted) audio.play().catch(() => {});
      musicRef.current = audio;
    }
    return () => { if (musicRef.current) { musicRef.current.pause(); } };
  }, [current, posts]);

  useEffect(() => {
    if (musicRef.current) musicRef.current.volume = volume;
    if (videoRef.current) { videoRef.current.muted = muted; videoRef.current.volume = volume; }
  }, [muted, volume]);

  useEffect(() => {
    const post = posts[current];
    if (!post || post.id.length < 10) { setLiked(false); setBookmarked(false); setLikesCount(post?.likes || 0); return; }
    async function loadPostState() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLiked(false); setBookmarked(false); setLikesCount(post.likes); return; }
      const [{ data: likeData }, { data: bookmarkData }] = await Promise.all([
        supabase.from("likes").select("id").eq("user_id", user.id).eq("post_id", post.id).single(),
        supabase.from("bookmarks").select("id").eq("user_id", user.id).eq("post_id", post.id).single(),
      ]);
      setLiked(!!likeData); setBookmarked(!!bookmarkData); setLikesCount(post.likes);
      await supabase.from("views").upsert({ post_id: post.id, user_id: user.id }, { onConflict: "post_id,user_id", ignoreDuplicates: true });
    }
    loadPostState();
  }, [current, posts]);

  async function toggleLike() {
    const post = posts[current];
    if (!post || post.id.length < 10) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (liked) {
      await supabase.from("likes").delete().eq("user_id", user.id).eq("post_id", post.id);
      setLiked(false); setLikesCount(c => c - 1);
    } else {
      await supabase.from("likes").insert({ user_id: user.id, post_id: post.id });
      setLiked(true); setLikesCount(c => c + 1);
    }
  }

  async function toggleBookmark() {
    const post = posts[current];
    if (!post || post.id.length < 10) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (bookmarked) {
      await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("post_id", post.id);
      setBookmarked(false);
    } else {
      await supabase.from("bookmarks").insert({ user_id: user.id, post_id: post.id });
      setBookmarked(true);
    }
  }

  function handleUnmute() {
    const newMuted = !muted;
    setMuted(newMuted);
    if (videoRef.current) videoRef.current.muted = newMuted;
    if (musicRef.current) {
      if (newMuted) musicRef.current.pause();
      else musicRef.current.play().catch(() => {});
    }
    if (!newMuted) setShowVolume(true); else setShowVolume(false);
  }

  function handleVolume(v: number) {
    setVolume(v);
    if (videoRef.current) videoRef.current.volume = v;
    if (musicRef.current) musicRef.current.volume = v;
    if (v === 0) setMuted(true); else setMuted(false);
  }

  if (loadingPosts) return (
    <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#FF4D4D", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none"><polygon points="10,1 6,8 9,8 5,15 13,6 9,6" fill="white" /></svg>
        </div>
        <p style={{ color: "rgba(255,255,255,.5)", fontSize: 13 }}>Caricamento...</p>
      </div>
    </div>
  );

  const post = posts[current];

  if (feedTab === "seguiti" && !loadingFollowed && followedPosts.length === 0) {
    return (
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", background: "#000" }}>
        <style>{`@media (max-width: 768px) { .zz-desktop { display: none !important; } } @media (min-width: 769px) { .zz-mobile { display: none !important; } }`}</style>
        <NavDesktop active="/feed" />
        <div style={{ position: "absolute", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 20, display: "flex", gap: 24 }}>
          <span onClick={() => setFeedTab("perTe")} style={{ color: "rgba(255,255,255,.4)", fontWeight: 600, fontSize: 14, cursor: "pointer", paddingBottom: 4 }}>Per te</span>
          <span style={{ color: "#fff", fontWeight: 600, fontSize: 14, borderBottom: "2px solid #fff", paddingBottom: 4 }}>Seguiti</span>
        </div>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,77,77,.1)", border: "1px solid rgba(255,77,77,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="28" height="28" viewBox="0 0 20 20" fill="none" stroke="#FF4D4D" strokeWidth="1.5">
              <circle cx="10" cy="7" r="3.5" /><path d="M3 18c0-3.5 3.1-6 7-6s7 2.5 7 6" />
            </svg>
          </div>
          <p style={{ color: "#fff", fontWeight: 700, fontSize: 16, textAlign: "center" }}>Nessun post dai seguiti</p>
          <p style={{ color: "rgba(255,255,255,.4)", fontSize: 13, textAlign: "center", lineHeight: 1.6 }}>Segui altri creator per vedere i loro contenuti qui.</p>
          <button onClick={() => window.location.href = "/explore"} style={{ padding: "12px 24px", borderRadius: 14, background: "#FF4D4D", border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            Scopri creator ⚡
          </button>
        </div>
      </div>
    );
  }

  if (!post) return (
    <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
      <p style={{ color: "rgba(255,255,255,.4)", fontSize: 13 }}>Nessun post disponibile</p>
    </div>
  );

  const allMedia = post.mediaUrls?.length > 0 ? post.mediaUrls : (post.mediaUrl ? [post.mediaUrl] : []);
  const currentMedia = allMedia[carouselIndex] || post.mediaUrl;
  const isCarousel = allMedia.length > 1;

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", background: "#000" }}>
      <style>{`@media (max-width: 768px) { .zz-desktop { display: none !important; } } @media (min-width: 769px) { .zz-mobile { display: none !important; } }`}</style>

      <div style={{ position: "absolute", inset: 0, zIndex: 0, background: `linear-gradient(160deg, ${post.color} 0%, #000 100%)`, opacity: currentMedia ? 0.3 : 1 }} />

      {currentMedia && (
        <div style={{ position: "absolute", inset: 0, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
          {post.postType === "video" ? (
            <video ref={videoRef} key={`${post.id}-${current}`} src={currentMedia}
              style={{ height: "100%", width: "auto", maxWidth: "100%", objectFit: "contain" }}
              autoPlay loop playsInline muted={muted} />
          ) : (
            <img key={`${post.id}-${carouselIndex}`} src={currentMedia} alt="post"
              style={{ height: "100%", width: "auto", maxWidth: "100%", objectFit: "contain" }} />
          )}
        </div>
      )}

      <div style={{ position: "absolute", inset: 0, zIndex: 2, background: "linear-gradient(to top, rgba(0,0,0,.9) 0%, rgba(0,0,0,.0) 40%, rgba(0,0,0,.3) 100%)", pointerEvents: "none" }} />

      {/* Overlay testo — custom (overlay_data) o posizione fissa (overlay_text) */}
      {post.overlayData && post.overlayData.length > 0 ? (
        post.overlayData.map((el: any) => (
          <div key={el.id} style={{
            position: "absolute", zIndex: 15,
            left: `${el.x}%`, top: `${el.y}%`,
            padding: el.bg ? "4px 8px" : 0,
            background: el.bg ? "rgba(0,0,0,.55)" : "transparent",
            borderRadius: 6, pointerEvents: "none", maxWidth: "70%",
          }}>
            <span style={{
              color: el.color || "#fff",
              fontFamily: FONT_FAMILIES[el.font] || "-apple-system, sans-serif",
              fontSize: el.size || 20,
              fontWeight: el.bold ? 700 : 400,
              fontStyle: el.italic ? "italic" : "normal",
              display: "block", whiteSpace: "nowrap",
            }}>
              {el.text}
            </span>
          </div>
        ))
      ) : post.overlayText ? (
        <div style={{
          position: "absolute", zIndex: 15, left: 16, right: 70,
          top: post.overlayPosition === "top" ? 100 : post.overlayPosition === "center" ? "50%" : "auto",
          bottom: post.overlayPosition === "bottom" ? 160 : "auto",
          transform: post.overlayPosition === "center" ? "translateY(-50%)" : undefined,
          background: "rgba(0,0,0,.6)", borderRadius: 10, padding: "8px 14px",
          color: "#fff", fontWeight: 700, fontSize: 16, textAlign: "center",
          pointerEvents: "none",
        }}>
          {post.overlayText}
        </div>
      ) : null}

      {isCarousel && (
        <div style={{ position: "absolute", top: 100, left: "50%", transform: "translateX(-50%)", zIndex: 15, display: "flex", gap: 6 }}>
          {allMedia.map((_, i) => (
            <div key={i} onClick={() => setCarouselIndex(i)}
              style={{ width: i === carouselIndex ? 20 : 6, height: 6, borderRadius: 3, background: i === carouselIndex ? "#fff" : "rgba(255,255,255,.4)", cursor: "pointer", transition: "all .2s" }} />
          ))}
        </div>
      )}

      {isCarousel && carouselIndex > 0 && (
        <button onClick={() => setCarouselIndex(c => c - 1)}
          style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", zIndex: 15, width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,.5)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="2"><path d="M9 2L4 7l5 5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      )}
      {isCarousel && carouselIndex < allMedia.length - 1 && (
        <button onClick={() => setCarouselIndex(c => c + 1)}
          style={{ position: "absolute", right: 70, top: "50%", transform: "translateY(-50%)", zIndex: 15, width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,.5)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="2"><path d="M5 2l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      )}

      <NavDesktop active="/feed" />

      {/* Topbar mobile */}
      <div className="zz-mobile" style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 20, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "44px 16px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: "#FF4D4D", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><polygon points="10,1 6,8 9,8 5,15 13,6 9,6" fill="white" /></svg>
          </div>
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 18 }}>Zip<span style={{ color: "#FF4D4D" }}>Zap</span></span>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          <span onClick={() => setFeedTab("perTe")} style={{ color: feedTab === "perTe" ? "#fff" : "rgba(255,255,255,.4)", fontSize: 13, borderBottom: feedTab === "perTe" ? "1.5px solid #fff" : "none", paddingBottom: 2, cursor: "pointer" }}>Per te</span>
          <span onClick={() => setFeedTab("seguiti")} style={{ color: feedTab === "seguiti" ? "#fff" : "rgba(255,255,255,.4)", fontSize: 13, borderBottom: feedTab === "seguiti" ? "1.5px solid #fff" : "none", paddingBottom: 2, cursor: "pointer" }}>Seguiti</span>
        </div>
      </div>

      {/* Tab desktop */}
      <div className="zz-desktop" style={{ position: "absolute", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 20, display: "flex", gap: 24 }}>
        <span onClick={() => setFeedTab("perTe")} style={{ color: feedTab === "perTe" ? "#fff" : "rgba(255,255,255,.4)", fontWeight: 600, fontSize: 14, borderBottom: feedTab === "perTe" ? "2px solid #fff" : "2px solid transparent", paddingBottom: 4, cursor: "pointer" }}>Per te</span>
        <span onClick={() => setFeedTab("seguiti")} style={{ color: feedTab === "seguiti" ? "#fff" : "rgba(255,255,255,.4)", fontWeight: 600, fontSize: 14, borderBottom: feedTab === "seguiti" ? "2px solid #fff" : "2px solid transparent", paddingBottom: 4, cursor: "pointer" }}>Seguiti</span>
      </div>

      {/* Contenuto post in basso */}
      <div style={{ position: "absolute", bottom: 100, left: 16, right: 80, zIndex: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 480 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", border: "2px solid rgba(255,255,255,.9)", background: post.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
              {post.initials}
            </div>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 15, textShadow: "0 1px 4px rgba(0,0,0,.8)" }}>@{post.user}</span>
            {post.userId !== currentUserId && (
              <span style={{ border: "1.5px solid rgba(255,255,255,.7)", borderRadius: 20, padding: "2px 10px", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ Segui</span>
            )}
          </div>
          {post.caption && (
            <p style={{ color: "#fff", fontSize: 14, lineHeight: 1.55, maxWidth: 400, textShadow: "0 1px 6px rgba(0,0,0,.8)" }}>{post.caption}</p>
          )}
          {post.musicTitle && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="1.5">
                <circle cx="4" cy="12" r="2" /><circle cx="12" cy="10" r="2" /><path d="M6 12V4l8-2v8" strokeLinecap="round" />
              </svg>
              <span style={{ color: "rgba(255,255,255,.7)", fontSize: 12 }}>{post.musicTitle} — {post.musicArtist}</span>
            </div>
          )}
          {isCarousel && <span style={{ color: "rgba(255,255,255,.5)", fontSize: 11 }}>📷 {allMedia.length} foto</span>}
          {post.hasLink && post.linkName && (
            <a href={post.linkName.startsWith("http") ? post.linkName : `https://${post.linkName}`}
              target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(0,0,0,.65)", border: "1px solid rgba(255,77,77,.5)", borderRadius: 12, padding: "8px 12px", maxWidth: 300, cursor: "pointer", textDecoration: "none" }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(255,77,77,.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#FF4D4D" strokeWidth="1.4">
                  <path d="M5 7a2 2 0 0 0 2.8 0l1.4-1.4a2 2 0 0 0-2.8-2.8L5.5 3.4" strokeLinecap="round" />
                  <path d="M9 7a2 2 0 0 0-2.8 0L4.8 8.4A2 2 0 0 0 7.6 11.2L8.5 10.3" strokeLinecap="round" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.linkName}</div>
                <div style={{ color: "rgba(255,255,255,.4)", fontSize: 10, marginTop: 1 }}>Apri nel browser ↗</div>
              </div>
              <div style={{ background: "#FF4D4D", color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: 4, padding: "2px 7px", flexShrink: 0 }}>APRI</div>
            </a>
          )}
        </div>
      </div>

      {/* Azioni destra */}
      <div style={{ position: "absolute", right: 12, bottom: 100, zIndex: 30, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", border: "2px solid rgba(255,255,255,.8)", background: post.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13 }}>
            {post.initials}
          </div>
          {post.userId !== currentUserId && (
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#FF4D4D", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, marginTop: -9, cursor: "pointer" }}>+</div>
          )}
        </div>

        <button onClick={toggleLike} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, border: "none", background: "none", cursor: "pointer" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: liked ? "rgba(255,77,77,.25)" : "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 20 20" fill={liked ? "#FF4D4D" : "none"} stroke={liked ? "#FF4D4D" : "#fff"} strokeWidth="1.6">
              <path d="M10 17S4 13.5 4 8a4.5 4.5 0 0 1 6-4.24A4.5 4.5 0 0 1 16 8C16 13.5 10 17 10 17z" />
            </svg>
          </div>
          <span style={{ color: liked ? "#FF4D4D" : "rgba(255,255,255,.8)", fontSize: 11 }}>{formatCount(likesCount)}</span>
        </button>

        <button onClick={() => setCommentPostId(post.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, border: "none", background: "none", cursor: "pointer" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="1.6">
              <path d="M3 3h14v10H3z" /><path d="M7 17h6M10 13v4" />
            </svg>
          </div>
          <span style={{ color: "rgba(255,255,255,.8)", fontSize: 11 }}>{formatCount(post.comments)}</span>
        </button>

        <button onClick={toggleBookmark} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, border: "none", background: "none", cursor: "pointer" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: bookmarked ? "rgba(255,200,0,.2)" : "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill={bookmarked ? "#FFD700" : "none"} stroke={bookmarked ? "#FFD700" : "#fff"} strokeWidth="1.6">
              <path d="M4 3h12v15l-6-4-6 4V3z" strokeLinejoin="round" />
            </svg>
          </div>
          <span style={{ color: bookmarked ? "#FFD700" : "rgba(255,255,255,.8)", fontSize: 11 }}>Salva</span>
        </button>

        <button onClick={() => setShowShare(true)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, border: "none", background: "none", cursor: "pointer" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="1.6">
              <path d="M17 7L10 4 3 7l7 3.5L17 7z" /><path d="M3 11l7 3.5L17 11M3 15l7 3.5L17 15" />
            </svg>
          </div>
          <span style={{ color: "rgba(255,255,255,.8)", fontSize: 11 }}>Condividi</span>
        </button>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <button onClick={handleUnmute} style={{ width: 48, height: 48, borderRadius: "50%", background: muted ? "rgba(255,77,77,.2)" : "rgba(255,255,255,.15)", border: muted ? "1.5px solid rgba(255,77,77,.5)" : "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            {muted ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF4D4D" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <line x1="23" y1="9" x2="17" y2="15" strokeLinecap="round" />
                <line x1="17" y1="9" x2="23" y2="15" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" strokeLinecap="round" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" strokeLinecap="round" />
              </svg>
            )}
          </button>
          <span style={{ color: muted ? "rgba(255,77,77,.8)" : "rgba(255,255,255,.6)", fontSize: 9, fontWeight: 700 }}>{muted ? "MUTO" : "AUDIO"}</span>
          {showVolume && !muted && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "rgba(0,0,0,.75)", borderRadius: 16, padding: "12px 10px", marginTop: 4 }}>
              <input type="range" min="0" max="1" step="0.05" value={volume}
                onChange={(e) => handleVolume(parseFloat(e.target.value))}
                style={{ width: 4, height: 80, cursor: "pointer", accentColor: "#FF4D4D", writingMode: "vertical-lr" as any, direction: "rtl" as any }} />
              <span style={{ color: "rgba(255,255,255,.5)", fontSize: 9 }}>{Math.round(volume * 100)}%</span>
            </div>
          )}
        </div>

        {post.hasLink && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ background: "rgba(29,158,117,.3)", border: "1px solid rgba(29,158,117,.6)", color: "#4dffb8", fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "3px 8px" }}>{post.earn}</div>
            <span style={{ color: "#4dffb8", fontSize: 9, fontWeight: 700 }}>live</span>
          </div>
        )}
      </div>

      {/* Frecce navigazione */}
      <div style={{ position: "absolute", left: 216, top: "50%", transform: "translateY(-50%)", zIndex: 20, display: "flex", flexDirection: "column", gap: 8 }}>
        <button onClick={() => { setCurrent(c => Math.max(0, c - 1)); setCarouselIndex(0); }}
          style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "rgba(255,255,255,.15)", cursor: "pointer", opacity: current === 0 ? .3 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="1.8"><path d="M2 9l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button onClick={() => { setCurrent(c => Math.min(posts.length - 1, c + 1)); setCarouselIndex(0); }}
          style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "rgba(255,255,255,.15)", cursor: "pointer", opacity: current === posts.length - 1 ? .3 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="1.8"><path d="M2 5l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>

      {/* Navbar mobile bottom */}
      <div className="zz-mobile" style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30, display: "flex", alignItems: "center", justifyContent: "space-around", padding: "10px 16px 28px", background: "rgba(0,0,0,.88)", borderTop: "0.5px solid rgba(255,255,255,.08)" }}>
        {[{ href: "/feed", label: "Home", active: true }, { href: "/explore", label: "Esplora" }, { href: "/create", label: "Crea", isCreate: true }, { href: "/store", label: "Store", isStore: true }, { href: "/profile", label: "Profilo" }].map(item => (
          <a key={item.href} href={item.href} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textDecoration: "none" }}>
            {(item as any).isCreate ? (
              <div style={{ width: 46, height: 32, borderRadius: 10, background: "#FF4D4D", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#fff" strokeWidth="2"><path d="M9 3v12M3 9h12" strokeLinecap="round" /></svg>
              </div>
            ) : (item as any).isStore ? (
              <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,77,77,.12)", border: "1px solid rgba(255,77,77,.25)", borderRadius: 8, padding: "4px 8px" }}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><polygon points="10,1 6,8 9,8 5,15 13,6 9,6" fill="#FF4D4D" /></svg>
                <span style={{ color: "#FF4D4D", fontSize: 11, fontWeight: 700 }}>Store</span>
              </div>
            ) : (
              <>
                <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke={(item as any).active ? "#fff" : "rgba(255,255,255,.35)"} strokeWidth={(item as any).active ? "1.8" : "1.6"}>
                  {item.href === "/feed" && <path d="M2.5 8.5l7.5-5.5 7.5 5.5v9H2.5z" />}
                  {item.href === "/explore" && <><circle cx="10" cy="10" r="6" /><path d="M14 14l2.5 2.5" strokeLinecap="round" /></>}
                  {item.href === "/profile" && <><circle cx="10" cy="7" r="3.5" /><path d="M3 18c0-3.5 3.1-6 7-6s7 2.5 7 6" /></>}
                </svg>
                <span style={{ fontSize: 9, fontWeight: 500, color: (item as any).active ? "#fff" : "rgba(255,255,255,.35)" }}>{item.label}</span>
              </>
            )}
          </a>
        ))}
      </div>

      {/* Modal condivisione */}
      {showShare && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", background: "rgba(0,0,0,.7)" }} onClick={() => setShowShare(false)}>
          <div style={{ width: "100%", borderRadius: "20px 20px 0 0", background: "#111", border: "0.5px solid rgba(255,255,255,.1)", padding: "20px 20px 40px" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 900, color: "#fff", fontSize: 16, marginBottom: 20 }}>Condividi</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <button onClick={() => {
                if (navigator.share) navigator.share({ title: post.user, text: post.caption, url: window.location.href });
                else { navigator.clipboard.writeText(window.location.href); setShareMsg("Link copiato!"); }
                setShowShare(false);
              }} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,.05)", border: "none", cursor: "pointer", width: "100%" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="1.6"><circle cx="14" cy="3" r="2" /><circle cx="4" cy="10" r="2" /><circle cx="14" cy="17" r="2" /><path d="M6 9l6-4M6 11l6 4" strokeLinecap="round" /></svg>
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>Condividi</div>
                  <div style={{ color: "rgba(255,255,255,.4)", fontSize: 11, marginTop: 2 }}>Invia tramite app</div>
                </div>
              </button>
              <button onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setShareMsg("Link copiato! ✓");
                setTimeout(() => setShareMsg(""), 2000);
              }} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,.05)", border: "none", cursor: "pointer", width: "100%" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="1.6"><rect x="8" y="8" width="10" height="10" rx="2" /><path d="M4 12H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v1" /></svg>
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>Copia link</div>
                  <div style={{ color: "rgba(255,255,255,.4)", fontSize: 11, marginTop: 2 }}>Copia il link del post</div>
                </div>
              </button>
            </div>
            {shareMsg && (
              <div style={{ marginTop: 16, padding: "10px 16px", borderRadius: 12, background: "rgba(29,158,117,.15)", border: "1px solid rgba(29,158,117,.3)", color: "#4dffb8", fontSize: 13, fontWeight: 600, textAlign: "center" }}>
                {shareMsg}
              </div>
            )}
          </div>
        </div>
      )}

      {commentPostId && <Comments postId={commentPostId} onClose={() => setCommentPostId(null)} />}
    </div>
  );
}