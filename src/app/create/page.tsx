"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

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

function formatDuration(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function Create() {
  const router = useRouter();
  const [type, setType] = useState<"video" | "photo" | "text">("video");
  const [caption, setCaption] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [showMusic, setShowMusic] = useState(false);
  const [musicTab, setMusicTab] = useState<"library" | "original">("library");
  const [selectedTrack, setSelectedTrack] = useState<{ id: string; title: string; artist: string; url?: string } | null>(null);
  const [uploadedAudio, setUploadedAudio] = useState<File | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

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

  function handleAudioUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedAudio(file);
    setSelectedTrack({ id: "original", title: file.name.replace(/\.[^.]+$/, ""), artist: "Il mio audio" });
    setShowMusic(false);
    stopPreview();
  }

  function stopPreview() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    if (progressInterval.current) clearInterval(progressInterval.current);
    setPlayingId(null);
  }

  function togglePreview(track: typeof libraryTracks[0]) {
    if (playingId === track.id) {
      stopPreview();
      return;
    }
    stopPreview();
    const audio = new Audio(track.url);
    audioRef.current = audio;
    audio.play();
    setPlayingId(track.id);
    setProgress((p) => ({ ...p, [track.id]: 0 }));
    progressInterval.current = setInterval(() => {
      if (audio.duration) {
        setProgress((p) => ({
          ...p,
          [track.id]: (audio.currentTime / audio.duration) * 100,
        }));
      }
    }, 200);
    audio.onended = () => {
      setPlayingId(null);
      setProgress((p) => ({ ...p, [track.id]: 0 }));
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
    setPublishing(true);
    stopPreview();
    await new Promise((r) => setTimeout(r, 1500));
    setPublishing(false);
    setPublished(true);
    setTimeout(() => router.push("/feed"), 1500);
  }

  if (published) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4"
        style={{ background: "#000" }}>
        <div className="rounded-full flex items-center justify-center"
          style={{ width: 64, height: 64, background: "rgba(29,158,117,.15)", border: "2px solid rgba(29,158,117,.4)" }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#4dffb8" strokeWidth="2.5">
            <path d="M5 14l6 6L23 8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="font-black text-white text-xl">Pubblicato! ⚡</p>
        <p className="text-sm" style={{ color: "rgba(255,255,255,.4)" }}>Torno al feed...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col"
      style={{ background: "linear-gradient(135deg, #0d0000 0%, #000 60%)" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4 flex-shrink-0">
        <button onClick={() => { router.back(); stopPreview(); }}
          className="rounded-xl flex items-center justify-center"
          style={{ width: 40, height: 40, background: "rgba(255,255,255,.08)" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
            stroke="rgba(255,255,255,.7)" strokeWidth="1.5">
            <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center rounded-xl"
            style={{ width: 32, height: 32, background: "#FF4D4D" }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <polygon points="10,1 6,8 9,8 5,15 13,6 9,6" fill="white" />
            </svg>
          </div>
          <span className="text-xl font-black text-white tracking-tight">
            Zip<span style={{ color: "#FF4D4D" }}>Zap</span>
          </span>
        </div>
        <div style={{ width: 40 }} />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-28">

        {/* Tipo */}
        <div className="flex gap-2 mb-5">
          {(["video", "photo", "text"] as const).map((t) => (
            <button key={t} onClick={() => setType(t)}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm"
              style={{
                background: type === t ? "#FF4D4D" : "rgba(255,255,255,.07)",
                color: type === t ? "#fff" : "rgba(255,255,255,.4)",
              }}>
              {t === "video" ? "Video" : t === "photo" ? "Foto" : "Testo"}
            </button>
          ))}
        </div>

        {/* Upload media */}
        {(type === "video" || type === "photo") && (
          <div className="mb-5">
            {mediaPreview ? (
              <div className="relative rounded-2xl overflow-hidden" style={{ height: 200 }}>
                {type === "video"
                  ? <video src={mediaPreview} className="w-full h-full object-cover" />
                  : <img src={mediaPreview} alt="preview" className="w-full h-full object-cover" />}
                <button onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                  className="absolute top-3 right-3 rounded-full flex items-center justify-center"
                  style={{ width: 28, height: 28, background: "rgba(0,0,0,.6)" }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                    stroke="#fff" strokeWidth="1.5">
                    <path d="M2 2l8 8M10 2l-8 8" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ) : (
              <label htmlFor="media-upload"
                className="flex flex-col items-center justify-center rounded-2xl cursor-pointer"
                style={{ height: 200, border: "1.5px dashed rgba(255,255,255,.15)", background: "rgba(255,255,255,.03)" }}>
                <div className="flex items-center justify-center rounded-2xl mb-3"
                  style={{ width: 52, height: 52, background: "rgba(255,77,77,.15)" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF4D4D" strokeWidth="1.5">
                    {type === "video"
                      ? <><rect x="2" y="4" width="15" height="16" rx="2" /><path d="M17 9l5-3v12l-5-3" /></>
                      : <><rect x="2" y="2" width="20" height="20" rx="3" /><circle cx="8" cy="8" r="2" /><path d="M2 17l6-5 4 4 3-3 7 7" /></>}
                  </svg>
                </div>
                <p className="font-bold text-white text-sm mb-1">
                  {type === "video" ? "Carica video" : "Carica foto"}
                </p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,.3)" }}>
                  {type === "video" ? "MP4, MOV · max 500MB" : "JPG, PNG · max 20MB"}
                </p>
              </label>
            )}
            <input id="media-upload" ref={mediaInputRef} type="file"
              accept={type === "video" ? "video/*" : "image/*"}
              className="hidden" onChange={handleMediaChange} />
          </div>
        )}

        {/* Descrizione */}
        <div className="mb-4">
          <label className="text-xs font-bold mb-2 block"
            style={{ color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: ".4px" }}>
            Descrizione
          </label>
          <textarea value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, 300))}
            placeholder="Descrivi il tuo contenuto..."
            rows={type === "text" ? 8 : 4}
            className="w-full rounded-2xl px-4 py-3 text-white text-sm outline-none resize-none"
            style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,.08)" }} />
          <div className="text-right text-xs mt-1" style={{ color: "rgba(255,255,255,.2)" }}>
            {caption.length}/300
          </div>
        </div>

        {/* Musica */}
        <div className="mb-4 rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(255,255,255,.08)" }}>
          <button onClick={() => setShowMusic(!showMusic)}
            className="w-full flex items-center justify-between px-4 py-3"
            style={{ background: "rgba(255,255,255,.04)" }}>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-lg"
                style={{ width: 32, height: 32, background: selectedTrack ? "rgba(255,77,77,.2)" : "rgba(255,77,77,.1)" }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
                  stroke="#FF4D4D" strokeWidth="1.5">
                  <circle cx="4" cy="12" r="2" />
                  <circle cx="12" cy="10" r="2" />
                  <path d="M6 12V4l8-2v8" strokeLinecap="round" />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-white">
                  {selectedTrack ? selectedTrack.title : "Aggiungi musica"}
                </div>
                {selectedTrack && (
                  <div className="text-xs" style={{ color: "rgba(255,255,255,.4)" }}>
                    {selectedTrack.artist}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedTrack && (
                <button onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTrack(null);
                  setUploadedAudio(null);
                  stopPreview();
                }}
                  className="text-xs rounded-full px-2 py-0.5"
                  style={{ background: "rgba(255,255,255,.1)", color: "rgba(255,255,255,.5)" }}>
                  rimuovi
                </button>
              )}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                stroke="rgba(255,255,255,.4)" strokeWidth="1.5">
                <path d={showMusic ? "M2 9l5-5 5 5" : "M2 5l5 5 5-5"} strokeLinecap="round" />
              </svg>
            </div>
          </button>

          {showMusic && (
            <div>
              <div className="flex border-b" style={{ borderColor: "rgba(255,255,255,.08)" }}>
                {(["library", "original"] as const).map((tab) => (
                  <button key={tab} onClick={() => setMusicTab(tab)}
                    className="flex-1 py-2.5 text-sm font-semibold"
                    style={{
                      color: musicTab === tab ? "#fff" : "rgba(255,255,255,.3)",
                      borderBottom: musicTab === tab ? "2px solid #FF4D4D" : "2px solid transparent",
                    }}>
                    {tab === "library" ? "Libreria" : "Il mio audio"}
                  </button>
                ))}
              </div>

              {/* Libreria con anteprima */}
              {musicTab === "library" && (
                <div className="flex flex-col" style={{ maxHeight: 320, overflowY: "auto" }}>
                  {libraryTracks.map((track) => {
                    const isPlaying = playingId === track.id;
                    const isSelected = selectedTrack?.id === track.id;
                    const prog = progress[track.id] || 0;
                    return (
                      <div key={track.id}
                        className="flex items-center gap-3 px-4 py-3"
                        style={{
                          borderBottom: "0.5px solid rgba(255,255,255,.05)",
                          background: isSelected ? "rgba(255,77,77,.06)" : "transparent",
                        }}>

                        {/* Play/Pause button */}
                        <button onClick={() => togglePreview(track)}
                          className="flex items-center justify-center rounded-full flex-shrink-0"
                          style={{
                            width: 40, height: 40,
                            background: isPlaying ? "#FF4D4D" : "rgba(255,255,255,.08)",
                            border: isPlaying ? "none" : "1px solid rgba(255,255,255,.1)",
                            transition: "all .2s",
                          }}>
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

                        {/* Info + progress */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-white truncate">{track.title}</div>
                          <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,.35)" }}>
                            {track.artist} · {formatDuration(track.duration)}
                          </div>
                          {isPlaying && (
                            <div className="mt-1.5 rounded-full overflow-hidden"
                              style={{ height: 3, background: "rgba(255,255,255,.1)" }}>
                              <div className="h-full rounded-full"
                                style={{ width: `${prog}%`, background: "#FF4D4D", transition: "width .2s" }} />
                            </div>
                          )}
                        </div>

                        {/* Seleziona */}
                        <button onClick={() => selectTrack(track)}
                          className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold"
                          style={{
                            background: isSelected ? "rgba(29,158,117,.2)" : "rgba(255,255,255,.08)",
                            color: isSelected ? "#4dffb8" : "rgba(255,255,255,.5)",
                            border: isSelected ? "1px solid rgba(29,158,117,.3)" : "1px solid transparent",
                          }}>
                          {isSelected ? "✓" : "Usa"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Audio originale */}
              {musicTab === "original" && (
                <div className="p-4">
                  <label htmlFor="audio-upload"
                    className="flex flex-col items-center justify-center rounded-2xl cursor-pointer py-8"
                    style={{
                      border: "1.5px dashed rgba(255,255,255,.12)",
                      background: uploadedAudio ? "rgba(255,77,77,.06)" : "transparent",
                    }}>
                    <div className="flex items-center justify-center rounded-xl mb-3"
                      style={{ width: 48, height: 48, background: "rgba(255,77,77,.15)" }}>
                      <svg width="22" height="22" viewBox="0 0 20 20" fill="none"
                        stroke="#FF4D4D" strokeWidth="1.5">
                        <circle cx="5" cy="15" r="2.5" />
                        <circle cx="14" cy="13" r="2.5" />
                        <path d="M7.5 15V7l9-2v8" strokeLinecap="round" />
                      </svg>
                    </div>
                    {uploadedAudio ? (
                      <>
                        <p className="font-bold text-white text-sm">{uploadedAudio.name}</p>
                        <p className="text-xs mt-1" style={{ color: "rgba(29,158,117,.8)" }}>Audio caricato ✓</p>
                      </>
                    ) : (
                      <>
                        <p className="font-bold text-white text-sm mb-1">Carica il tuo audio</p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,.3)" }}>
                          MP3, WAV, AAC · max 50MB
                        </p>
                      </>
                    )}
                  </label>
                  <input id="audio-upload" ref={audioInputRef} type="file"
                    accept="audio/*" className="hidden" onChange={handleAudioUpload} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Link affiliato */}
        <div className="mb-6 rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(255,77,77,.2)" }}>
          <div className="px-4 py-2.5 flex items-center justify-between"
            style={{ background: "rgba(255,77,77,.07)" }}>
            <span className="text-xs font-bold"
              style={{ color: "#FF4D4D", textTransform: "uppercase", letterSpacing: ".4px" }}>
              Link affiliato
            </span>
            <span className="text-xs" style={{ color: "rgba(255,255,255,.3)" }}>opzionale</span>
          </div>
          <div className="px-4 py-3">
            <input type="url" value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://amazon.it/prodotto..."
              className="w-full bg-transparent text-sm outline-none"
              style={{ color: "#FF4D4D" }} />
          </div>
        </div>

        <button onClick={handlePublish} disabled={publishing}
          className="w-full py-4 rounded-2xl font-black text-white text-base"
          style={{ background: publishing ? "#993333" : "#FF4D4D" }}>
          {publishing ? "Pubblicazione..." : "Pubblica ⚡"}
        </button>

      </div>
    </div>
  );
}