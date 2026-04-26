"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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

const FONTS = [
  { id: "sans", label: "Sans", family: "-apple-system, sans-serif" },
  { id: "serif", label: "Serif", family: "Georgia, serif" },
  { id: "mono", label: "Mono", family: "monospace" },
  { id: "rounded", label: "Round", family: "Helvetica Neue, sans-serif" },
];

const COLORS = ["#ffffff", "#000000", "#FF4D4D", "#FFD700", "#4dffb8", "#60a5fa", "#f472b6", "#fb923c"];

function formatDuration(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function formatTimeMs(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const cs = Math.floor((ms % 1000) / 100);
  return `${m}:${String(s).padStart(2, "0")}.${cs}`;
}

type TextElement = {
  id: string;
  text: string;
  x: number;
  y: number;
  font: string;
  size: number;
  color: string;
  bold: boolean;
  italic: boolean;
  align: "left" | "center" | "right";
  bg: boolean;
  link: string;
  startMs?: number;
  endMs?: number;
};

function TextOverlayEditor({
  mediaPreview,
  mediaType,
  elements,
  setElements,
  onClose,
}: {
  mediaPreview: string | null;
  mediaType: "video" | "photo" | "text";
  elements: TextElement[];
  setElements: (e: TextElement[]) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [videoDurationMs, setVideoDurationMs] = useState(0);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; startX: number; startY: number; elemX: number; elemY: number } | null>(null);
  const tlDragRef = useRef<{ mode: "left" | "right" | "move"; startX: number; origStartMs: number; origEndMs: number; trackW: number } | null>(null);

  const isVideo = mediaType === "video";
  const selectedEl = elements.find(e => e.id === selected) || null;

  // Normalizza i testi: se c'è un video e mancano startMs/endMs, riempi con i default
  useEffect(() => {
    if (!isVideo || videoDurationMs === 0) return;
    let needsUpdate = false;
    const updated = elements.map(el => {
      if (el.startMs === undefined || el.endMs === undefined) {
        needsUpdate = true;
        return {
          ...el,
          startMs: el.startMs ?? 0,
          endMs: el.endMs ?? videoDurationMs,
        };
      }
      return el;
    });
    if (needsUpdate) setElements(updated);
  }, [isVideo, videoDurationMs]);

  function addText() {
    const newEl: TextElement = {
      id: Date.now().toString(),
      text: "Testo",
      x: 30, y: 40,
      font: "sans",
      size: 22,
      color: "#ffffff",
      bold: false, italic: false,
      align: "center",
      bg: true,
      link: "",
      startMs: 0,
      endMs: isVideo && videoDurationMs > 0 ? videoDurationMs : 999999,
    };
    setElements([...elements, newEl]);
    setSelected(newEl.id);
    setEditing(true);
  }

  function updateEl(id: string, changes: Partial<TextElement>) {
    setElements(elements.map(e => e.id === id ? { ...e, ...changes } : e));
  }

  function deleteEl(id: string) {
    setElements(elements.filter(e => e.id !== id));
    setSelected(null);
  }

  // ===== Drag testo sul canvas =====
  function startDrag(clientX: number, clientY: number, id: string) {
    setSelected(id);
    const el = elements.find(el => el.id === id);
    if (!el) return;
    dragRef.current = { id, startX: clientX, startY: clientY, elemX: el.x, elemY: el.y };
  }

  useEffect(() => {
    function getXY(e: MouseEvent | TouchEvent) {
      if ("touches" in e && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      const m = e as MouseEvent;
      return { x: m.clientX, y: m.clientY };
    }
    function onMove(e: MouseEvent | TouchEvent) {
      if (!dragRef.current || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const { x, y } = getXY(e);
      const dx = ((x - dragRef.current.startX) / rect.width) * 100;
      const dy = ((y - dragRef.current.startY) / rect.height) * 100;
      const newX = Math.max(0, Math.min(95, dragRef.current.elemX + dx));
      const newY = Math.max(0, Math.min(95, dragRef.current.elemY + dy));
      const id = dragRef.current.id;
      setElements(elements.map(el => el.id === id ? { ...el, x: newX, y: newY } : el));
    }
    function onUp() { dragRef.current = null; }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [elements]);

  // ===== Drag timeline =====
  function startTimelineDrag(mode: "left" | "right" | "move", clientX: number) {
    if (!selectedEl || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    tlDragRef.current = {
      mode,
      startX: clientX,
      origStartMs: selectedEl.startMs ?? 0,
      origEndMs: selectedEl.endMs ?? videoDurationMs,
      trackW: rect.width,
    };
  }

  useEffect(() => {
    function getX(e: MouseEvent | TouchEvent) {
      if ("touches" in e && e.touches.length > 0) return e.touches[0].clientX;
      return (e as MouseEvent).clientX;
    }
    function onMove(e: MouseEvent | TouchEvent) {
      if (!tlDragRef.current || !selectedEl || videoDurationMs === 0) return;
      e.preventDefault?.();
      const dx = getX(e) - tlDragRef.current.startX;
      const dms = (dx / tlDragRef.current.trackW) * videoDurationMs;
      const { mode, origStartMs, origEndMs } = tlDragRef.current;
      const minRange = 200;
      let newStart = origStartMs;
      let newEnd = origEndMs;
      if (mode === "left") {
        newStart = Math.max(0, Math.min(origEndMs - minRange, origStartMs + dms));
      } else if (mode === "right") {
        newEnd = Math.max(origStartMs + minRange, Math.min(videoDurationMs, origEndMs + dms));
      } else {
        const range = origEndMs - origStartMs;
        newStart = Math.max(0, Math.min(videoDurationMs - range, origStartMs + dms));
        newEnd = newStart + range;
      }
      updateEl(selectedEl.id, { startMs: Math.round(newStart), endMs: Math.round(newEnd) });
    }
    function onUp() { tlDragRef.current = null; }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [selectedEl, videoDurationMs, elements]);

  // ===== Player controls =====
  function togglePlay() {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }

  function seekToMs(ms: number) {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(videoDurationMs / 1000, ms / 1000));
    setCurrentTimeMs(ms);
  }

  function handleTimeUpdate() {
    if (!videoRef.current) return;
    setCurrentTimeMs(videoRef.current.currentTime * 1000);
  }
  function handleLoadedMetadata() {
    if (!videoRef.current) return;
    setVideoDurationMs((videoRef.current.duration || 0) * 1000);
  }

  function isVisibleAt(el: TextElement, timeMs: number) {
    if (!isVideo) return true;
    const start = el.startMs ?? 0;
    const end = el.endMs ?? videoDurationMs;
    return timeMs >= start && timeMs <= end;
  }
  function shouldRender(el: TextElement) {
    if (selected === el.id) return true;
    if (!isPlaying) return true;
    return isVisibleAt(el, currentTimeMs);
  }

  const toolbarFlipBelow = !!selectedEl && selectedEl.y < 15;
  const playPct = videoDurationMs > 0 ? (currentTimeMs / videoDurationMs) * 100 : 0;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "#000", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "44px 16px 12px", flexShrink: 0, background: "rgba(0,0,0,.85)", borderBottom: "0.5px solid rgba(255,255,255,.06)" }}>
        <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 10, background: "rgba(255,255,255,.1)", border: "none", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
          Annulla
        </button>
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>Editor testo</span>
        <button onClick={onClose} style={{ padding: "8px 18px", borderRadius: 10, background: "#FF4D4D", border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          Fatto
        </button>
      </div>

      {/* Canvas */}
      <div ref={canvasRef} onClick={() => { setSelected(null); setEditing(false); }}
        style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>

        {/* Media di sfondo */}
        {mediaPreview && isVideo && (
          <video
            ref={videoRef}
            src={mediaPreview}
            style={{ height: "100%", width: "auto", maxWidth: "100%", objectFit: "contain" }}
            muted loop playsInline
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
          />
        )}
        {mediaPreview && mediaType === "photo" && (
          <img src={mediaPreview} style={{ height: "100%", width: "auto", maxWidth: "100%", objectFit: "contain" }} alt="" />
        )}
        {(!mediaPreview || mediaType === "text") && (
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #1a0030, #0a0a2e)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {!mediaPreview && <span style={{ color: "rgba(255,255,255,.2)", fontSize: 13 }}>Anteprima</span>}
          </div>
        )}

        {/* Testi */}
        {elements.map(el => {
          if (!shouldRender(el)) return null;
          const fontObj = FONTS.find(f => f.id === el.font);
          const isSelected = selected === el.id;
          const dimmed = isVideo && isSelected && !isVisibleAt(el, currentTimeMs) && isPlaying;
          return (
            <div
              key={el.id}
              onMouseDown={(e) => { e.stopPropagation(); startDrag(e.clientX, e.clientY, el.id); }}
              onTouchStart={(e) => { e.stopPropagation(); const t = e.touches[0]; startDrag(t.clientX, t.clientY, el.id); }}
              onDoubleClick={(e) => { e.stopPropagation(); setSelected(el.id); setEditing(true); }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                left: `${el.x}%`,
                top: `${el.y}%`,
                cursor: "move",
                userSelect: "none",
                outline: isSelected ? "2px solid #FF4D4D" : "none",
                outlineOffset: 2,
                borderRadius: 6,
                padding: el.bg ? "4px 10px" : 0,
                background: el.bg ? "rgba(0,0,0,.55)" : "transparent",
                maxWidth: "70%",
                opacity: dimmed ? 0.4 : 1,
              }}>
              {editing && isSelected ? (
                <input
                  autoFocus
                  value={el.text}
                  onChange={e => updateEl(el.id, { text: e.target.value })}
                  onBlur={() => setEditing(false)}
                  onClick={e => e.stopPropagation()}
                  onMouseDown={e => e.stopPropagation()}
                  style={{
                    background: "transparent", border: "none", outline: "none",
                    color: el.color,
                    fontFamily: fontObj?.family,
                    fontSize: el.size,
                    fontWeight: el.bold ? 700 : 400,
                    fontStyle: el.italic ? "italic" : "normal",
                    textAlign: el.align,
                    width: Math.max(80, el.text.length * el.size * 0.6),
                    minWidth: 60,
                  }}
                />
              ) : (
                <span style={{
                  color: el.color,
                  fontFamily: fontObj?.family,
                  fontSize: el.size,
                  fontWeight: el.bold ? 700 : 400,
                  fontStyle: el.italic ? "italic" : "normal",
                  textAlign: el.align,
                  display: "block",
                  whiteSpace: "nowrap",
                }}>
                  {el.text || "Testo"}
                </span>
              )}
            </div>
          );
        })}

        {/* Toolbar fluttuante (segue il testo selezionato) */}
        {selectedEl && !editing && (
          <div onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}
            style={{
              position: "absolute",
              left: `${selectedEl.x}%`,
              top: `${selectedEl.y}%`,
              transform: toolbarFlipBelow ? "translate(-50%, calc(100% + 14px))" : "translate(-50%, calc(-100% - 14px))",
              zIndex: 50,
              background: "rgba(20,20,20,.96)",
              backdropFilter: "blur(12px)",
              borderRadius: 12,
              padding: 8,
              display: "flex",
              flexDirection: "column",
              gap: 6,
              boxShadow: "0 6px 20px rgba(0,0,0,.5)",
              border: "0.5px solid rgba(255,255,255,.1)",
              maxWidth: 320,
            }}>
            {/* Riga 1: font + size */}
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {FONTS.map(f => (
                <button key={f.id} onClick={() => updateEl(selectedEl.id, { font: f.id })}
                  style={{
                    padding: "5px 9px", borderRadius: 7, fontSize: 11, fontWeight: 700, fontFamily: f.family, cursor: "pointer",
                    border: selectedEl.font === f.id ? "1.5px solid #FF4D4D" : "1px solid rgba(255,255,255,.1)",
                    background: selectedEl.font === f.id ? "rgba(255,77,77,.15)" : "rgba(255,255,255,.04)",
                    color: selectedEl.font === f.id ? "#FF4D4D" : "rgba(255,255,255,.85)",
                  }}>{f.label}</button>
              ))}
              <div style={{ width: 1, height: 18, background: "rgba(255,255,255,.1)", margin: "0 2px" }} />
              <button onClick={() => updateEl(selectedEl.id, { size: Math.max(12, selectedEl.size - 2) })}
                style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.05)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, padding: 0 }}>−</button>
              <span style={{ color: "#fff", fontSize: 11, fontWeight: 700, minWidth: 24, textAlign: "center" }}>{selectedEl.size}</span>
              <button onClick={() => updateEl(selectedEl.id, { size: Math.min(72, selectedEl.size + 2) })}
                style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.05)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, padding: 0 }}>+</button>
            </div>

            {/* Riga 2: B / I / Aa + colori + cestino */}
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <button onClick={() => updateEl(selectedEl.id, { bold: !selectedEl.bold })}
                style={{ width: 28, height: 28, borderRadius: 7, border: selectedEl.bold ? "1.5px solid #FF4D4D" : "1px solid rgba(255,255,255,.1)", background: selectedEl.bold ? "rgba(255,77,77,.15)" : "transparent", color: selectedEl.bold ? "#FF4D4D" : "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer" }}>B</button>
              <button onClick={() => updateEl(selectedEl.id, { italic: !selectedEl.italic })}
                style={{ width: 28, height: 28, borderRadius: 7, border: selectedEl.italic ? "1.5px solid #FF4D4D" : "1px solid rgba(255,255,255,.1)", background: selectedEl.italic ? "rgba(255,77,77,.15)" : "transparent", color: selectedEl.italic ? "#FF4D4D" : "#fff", fontSize: 13, fontStyle: "italic", cursor: "pointer", fontWeight: 700 }}>I</button>
              <button onClick={() => updateEl(selectedEl.id, { bg: !selectedEl.bg })}
                title={selectedEl.bg ? "Rimuovi sfondo" : "Aggiungi sfondo"}
                style={{ width: 28, height: 28, borderRadius: 7, border: selectedEl.bg ? "1.5px solid #FF4D4D" : "1px solid rgba(255,255,255,.1)", background: selectedEl.bg ? "rgba(255,77,77,.15)" : "transparent", color: selectedEl.bg ? "#FF4D4D" : "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Aa</button>
              <div style={{ width: 1, height: 18, background: "rgba(255,255,255,.1)", margin: "0 2px" }} />
              {COLORS.map(c => (
                <button key={c} onClick={() => updateEl(selectedEl.id, { color: c })}
                  style={{
                    width: 20, height: 20, borderRadius: "50%", background: c, cursor: "pointer", padding: 0, flexShrink: 0,
                    border: selectedEl.color === c ? "2px solid #FF4D4D" : "1.5px solid rgba(255,255,255,.2)",
                    boxShadow: selectedEl.color === c ? "0 0 0 1px rgba(0,0,0,.5)" : "none",
                  }} />
              ))}
              <div style={{ width: 1, height: 18, background: "rgba(255,255,255,.1)", margin: "0 2px" }} />
              <button onClick={() => deleteEl(selectedEl.id)}
                style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid rgba(255,77,77,.3)", background: "rgba(255,77,77,.08)", color: "#FF4D4D", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#FF4D4D" strokeWidth="1.5"><path d="M2 4h10M5 4V2h4v2M4 4l1 9h4l1-9" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          </div>
        )}

        {/* Bottone aggiungi testo */}
        <button onClick={(e) => { e.stopPropagation(); addText(); }}
          style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", padding: "10px 22px", borderRadius: 22, background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.3)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="2"><path d="M7 2v10M2 7h10" strokeLinecap="round" /></svg>
          Aggiungi testo
        </button>
      </div>

      {/* Hint sopra timeline (foto/testo) */}
      {!isVideo && (
        <div style={{ background: "#0d0d0d", borderTop: "0.5px solid rgba(255,255,255,.06)", padding: "10px 16px 28px", flexShrink: 0, color: "rgba(255,255,255,.4)", fontSize: 11, textAlign: "center" }}>
          Doppio tap sul testo per modificarlo · Trascina per spostarlo
        </div>
      )}

      {/* Timeline (solo video) */}
      {isVideo && (
        <div style={{ background: "#0d0d0d", borderTop: "0.5px solid rgba(255,255,255,.06)", padding: "10px 14px 22px", flexShrink: 0 }}>
          {/* Riga player */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <button onClick={togglePlay}
              style={{ width: 36, height: 36, borderRadius: "50%", background: "#FF4D4D", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {isPlaying ? (
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <rect x="2" y="2" width="3.5" height="10" rx="1" fill="#fff" />
                  <rect x="8.5" y="2" width="3.5" height="10" rx="1" fill="#fff" />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M3.5 2L11 7l-7.5 5V2z" fill="#fff" />
                </svg>
              )}
            </button>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,.5)" }}>
                <span style={{ fontWeight: 700, color: "#fff", fontFeatureSettings: '"tnum"' as any }}>{formatTimeMs(currentTimeMs)}</span>
                <span style={{ fontFeatureSettings: '"tnum"' as any }}>{formatTimeMs(videoDurationMs)}</span>
              </div>
              {selectedEl ? (
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)" }}>
                  Testo selezionato visibile da <span style={{ color: "#FF4D4D", fontWeight: 700 }}>{formatTimeMs(selectedEl.startMs ?? 0)}</span> a <span style={{ color: "#FF4D4D", fontWeight: 700 }}>{formatTimeMs(selectedEl.endMs ?? videoDurationMs)}</span>
                </div>
              ) : (
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.3)" }}>
                  {elements.length === 0 ? "Aggiungi un testo per iniziare" : "Tocca un testo per regolarne la durata"}
                </div>
              )}
            </div>
          </div>

          {/* Track */}
          <div ref={trackRef}
            onMouseDown={(e) => {
              if (!videoDurationMs || !trackRef.current) return;
              const rect = trackRef.current.getBoundingClientRect();
              const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              seekToMs(ratio * videoDurationMs);
            }}
            style={{ position: "relative", height: 44, background: "rgba(255,255,255,.05)", borderRadius: 8, cursor: "pointer", overflow: "hidden", touchAction: "none" }}>

            {/* Blocchi tutti i testi (read-only, sempre visibili) */}
            {videoDurationMs > 0 && elements.map(el => {
              if (selected === el.id) return null;
              const left = ((el.startMs ?? 0) / videoDurationMs) * 100;
              const width = (((el.endMs ?? videoDurationMs) - (el.startMs ?? 0)) / videoDurationMs) * 100;
              return (
                <div key={el.id} onClick={(e) => { e.stopPropagation(); setSelected(el.id); }}
                  style={{ position: "absolute", left: `${left}%`, top: 6, width: `${width}%`, height: 32, background: "rgba(255,255,255,.12)", borderRadius: 5, border: "1px solid rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: "pointer" }}>
                  <span style={{ color: "rgba(255,255,255,.7)", fontSize: 10, fontWeight: 600, padding: "0 6px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{el.text}</span>
                </div>
              );
            })}

            {/* Blocco testo selezionato (con maniglie drag) */}
            {selectedEl && videoDurationMs > 0 && (() => {
              const left = ((selectedEl.startMs ?? 0) / videoDurationMs) * 100;
              const width = (((selectedEl.endMs ?? videoDurationMs) - (selectedEl.startMs ?? 0)) / videoDurationMs) * 100;
              return (
                <div style={{ position: "absolute", left: `${left}%`, top: 6, width: `${width}%`, height: 32, background: "rgba(255,77,77,.25)", borderRadius: 6, border: "1.5px solid #FF4D4D", display: "flex", alignItems: "center", overflow: "visible", boxSizing: "border-box" }}
                  onMouseDown={(e) => { e.stopPropagation(); startTimelineDrag("move", e.clientX); }}
                  onTouchStart={(e) => { e.stopPropagation(); startTimelineDrag("move", e.touches[0].clientX); }}>
                  {/* Handle sinistro */}
                  <div onMouseDown={(e) => { e.stopPropagation(); startTimelineDrag("left", e.clientX); }}
                    onTouchStart={(e) => { e.stopPropagation(); startTimelineDrag("left", e.touches[0].clientX); }}
                    style={{ position: "absolute", left: -8, top: -2, width: 16, height: 36, cursor: "ew-resize", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 4, height: 22, background: "#fff", borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,.5)" }} />
                  </div>
                  <span style={{ flex: 1, color: "#fff", fontSize: 10, fontWeight: 700, padding: "0 12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "center", pointerEvents: "none" }}>{selectedEl.text}</span>
                  {/* Handle destro */}
                  <div onMouseDown={(e) => { e.stopPropagation(); startTimelineDrag("right", e.clientX); }}
                    onTouchStart={(e) => { e.stopPropagation(); startTimelineDrag("right", e.touches[0].clientX); }}
                    style={{ position: "absolute", right: -8, top: -2, width: 16, height: 36, cursor: "ew-resize", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 4, height: 22, background: "#fff", borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,.5)" }} />
                  </div>
                </div>
              );
            })()}

            {/* Playhead */}
            {videoDurationMs > 0 && (
              <div style={{ position: "absolute", left: `${playPct}%`, top: 0, bottom: 0, width: 2, background: "#fff", boxShadow: "0 0 4px rgba(0,0,0,.6)", pointerEvents: "none", zIndex: 10 }} />
            )}
          </div>

          <div style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,.3)", textAlign: "center" }}>
            Doppio tap sul testo per modificarlo · Trascina sul video per spostarlo · Trascina i bordi del blocco per la durata
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditPost() {
  const router = useRouter();
  const params = useParams();
  const postId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [caption, setCaption] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [visibility, setVisibility] = useState<"public" | "friends" | "private">("public");
  const [postType, setPostType] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [showMusic, setShowMusic] = useState(false);
  const [musicTab, setMusicTab] = useState<"library" | "original">("library");
  const [selectedTrack, setSelectedTrack] = useState<{ id: string; title: string; artist: string; url?: string } | null>(null);
  const [uploadedAudio, setUploadedAudio] = useState<File | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [trackProgress, setTrackProgress] = useState<Record<string, number>>({});

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current || !postId) return;
    loadedRef.current = true;

    async function loadPost() {
      const supabase = createClient();
      const { data, error } = await supabase.from("posts").select("*").eq("id", postId).single();
      if (error || !data) { window.location.href = "/profile"; return; }
      setCaption(data.caption || "");
      setLinkUrl(data.link_url || "");
      setVisibility(data.visibility || "public");
      setPostType(data.type || "text");
      setMediaUrl(data.media_url || "");
      if (data.overlay_data && Array.isArray(data.overlay_data) && data.overlay_data.length > 0) {
        setTextElements(data.overlay_data);
      }
      if (data.music_title) {
        setSelectedTrack({ id: "existing", title: data.music_title, artist: data.music_artist || "", url: data.music_url || undefined });
      }
      setLoading(false);
    }
    loadPost();

    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [postId]);

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
    setTrackProgress(p => ({ ...p, [track.id]: 0 }));
    progressInterval.current = setInterval(() => {
      if (audio.duration) setTrackProgress(p => ({ ...p, [track.id]: (audio.currentTime / audio.duration) * 100 }));
    }, 200);
    audio.onended = () => { setPlayingId(null); if (progressInterval.current) clearInterval(progressInterval.current); };
  }

  function selectTrack(track: typeof libraryTracks[0]) {
    stopPreview();
    setSelectedTrack(track);
    setUploadedAudio(null);
    setShowMusic(false);
  }

  function handleAudioUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedAudio(file);
    setSelectedTrack({ id: "original", title: file.name.replace(/\.[^.]+$/, ""), artist: "Il mio audio" });
    setShowMusic(false);
    stopPreview();
  }

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    stopPreview();

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login"; return; }

    let musicUrl = selectedTrack?.url || null;
    let musicTitle = selectedTrack?.title || null;
    let musicArtist = selectedTrack?.artist || null;

    if (uploadedAudio) {
      const ext = uploadedAudio.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error, data } = await supabase.storage.from("audio").upload(path, uploadedAudio, { upsert: true });
      if (!error && data) {
        const { data: urlData } = supabase.storage.from("audio").getPublicUrl(path);
        musicUrl = urlData.publicUrl;
        musicTitle = uploadedAudio.name.replace(/\.[^.]+$/, "");
        musicArtist = "Il mio audio";
      }
    }

    const updateObj: Record<string, any> = {
      caption, link_url: linkUrl || null, visibility,
      music_title: musicTitle, music_artist: musicArtist, music_url: musicUrl,
    };

    if (textElements.length > 0) {
      updateObj.overlay_text = textElements[0].text;
      updateObj.overlay_position = "custom";
      updateObj.overlay_data = textElements;
    } else {
      updateObj.overlay_text = null;
      updateObj.overlay_position = "bottom";
      updateObj.overlay_data = null;
    }

    const { error } = await supabase.from("posts").update(updateObj).eq("id", postId).select().single();

    if (error) { setSaveError(`Errore: ${error.message}`); setSaving(false); return; }

    setSaving(false);
    setSaved(true);
    setTimeout(() => { window.location.href = "/profile"; }, 1500);
  }

  if (showTextEditor) {
    return (
      <TextOverlayEditor
        mediaPreview={mediaUrl || null}
        mediaType={postType === "video" ? "video" : postType === "photo" ? "photo" : "text"}
        elements={textElements}
        setElements={setTextElements}
        onClose={() => setShowTextEditor(false)}
      />
    );
  }

  if (saved) {
    return (
      <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: "#000" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(29,158,117,.15)", border: "2px solid rgba(29,158,117,.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#4dffb8" strokeWidth="2.5"><path d="M5 14l6 6L23 8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <p style={{ color: "#fff", fontWeight: 900, fontSize: 20 }}>Modifiche salvate! ⚡</p>
        <p style={{ color: "rgba(255,255,255,.4)", fontSize: 13 }}>Aggiornato su feed e profilo</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#FF4D4D", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none"><polygon points="10,1 6,8 9,8 5,15 13,6 9,6" fill="white" /></svg>
          </div>
          <p style={{ color: "rgba(255,255,255,.4)", fontSize: 13 }}>Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: "linear-gradient(135deg, #0d0000 0%, #000 60%)" }}>
      <style>{`body { margin: 0; }`}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "48px 20px 16px", flexShrink: 0 }}>
        <button onClick={() => window.location.href = "/profile"}
          style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,.08)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="1.5"><path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <span style={{ color: "#fff", fontWeight: 900, fontSize: 16 }}>✏️ Modifica post</span>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 100px" }}>

        {mediaUrl && (
          <div style={{ marginBottom: 20, borderRadius: 16, overflow: "hidden", height: 220, position: "relative", background: "#000" }}>
            {postType === "video"
              ? <video src={mediaUrl} style={{ width: "100%", height: "100%", objectFit: "contain" }} muted />
              : <img src={mediaUrl} style={{ width: "100%", height: "100%", objectFit: "contain" }} />}
            {textElements.map(el => {
              const fontObj = FONTS.find(f => f.id === el.font);
              return (
                <div key={el.id} style={{ position: "absolute", left: `${el.x}%`, top: `${el.y}%`, padding: el.bg ? "3px 7px" : 0, background: el.bg ? "rgba(0,0,0,.6)" : "transparent", borderRadius: 5, pointerEvents: "none" }}>
                  <span style={{ color: el.color, fontFamily: fontObj?.family, fontSize: el.size * 0.65, fontWeight: el.bold ? 700 : 400, fontStyle: el.italic ? "italic" : "normal", whiteSpace: "nowrap" }}>
                    {el.text}
                  </span>
                </div>
              );
            })}
            <button onClick={() => setShowTextEditor(true)}
              style={{ position: "absolute", top: 10, right: 10, padding: "6px 12px", borderRadius: 8, background: "rgba(0,0,0,.7)", border: "1px solid rgba(255,255,255,.3)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              Aa {textElements.length > 0 ? `(${textElements.length})` : ""}
            </button>
          </div>
        )}

        {!mediaUrl && (
          <button onClick={() => setShowTextEditor(true)}
            style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "14px 16px", borderRadius: 16, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)", cursor: "pointer", marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: textElements.length > 0 ? "rgba(255,77,77,.2)" : "rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: textElements.length > 0 ? "#FF4D4D" : "rgba(255,255,255,.6)", fontWeight: 900, fontSize: 16 }}>Aa</span>
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ color: textElements.length > 0 ? "#FF4D4D" : "#fff", fontWeight: 700, fontSize: 13 }}>
                {textElements.length > 0 ? `${textElements.length} elemento/i testo` : "Aggiungi testo sovrapposto"}
              </div>
              <div style={{ color: "rgba(255,255,255,.3)", fontSize: 11, marginTop: 2 }}>Font, colore, posizione, durata</div>
            </div>
          </button>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ color: "rgba(255,255,255,.3)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".4px", display: "block", marginBottom: 8 }}>Descrizione</label>
          <textarea value={caption} onChange={e => setCaption(e.target.value.slice(0, 300))} rows={4}
            style={{ width: "100%", borderRadius: 16, padding: "12px 16px", color: "#fff", fontSize: 13, outline: "none", resize: "none", background: "#1a1a1a", border: "1px solid rgba(255,255,255,.08)", boxSizing: "border-box" }} />
          <div style={{ textAlign: "right", fontSize: 10, color: "rgba(255,255,255,.2)", marginTop: 4 }}>{caption.length}/300</div>
        </div>

        <div style={{ marginBottom: 16, borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,.08)" }}>
          <button onClick={() => setShowMusic(!showMusic)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "rgba(255,255,255,.04)", border: "none", cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: selectedTrack ? "rgba(255,77,77,.2)" : "rgba(255,77,77,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#FF4D4D" strokeWidth="1.5">
                  <circle cx="4" cy="12" r="2" /><circle cx="12" cy="10" r="2" /><path d="M6 12V4l8-2v8" strokeLinecap="round" />
                </svg>
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{selectedTrack ? selectedTrack.title : "Cambia musica"}</div>
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
                <div style={{ maxHeight: 260, overflowY: "auto" }}>
                  {libraryTracks.map((track) => {
                    const isPlaying = playingId === track.id;
                    const isSelected = selectedTrack?.id === track.id;
                    const prog = trackProgress[track.id] || 0;
                    return (
                      <div key={track.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "0.5px solid rgba(255,255,255,.05)", background: isSelected ? "rgba(255,77,77,.06)" : "transparent" }}>
                        <button onClick={() => togglePreview(track)}
                          style={{ width: 40, height: 40, borderRadius: "50%", background: isPlaying ? "#FF4D4D" : "rgba(255,255,255,.08)", border: isPlaying ? "none" : "1px solid rgba(255,255,255,.1)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {isPlaying
                            ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="2" width="4" height="10" rx="1" fill="#fff" /><rect x="8" y="2" width="4" height="10" rx="1" fill="#fff" /></svg>
                            : <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 2l8 5-8 5V2z" fill="rgba(255,255,255,.7)" /></svg>}
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
                  <label htmlFor="audio-upload-edit" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 16, border: "1.5px dashed rgba(255,255,255,.12)", background: uploadedAudio ? "rgba(255,77,77,.06)" : "transparent", padding: "28px 16px", cursor: "pointer" }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,77,77,.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                      <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="#FF4D4D" strokeWidth="1.5">
                        <circle cx="5" cy="15" r="2.5" /><circle cx="14" cy="13" r="2.5" /><path d="M7.5 15V7l9-2v8" strokeLinecap="round" />
                      </svg>
                    </div>
                    {uploadedAudio
                      ? <><p style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{uploadedAudio.name}</p><p style={{ color: "rgba(29,158,117,.8)", fontSize: 11, marginTop: 4 }}>✓ Caricato</p></>
                      : <><p style={{ color: "#fff", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Carica audio</p><p style={{ color: "rgba(255,255,255,.3)", fontSize: 11 }}>MP3, WAV · max 50MB</p></>}
                  </label>
                  <input id="audio-upload-edit" ref={audioInputRef} type="file" accept="audio/*" style={{ display: "none" }} onChange={handleAudioUpload} />
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ marginBottom: 16, borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,.08)" }}>
          <div style={{ padding: "10px 16px", background: "rgba(255,255,255,.04)" }}>
            <span style={{ color: "rgba(255,255,255,.4)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".4px" }}>Visibilità</span>
          </div>
          {[
            { val: "public", label: "Tutti", desc: "Visibile a chiunque nel feed", icon: "🌍" },
            { val: "friends", label: "Amici", desc: "Solo chi ti segue", icon: "👥" },
            { val: "private", label: "Solo io", desc: "Visibile solo a te", icon: "🔒" },
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

        <div style={{ marginBottom: 24, borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,77,77,.2)" }}>
          <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,77,77,.07)" }}>
            <span style={{ color: "#FF4D4D", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".4px" }}>Link affiliato</span>
            <span style={{ color: "rgba(255,255,255,.3)", fontSize: 11 }}>opzionale</span>
          </div>
          <div style={{ padding: "12px 16px" }}>
            <input type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://amazon.it/prodotto..."
              style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "#FF4D4D", fontSize: 13 }} />
          </div>
        </div>

        {saveError && (
          <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 12, background: "rgba(255,50,50,.1)", border: "1px solid rgba(255,50,50,.3)", color: "#FF4D4D", fontSize: 13 }}>
            {saveError}
          </div>
        )}

        <button onClick={handleSave} disabled={saving}
          style={{ width: "100%", padding: "16px 0", borderRadius: 16, fontWeight: 900, fontSize: 15, color: "#fff", border: "none", cursor: saving ? "not-allowed" : "pointer", background: saving ? "#993333" : "#FF4D4D" }}>
          {saving ? "Salvataggio..." : "Salva modifiche ⚡"}
        </button>
      </div>
    </div>
  );
}
