"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const libraryTracks = [
  { id: "1", title: "Summer Vibes", artist: "Pexels Music", duration: 180, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: "2", title: "Chill Lofi Beat", artist: "Free Music Archive", duration: 142, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: "3", title: "Epic Cinematic", artist: "Bensound", duration: 210, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { id: "4", title: "Acoustic Morning", artist: "Pixabay Music", duration: 165, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
  { id: "5", title: "Urban Groove", artist: "Free Music Archive", duration: 198, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
  { id: "6", title: "Dreamy Ambient", artist: "Bensound", duration: 223, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },
  { id: "7", title: "Happy Pop", artist: "Pixabay Music", duration: 155, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3" },
  { id: "8", title: "Dark Electronic", artist: "Free Music Archive", duration: 190, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
];

const overlayPositions = [
  { val: "top", label: "In alto" },
  { val: "center", label: "Al centro" },
  { val: "bottom", label: "In basso" },
];

function formatDuration(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function Create() {
  const router = useRouter();
  const [type, setType] = useState<"video" | "photo" | "text">("video");
  const [caption, setCaption] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  // Media
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Overlay text
  const [overlayText, setOverlayText] = useState("");
  const [overlayPosition, setOverlayPosition] = useState("bottom");
  const [showOverlayEditor, setShowOverlayEditor] = useState(false);

  // Musica
  const [showMusic, setShowMusic] = useState(false);
  const [musicTab, setMusicTab] = useState<"library" | "original">("library");
  const [selectedTrack, setSelectedTrack] = useState<{ id: string; title: string; artist: string; url?: string } | null>(null);
  const [uploadedAudio, setUploadedAudio] = useState<File | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});

  // Visibilità
  const [visibility, setVisibility] = useState<"public" | "friends" | "private">("public");

  // Stato pubblicazione
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);

  function handleMediaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  }

  function handlePhotosChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newFiles = [...photoFiles, ...files].slice(0, 10);
    setPhotoFiles(newFiles);
    setPhotoPreviews(newFiles.map(f => URL.createObjectURL(f)));
    setCarouselIndex(0);
  }

  function removePhoto(idx: number) {
    const newFiles = photoFiles.filter((_, i) => i !== idx);
    setPhotoFiles(newFiles);
    setPhotoPreviews(newFiles.map(f => URL.createObjectURL(f)));
    setCarouselIndex(Math.min(carouselIndex, newFiles.length - 1));
  }

  function handleAudioUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedAudio(file);
    setSelectedTrack({ id: "original", title: file.name.replace(/\.[^.]+$/, ""), artist: "Il mio audio" });
    setShowMusic(false);
    stopPreview();
  }

  function stopPreview() {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
    if (progressInterval.current) clearInterval(progressInterval.current);
    setPlayingId(null);
  }

  function togglePreview(track: typeof libraryTracks[0]) {
    if (playingId === track.id) { stopPreview(); return; }
    stopPreview();
    const audio = new Audio(track.url);
    audioRef.current = audio;
    audio.play();
    setPlayingId(track.id);
    setProgress(p => ({ ...p, [track.id]: 0 }));
    progressInterval.current = setInterval(() => {
      if (audio.duration) setProgress(p => ({ ...p, [track.id]: (audio.currentTime / audio.duration) * 100 }));
    }, 200);
    audio.onended = () => {
      setPlayingId(null);
      setProgress(p => ({ ...p, [track.id]: 0 }));
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }

  function selectTrack(track: typeof libraryTracks[0]) {
    stopPreview();
    setSelectedTrack(track);
    setUploadedAudio(null);
    setShowMusic(false);
  }

  async function handlePublish() {
    if (type === "video" && !mediaFile) { alert("Carica un video"); return; }
    if (type === "photo" && photoFiles.length === 0) { alert("Carica almeno una foto"); return; }
    if (type === "text" && !caption) { alert("Scrivi qualcosa"); return; }

    setPublishing(true);
    stopPreview();

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    let mediaUrl = null;
    let mediaUrls: string[] = [];
    let musicUrl = null;

    // Upload video
    if (type === "video" && mediaFile) {
      setUploadProgress(10);
      const ext = mediaFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("videos").upload(path, mediaFile, { upsert: true });
      if (!error) {
        const { data } = supabase.storage.from("videos").getPublicUrl(path);
        mediaUrl = data.publicUrl;
      }
      setUploadProgress(50);
    }

    // Upload foto carosello
    if (type === "photo" && photoFiles.length > 0) {
      setUploadProgress(10);
      for (let i = 0; i < photoFiles.length; i++) {
        const file = photoFiles[i];
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${Date.now()}_${i}.${ext}`;
        const { error } = await supabase.storage.from("images").upload(path, file, { upsert: true });
        if (!error) {
          const { data } = supabase.storage.from("images").getPublicUrl(path);
          mediaUrls.push(data.publicUrl);
        }
        setUploadProgress(10 + Math.round((i + 1) / photoFiles.length * 50));
      }
      if (mediaUrls.length > 0) mediaUrl = mediaUrls[0];
    }

    // Upload audio originale
    if (uploadedAudio) {
      setUploadProgress(65);
      const ext = uploadedAudio.name.split(".").pop();
      const path = `${user.id}/audio/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("audio").upload(path, uploadedAudio, { upsert: true });
      if (!error) {
        const { data } = supabase.storage.from("audio").getPublicUrl(path);
        musicUrl = data.publicUrl;
      }
    } else if (selectedTrack?.url) {
      musicUrl = selectedTrack.url;
    }

    setUploadProgress(80);

    const { error } = await supabase.from("posts").insert({
      user_id: user.id,
      caption,
      type,
      media_url: mediaUrl,
      media_urls: mediaUrls.length > 0 ? mediaUrls : null,
      link_url: linkUrl || null,
      music_title: selectedTrack?.title || null,
      music_artist: selectedTrack?.artist || null,
      music_url: musicUrl || null,
      visibility,
      overlay_text: overlayText || null,
      overlay_position: overlayPosition,
    });

    if (error) { alert("Errore: " + error.message); setPublishing(false); setUploadProgress(0); return; }

    setUploadProgress(100);
    setPublishing(false);
    setPublished(true);
    setTimeout(() => router.push("/feed"), 1500);
  }

  if (published) {
    return (
      <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: "#000" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(29,158,117,.15)", border: "2px solid rgba(29,158,117,.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#4dffb8" strokeWidth="2.5">
            <path d="M5 14l6 6L23 8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p style={{ color: "#fff", fontWeight: 900, fontSize: 20 }}>Pubblicato! ⚡</p>
        <p style={{ color: "rgba(255,255,255,.4)", fontSize: 13 }}>Torno al feed...</p>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: "linear-gradient(135deg, #0d0000 0%, #000 60%)" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "48px 20px 16px", flexShrink: 0 }}>
        <button onClick={() => { router.back(); stopPreview(); }}
          style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,.08)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="1.5">
            <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "#FF4D4D", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><polygon points="10,1 6,8 9,8 5,15 13,6 9,6" fill="white" /></svg>
          </div>
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 20, letterSpacing: -0.5 }}>Zip<span style={{ color: "#FF4D4D" }}>Zap</span></span>
        </div>
        <div style={{ width: 40 }} />
      </div>

      {publishing && uploadProgress > 0 && (
        <div style={{ height: 3, background: "rgba(255,255,255,.1)", flexShrink: 0 }}>
          <div style={{ height: "100%", background: "#FF4D4D", width: `${uploadProgress}%`, transition: "width .3s" }} />
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 100px" }}>

        {/* Tipo */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, marginTop: 4 }}>
          {(["video", "photo", "text"] as const).map((t) => (
            <button key={t} onClick={() => { setType(t); setMediaFile(null); setMediaPreview(null); setPhotoFiles([]); setPhotoPreviews([]); }}
              style={{ flex: 1, padding: "10px 0", borderRadius: 12, fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", background: type === t ? "#FF4D4D" : "rgba(255,255,255,.07)", color: type === t ? "#fff" : "rgba(255,255,255,.4)" }}>
              {t === "video" ? "🎥 Video" : t === "photo" ? "📷 Foto" : "✍️ Testo"}
            </button>
          ))}
        </div>

        {/* Upload VIDEO */}
        {type === "video" && (
          <div style={{ marginBottom: 20 }}>
            {mediaPreview ? (
              <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", height: 220 }}>
                <video src={mediaPreview} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                {overlayText && (
                  <div style={{
                    position: "absolute",
                    left: 12, right: 12,
                    top: overlayPosition === "top" ? 12 : overlayPosition === "center" ? "50%" : "auto",
bottom: overlayPosition === "bottom" ? 12 : "auto",
transform: overlayPosition === "center" ? "translateY(-50%)" : undefined,
                    background: "rgba(0,0,0,.55)", borderRadius: 8, padding: "6px 10px",
                    color: "#fff", fontWeight: 700, fontSize: 15, textAlign: "center",
                  }}>{overlayText}</div>
                )}
                <button onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                  style={{ position: "absolute", top: 10, right: 10, width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,.6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="1.5"><path d="M2 2l8 8M10 2l-8 8" strokeLinecap="round" /></svg>
                </button>
              </div>
            ) : (
              <label htmlFor="media-upload" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 200, borderRadius: 16, border: "1.5px dashed rgba(255,255,255,.15)", background: "rgba(255,255,255,.03)", cursor: "pointer" }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(255,77,77,.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF4D4D" strokeWidth="1.5">
                    <rect x="2" y="4" width="15" height="16" rx="2" /><path d="M17 9l5-3v12l-5-3" />
                  </svg>
                </div>
                <p style={{ color: "#fff", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Carica video</p>
                <p style={{ color: "rgba(255,255,255,.3)", fontSize: 12 }}>MP4, MOV · max 500MB</p>
              </label>
            )}
            <input id="media-upload" ref={mediaInputRef} type="file" accept="video/*" style={{ display: "none" }} onChange={handleMediaChange} />
          </div>
        )}

        {/* Upload FOTO CAROSELLO */}
        {type === "photo" && (
          <div style={{ marginBottom: 20 }}>
            {photoPreviews.length > 0 ? (
              <div style={{ position: "relative" }}>
                {/* Preview carosello */}
                <div style={{ borderRadius: 16, overflow: "hidden", height: 280, position: "relative", background: "#000" }}>
                  <img src={photoPreviews[carouselIndex]} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />

                  {/* Overlay text preview */}
                  {overlayText && (
                    <div style={{
                      position: "absolute", left: 12, right: 12,
                      top: overlayPosition === "top" ? 12 : overlayPosition === "center" ? "50%" : "auto",
                      bottom: overlayPosition === "bottom" ? 12 : "auto",
                      transform: overlayPosition === "center" ? "translateY(-50%)" : undefined,
                      background: "rgba(0,0,0,.55)", borderRadius: 8, padding: "6px 10px",
                      color: "#fff", fontWeight: 700, fontSize: 15, textAlign: "center",
                    }}>{overlayText}</div>
                  )}

                  {/* Indicatori */}
                  {photoPreviews.length > 1 && (
                    <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5 }}>
                      {photoPreviews.map((_, i) => (
                        <div key={i} onClick={() => setCarouselIndex(i)}
                          style={{ width: i === carouselIndex ? 18 : 6, height: 6, borderRadius: 3, background: i === carouselIndex ? "#fff" : "rgba(255,255,255,.4)", cursor: "pointer", transition: "all .2s" }} />
                      ))}
                    </div>
                  )}

                  {/* Frecce carosello */}
                  {photoPreviews.length > 1 && (
                    <>
                      {carouselIndex > 0 && (
                        <button onClick={() => setCarouselIndex(c => c - 1)}
                          style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,.5)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="2"><path d="M9 2L4 7l5 5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </button>
                      )}
                      {carouselIndex < photoPreviews.length - 1 && (
                        <button onClick={() => setCarouselIndex(c => c + 1)}
                          style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,.5)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="2"><path d="M5 2l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </button>
                      )}
                    </>
                  )}

                  {/* Elimina foto corrente */}
                  <button onClick={() => removePhoto(carouselIndex)}
                    style={{ position: "absolute", top: 10, right: 10, width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,.6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="1.5"><path d="M2 2l8 8M10 2l-8 8" strokeLinecap="round" /></svg>
                  </button>

                  {/* Contatore */}
                  <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,.6)", borderRadius: 8, padding: "3px 8px", color: "#fff", fontSize: 11, fontWeight: 600 }}>
                    {carouselIndex + 1}/{photoPreviews.length}
                  </div>
                </div>

                {/* Aggiungi altra foto */}
                {photoFiles.length < 10 && (
                  <label htmlFor="photo-add" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10, padding: "10px", borderRadius: 12, border: "1px dashed rgba(255,255,255,.2)", cursor: "pointer", color: "rgba(255,255,255,.5)", fontSize: 13 }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="1.5"><path d="M8 2v12M2 8h12" strokeLinecap="round" /></svg>
                    Aggiungi foto ({photoFiles.length}/10)
                  </label>
                )}
                <input id="photo-add" type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handlePhotosChange} />
              </div>
            ) : (
              <label htmlFor="photos-upload" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 200, borderRadius: 16, border: "1.5px dashed rgba(255,255,255,.15)", background: "rgba(255,255,255,.03)", cursor: "pointer" }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(255,77,77,.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF4D4D" strokeWidth="1.5">
                    <rect x="2" y="2" width="20" height="20" rx="3" /><circle cx="8" cy="8" r="2" /><path d="M2 17l6-5 4 4 3-3 7 7" />
                  </svg>
                </div>
                <p style={{ color: "#fff", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Carica foto</p>
                <p style={{ color: "rgba(255,255,255,.3)", fontSize: 12 }}>Fino a 10 foto · Carosello automatico</p>
              </label>
            )}
            <input id="photos-upload" type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handlePhotosChange} />
          </div>
        )}

        {/* Descrizione */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ color: "rgba(255,255,255,.3)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".4px", display: "block", marginBottom: 8 }}>Descrizione</label>
          <textarea value={caption} onChange={(e) => setCaption(e.target.value.slice(0, 300))}
            placeholder="Descrivi il tuo contenuto..." rows={type === "text" ? 8 : 3}
            style={{ width: "100%", borderRadius: 16, padding: "12px 16px", color: "#fff", fontSize: 13, outline: "none", resize: "none", background: "#1a1a1a", border: "1px solid rgba(255,255,255,.08)", boxSizing: "border-box" }} />
          <div style={{ textAlign: "right", fontSize: 10, color: "rgba(255,255,255,.2)", marginTop: 4 }}>{caption.length}/300</div>
        </div>

        {/* Testo overlay stile TikTok */}
        {(type === "video" || type === "photo") && (
          <div style={{ marginBottom: 16, borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,.08)" }}>
            <button onClick={() => setShowOverlayEditor(!showOverlayEditor)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "rgba(255,255,255,.04)", border: "none", cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: overlayText ? "rgba(255,77,77,.2)" : "rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke={overlayText ? "#FF4D4D" : "rgba(255,255,255,.6)"} strokeWidth="1.5">
                    <path d="M2 4h12M2 8h8M2 12h5" strokeLinecap="round" />
                  </svg>
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ color: overlayText ? "#FF4D4D" : "#fff", fontWeight: 700, fontSize: 13 }}>
                    {overlayText ? `"${overlayText.slice(0, 20)}${overlayText.length > 20 ? "..." : ""}"` : "Testo sul video"}
                  </div>
                  <div style={{ color: "rgba(255,255,255,.3)", fontSize: 11, marginTop: 2 }}>Testo sovrapposto come TikTok</div>
                </div>
              </div>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="1.5">
                <path d={showOverlayEditor ? "M2 9l5-5 5 5" : "M2 5l5 5 5-5"} strokeLinecap="round" />
              </svg>
            </button>

            {showOverlayEditor && (
              <div style={{ padding: 16 }}>
                <input type="text" value={overlayText} onChange={(e) => setOverlayText(e.target.value.slice(0, 80))}
                  placeholder="Scrivi il testo da sovrapporre..."
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 12, background: "#1a1a1a", border: "1px solid rgba(255,255,255,.1)", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 12 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  {overlayPositions.map(p => (
                    <button key={p.val} onClick={() => setOverlayPosition(p.val)}
                      style={{ flex: 1, padding: "8px 0", borderRadius: 10, fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer", background: overlayPosition === p.val ? "#FF4D4D" : "rgba(255,255,255,.08)", color: overlayPosition === p.val ? "#fff" : "rgba(255,255,255,.5)" }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Musica */}
        <div style={{ marginBottom: 16, borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,.08)" }}>
          <button onClick={() => setShowMusic(!showMusic)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "rgba(255,255,255,.04)", border: "none", cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: selectedTrack ? "rgba(255,77,77,.2)" : "rgba(255,77,77,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#FF4D4D" strokeWidth="1.5">
                  <circle cx="4" cy="12" r="2" /><circle cx="12" cy="10" r="2" />
                  <path d="M6 12V4l8-2v8" strokeLinecap="round" />
                </svg>
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{selectedTrack ? selectedTrack.title : "Aggiungi musica"}</div>
                {selectedTrack && <div style={{ color: "rgba(255,255,255,.4)", fontSize: 11, marginTop: 2 }}>{selectedTrack.artist}</div>}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {selectedTrack && (
                <button onClick={(e) => { e.stopPropagation(); setSelectedTrack(null); setUploadedAudio(null); stopPreview(); }}
                  style={{ fontSize: 11, borderRadius: 20, padding: "2px 8px", background: "rgba(255,255,255,.1)", color: "rgba(255,255,255,.5)", border: "none", cursor: "pointer" }}>
                  rimuovi
                </button>
              )}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="1.5">
                <path d={showMusic ? "M2 9l5-5 5 5" : "M2 5l5 5 5-5"} strokeLinecap="round" />
              </svg>
            </div>
          </button>

          {showMusic && (
            <div>
              <div style={{ display: "flex", borderBottom: "0.5px solid rgba(255,255,255,.08)" }}>
                {(["library", "original"] as const).map((tab) => (
                  <button key={tab} onClick={() => setMusicTab(tab)}
                    style={{ flex: 1, padding: "10px 0", fontSize: 13, fontWeight: 600, color: musicTab === tab ? "#fff" : "rgba(255,255,255,.3)", background: "transparent", border: "none", borderBottom: musicTab === tab ? "2px solid #FF4D4D" : "2px solid transparent", cursor: "pointer" }}>
                    {tab === "library" ? "Libreria" : "Il mio audio"}
                  </button>
                ))}
              </div>

              {musicTab === "library" && (
                <div style={{ maxHeight: 300, overflowY: "auto" }}>
                  {libraryTracks.map((track) => {
                    const isPlaying = playingId === track.id;
                    const isSelected = selectedTrack?.id === track.id;
                    const prog = progress[track.id] || 0;
                    return (
                      <div key={track.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "0.5px solid rgba(255,255,255,.05)", background: isSelected ? "rgba(255,77,77,.06)" : "transparent" }}>
                        <button onClick={() => togglePreview(track)}
                          style={{ width: 40, height: 40, borderRadius: "50%", background: isPlaying ? "#FF4D4D" : "rgba(255,255,255,.08)", border: isPlaying ? "none" : "1px solid rgba(255,255,255,.1)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {isPlaying ? (
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <rect x="2" y="2" width="4" height="10" rx="1" fill="#fff" />
                              <rect x="8" y="2" width="4" height="10" rx="1" fill="#fff" />
                            </svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M4 2l8 5-8 5V2z" fill="rgba(255,255,255,.7)" />
                            </svg>
                          )}
                        </button>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: "#fff", fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title}</div>
                          <div style={{ color: "rgba(255,255,255,.35)", fontSize: 11, marginTop: 2 }}>{track.artist} · {formatDuration(track.duration)}</div>
                          {isPlaying && (
                            <div style={{ marginTop: 6, borderRadius: 4, overflow: "hidden", height: 3, background: "rgba(255,255,255,.1)" }}>
                              <div style={{ height: "100%", borderRadius: 4, background: "#FF4D4D", width: `${prog}%`, transition: "width .2s" }} />
                            </div>
                          )}
                        </div>
                        <button onClick={() => selectTrack(track)}
                          style={{ flexShrink: 0, padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", background: isSelected ? "rgba(29,158,117,.2)" : "rgba(255,255,255,.08)", color: isSelected ? "#4dffb8" : "rgba(255,255,255,.5)", border: isSelected ? "1px solid rgba(29,158,117,.3)" : "1px solid transparent" }}>
                          {isSelected ? "✓" : "Usa"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {musicTab === "original" && (
                <div style={{ padding: 16 }}>
                  <label htmlFor="audio-upload" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 16, border: "1.5px dashed rgba(255,255,255,.12)", background: uploadedAudio ? "rgba(255,77,77,.06)" : "transparent", padding: "32px 16px", cursor: "pointer" }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,77,77,.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                      <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="#FF4D4D" strokeWidth="1.5">
                        <circle cx="5" cy="15" r="2.5" /><circle cx="14" cy="13" r="2.5" />
                        <path d="M7.5 15V7l9-2v8" strokeLinecap="round" />
                      </svg>
                    </div>
                    {uploadedAudio ? (
                      <>
                        <p style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{uploadedAudio.name}</p>
                        <p style={{ color: "rgba(29,158,117,.8)", fontSize: 11, marginTop: 4 }}>Audio caricato ✓</p>
                      </>
                    ) : (
                      <>
                        <p style={{ color: "#fff", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Carica il tuo audio</p>
                        <p style={{ color: "rgba(255,255,255,.3)", fontSize: 11 }}>MP3, WAV, AAC · max 50MB</p>
                      </>
                    )}
                  </label>
                  <input id="audio-upload" ref={audioInputRef} type="file" accept="audio/*" style={{ display: "none" }} onChange={handleAudioUpload} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Visibilità */}
        <div style={{ marginBottom: 16, borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,.08)" }}>
          <div style={{ padding: "10px 16px", background: "rgba(255,255,255,.04)" }}>
            <span style={{ color: "rgba(255,255,255,.4)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".4px" }}>Visibilità</span>
          </div>
          {[
            { val: "public", label: "Tutti", desc: "Visibile a chiunque nel feed pubblico", icon: "🌍" },
            { val: "friends", label: "Amici", desc: "Solo chi ti segue può vederlo", icon: "👥" },
            { val: "private", label: "Solo io", desc: "Visibile solo a te, non compare nel feed", icon: "🔒" },
          ].map((v, i) => (
            <button key={v.val} onClick={() => setVisibility(v.val as any)}
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", width: "100%", background: visibility === v.val ? "rgba(255,77,77,.08)" : "transparent", border: "none", borderBottom: i < 2 ? "0.5px solid rgba(255,255,255,.06)" : "none", cursor: "pointer", textAlign: "left" }}>
              <span style={{ fontSize: 20 }}>{v.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: visibility === v.val ? "#FF4D4D" : "#fff", fontWeight: 600, fontSize: 13 }}>{v.label}</div>
                <div style={{ color: "rgba(255,255,255,.3)", fontSize: 11, marginTop: 2 }}>{v.desc}</div>
              </div>
              <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${visibility === v.val ? "#FF4D4D" : "rgba(255,255,255,.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {visibility === v.val && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF4D4D" }} />}
              </div>
            </button>
          ))}
        </div>

        {/* Link affiliato */}
        <div style={{ marginBottom: 24, borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,77,77,.2)" }}>
          <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,77,77,.07)" }}>
            <span style={{ color: "#FF4D4D", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".4px" }}>Link affiliato</span>
            <span style={{ color: "rgba(255,255,255,.3)", fontSize: 11 }}>opzionale</span>
          </div>
          <div style={{ padding: "12px 16px" }}>
            <input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://amazon.it/prodotto..."
              style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "#FF4D4D", fontSize: 13 }} />
          </div>
        </div>

        <button onClick={handlePublish} disabled={publishing}
          style={{ width: "100%", padding: "16px 0", borderRadius: 16, fontWeight: 900, fontSize: 15, color: "#fff", border: "none", cursor: publishing ? "not-allowed" : "pointer", background: publishing ? "#993333" : "#FF4D4D" }}>
          {publishing ? `Pubblicazione... ${uploadProgress}%` : "Pubblica ⚡"}
        </button>
      </div>
    </div>
  );
}