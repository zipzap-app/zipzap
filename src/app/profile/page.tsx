"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  username: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  category: string;
  link_bio_url: string;
  link_bio_title: string;
};

type Post = {
  id: string;
  type: string;
  media_url: string;
  caption: string;
  likes_count: number;
  comments_count: number;
  views_count: number;
};

function formatCount(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function Profile() {
  const [activeTab, setActiveTab] = useState("video");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [bookmarks, setBookmarks] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [followersCount, setFollowersCount] = useState(0);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }

      const [
        { data: profileData },
        { data: postsData },
        { count: followers },
        { data: bookmarksData },
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("posts").select("id, type, media_url, caption, likes_count, comments_count, views_count").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", user.id),
        supabase.from("bookmarks").select("post_id, posts(id, type, media_url, caption, likes_count, comments_count, views_count)").eq("user_id", user.id),
      ]);

      if (profileData) setProfile(profileData);
      if (postsData) setPosts(postsData);
      if (bookmarksData) setBookmarks(bookmarksData.map((b: any) => b.posts).filter(Boolean));
      setFollowersCount(followers || 0);
      setLoading(false);
    }
    load();
  }, []);

  const initials = profile?.full_name?.[0]?.toUpperCase() || profile?.username?.[0]?.toUpperCase() || "?";

  const filteredPosts = activeTab === "preferiti" ? bookmarks : posts.filter((p) => {
    if (activeTab === "video") return p.type === "video";
    if (activeTab === "foto") return p.type === "photo";
    if (activeTab === "testo") return p.type === "text";
    return true;
  });

  const totalLikes = posts.reduce((sum, p) => sum + (p.likes_count || 0), 0);

  if (loading) {
    return (
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#FF4D4D", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
              <polygon points="10,1 6,8 9,8 5,15 13,6 9,6" fill="white" />
            </svg>
          </div>
          <p style={{ color: "rgba(255,255,255,.4)", fontSize: 13 }}>Caricamento...</p>
        </div>
      </div>
    );
  }

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

      {/* Navbar sinistra desktop */}
      <div className="zz-nav" style={{ position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 40, width: 220, flexDirection: "column", gap: 6, padding: "32px 20px", background: "rgba(10,10,10,.95)", borderRight: "0.5px solid rgba(255,255,255,.07)" }}>
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
          { label: "Home", href: "/feed" },
          { label: "Esplora", href: "/explore" },
          { label: "Zap Store", href: "/store", isStore: true },
          { label: "Profilo", href: "/profile", active: true },
        ].map((item) => (
          <a key={item.href} href={item.href} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12, background: item.active ? "rgba(255,255,255,.1)" : "transparent", textDecoration: "none", color: item.isStore ? "#FF4D4D" : "rgba(255,255,255,.8)", fontWeight: 600, fontSize: 14 }}>
            {item.label}
          </a>
        ))}
      </div>

      {/* Navbar mobile bottom */}
      <div className="zz-mob-bot" style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40, alignItems: "center", justifyContent: "space-around", padding: "10px 16px 28px", background: "rgba(0,0,0,.9)", borderTop: "0.5px solid rgba(255,255,255,.08)" }}>
        {[
          { href: "/feed", label: "Home" },
          { href: "/explore", label: "Esplora" },
          { href: "/create", label: "Crea", isCreate: true },
          { href: "/store", label: "Store", isStore: true },
          { href: "/profile", label: "Profilo", active: true },
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
                  {item.href === "/explore" && <><circle cx="10" cy="10" r="6" /></>}
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

      {/* Contenuto */}
      <div className="zz-content" style={{ minHeight: "100vh", background: "#0a0a0a", paddingBottom: 100 }}>

        {/* Cover */}
        <div style={{ position: "relative", height: 200, background: "linear-gradient(135deg, #1a0000 0%, #2a0808 50%, #0a0a0a 100%)" }}>
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: .2 }} viewBox="0 0 600 200" preserveAspectRatio="xMidYMid slice">
            <circle cx="520" cy="20" r="160" fill="#FF4D4D" />
            <circle cx="60" cy="160" r="120" fill="#FF4D4D" />
          </svg>
          <div style={{ position: "absolute", bottom: -40, left: 24 }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", border: "4px solid #0a0a0a", background: "#1a0020", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ color: "#FF4D4D", fontWeight: 900, fontSize: 28 }}>{initials}</span>
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: "52px 24px 16px" }}>
          <div style={{ fontWeight: 900, fontSize: 22, color: "#fff" }}>
            {profile?.full_name || profile?.username || "Utente"}
          </div>
          <div style={{ color: "rgba(255,255,255,.4)", fontSize: 13, marginTop: 4 }}>
            @{profile?.username || "utente"}{profile?.category ? ` · ${profile.category}` : ""}
          </div>
          {profile?.bio && profile.bio.trim() !== "" && (
            <div style={{ color: "rgba(255,255,255,.75)", fontSize: 14, marginTop: 10, lineHeight: 1.6, maxWidth: 500, whiteSpace: "pre-wrap" }}>
              {profile.bio}
            </div>
          )}

          {/* Stats */}
          <div style={{ display: "flex", gap: 28, marginTop: 16, paddingTop: 16, paddingBottom: 16, borderTop: "0.5px solid rgba(255,255,255,.08)", borderBottom: "0.5px solid rgba(255,255,255,.08)" }}>
            {[
              [String(followersCount), "Follower"],
              [String(posts.length), "Post"],
              [formatCount(totalLikes), "Like"],
            ].map(([n, l]) => (
              <div key={l}>
                <div style={{ color: "#fff", fontWeight: 900, fontSize: 18 }}>{n}</div>
                <div style={{ color: "rgba(255,255,255,.3)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".3px", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Pulsanti */}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <a href="/profile/edit" style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: "1px solid rgba(255,255,255,.2)", color: "#fff", fontWeight: 700, fontSize: 13, textAlign: "center", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
              Modifica profilo
            </a>
            <button onClick={() => {
              if (navigator.share) navigator.share({ title: profile?.username || "ZipZap", url: window.location.href });
              else navigator.clipboard.writeText(window.location.href);
            }} style={{ width: 42, height: 42, borderRadius: 12, border: "1px solid rgba(255,255,255,.2)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="1.3">
                <circle cx="13" cy="2.5" r="1.5" /><circle cx="3" cy="8" r="1.5" /><circle cx="13" cy="13.5" r="1.5" />
                <path d="M4.5 7l7-3.5M4.5 9l7 3.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Link in bio */}
          {(profile?.link_bio_url || profile?.link_bio_title) && (
            <div style={{ marginTop: 16, borderRadius: 16, padding: "12px 16px", background: "rgba(255,77,77,.07)", border: "1px solid rgba(255,77,77,.2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: "#FF4D4D", background: "rgba(255,77,77,.15)", borderRadius: 4, padding: "2px 7px" }}>LINK IN BIO</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(29,158,117,.8)", background: "rgba(29,158,117,.1)", borderRadius: 4, padding: "2px 7px", marginLeft: "auto" }}>apre nel browser</span>
              </div>
              {profile?.link_bio_title && <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{profile.link_bio_title}</div>}
              {profile?.link_bio_url && (
                <a href={profile.link_bio_url} target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,77,77,.7)", fontSize: 12, marginTop: 3, display: "block", textDecoration: "none" }}>
                  {profile.link_bio_url}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "0.5px solid rgba(255,255,255,.07)", padding: "0 24px", marginTop: 8 }}>
          {[
            { key: "video", label: "Video" },
            { key: "foto", label: "Foto" },
            { key: "testo", label: "Testo" },
            { key: "preferiti", label: "⭐ Salvati" },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ flex: 1, textAlign: "center", padding: "12px 0", fontWeight: 600, fontSize: 11, color: activeTab === tab.key ? "#fff" : "rgba(255,255,255,.3)", background: "transparent", border: "none", borderBottom: activeTab === tab.key ? "2px solid #FF4D4D" : "2px solid transparent", cursor: "pointer" }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Grid post */}
        {filteredPosts.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: activeTab === "preferiti" ? "rgba(255,200,0,.1)" : "rgba(255,77,77,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {activeTab === "preferiti" ? (
                <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="#FFD700" strokeWidth="1.5">
                  <path d="M4 3h12v15l-6-4-6 4V3z" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#FF4D4D" strokeWidth="1.5">
                  <rect x="2" y="4" width="13" height="14" rx="2" /><path d="M15 8l5-3v10l-5-3" />
                </svg>
              )}
            </div>
            <p style={{ color: "rgba(255,255,255,.3)", fontSize: 13, textAlign: "center", lineHeight: 1.6 }}>
              {activeTab === "preferiti"
                ? "Nessun post salvato ancora.\nSalva i post che ti piacciono dal feed."
                : <>Nessun contenuto ancora.<br /><a href="/create" style={{ color: "#FF4D4D", textDecoration: "none", fontWeight: 600 }}>Pubblica il primo ⚡</a></>
              }
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, marginTop: 2 }}>
            {filteredPosts.map((p) => (
              <div key={p.id} onClick={() => window.location.href = "/feed"}
                style={{ position: "relative", aspectRatio: ".56", background: "#1a1a1a", overflow: "hidden", cursor: "pointer" }}>

                {p.media_url && p.type === "video" && (
                  <video src={p.media_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted playsInline />
                )}
                {p.media_url && p.type === "photo" && (
                  <img src={p.media_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
                {!p.media_url && (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #1a1a2e, #0a0a1a)", padding: 8 }}>
                    <span style={{ color: "rgba(255,255,255,.25)", fontSize: 11, textAlign: "center" }}>{p.caption?.slice(0, 40)}</span>
                  </div>
                )}

                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.7) 0%, transparent 50%)" }} />

                {p.type === "video" && (
                  <div style={{ position: "absolute", top: 6, right: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,.8)" strokeWidth="1.5">
                      <rect x="1" y="3" width="10" height="10" rx="1.5" />
                      <path d="M11 6l4-2v8l-4-2" />
                    </svg>
                  </div>
                )}

                {activeTab === "preferiti" && (
                  <div style={{ position: "absolute", top: 6, left: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="#FFD700" stroke="#FFD700" strokeWidth="1">
                      <path d="M4 3h12v15l-6-4-6 4V3z" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}

                <div style={{ position: "absolute", bottom: 6, left: 6, display: "flex", alignItems: "center", gap: 3 }}>
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,.8)" strokeWidth="1.5">
                    <path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" />
                    <circle cx="8" cy="8" r="2" />
                  </svg>
                  <span style={{ color: "rgba(255,255,255,.8)", fontSize: 10, fontWeight: 600 }}>
                    {formatCount(p.views_count || 0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}