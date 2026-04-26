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
  mediaType: "video" | "photo";
  elements: TextElement[];
  setElements: (e: TextElement[]) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [videoDurationMs, setVideoDurationMs] = useState(0);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [centerSnap, setCenterSnap] = useState<{ x: boolean; y: boolean }>({ x: false, y: false });
  const canvasRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRef = useRef<HTMLVideoElement | HTMLImageElement | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; startX: number; startY: number; elemX: number; elemY: number } | null>(null);
  const tlDragRef = useRef<{ mode: "left" | "right" | "move"; startX: number; origStartMs: number; origEndMs: number; trackW: number } | null>(null);

  const isVideo = mediaType === "video";
  const selectedEl = elements.find(e => e.id === selected) || null;

  // Geometria: bounding del media (video/img) rispetto al canvas, in percentuali
  function getMediaBounds() {
    if (!mediaRef.current || !canvasRef.current) return null;
    const m = mediaRef.current.getBoundingClientRect();
    const c = canvasRef.current.getBoundingClientRect();
    if (m.width === 0 || m.height === 0 || c.width === 0) return null;
    return {
      leftPct: ((m.left - c.left) / c.width) * 100,
      topPct: ((m.top - c.top) / c.height) * 100,
      widthPct: (m.width / c.width) * 100,
      heightPct: (m.height / c.height) * 100,
      canvasW: c.width,
      canvasH: c.height,
    };
  }

  // Clampa una posizione (top-left in % del canvas) dentro l'area del media,
  // tenendo conto della dimensione effettiva del testo se passata.
  function clampToMedia(x: number, y: number, textPx?: { w: number; h: number }) {
    const b = getMediaBounds();
    if (!b) return { x, y };
    const tWpct = textPx ? (textPx.w / b.canvasW) * 100 : 0;
    const tHpct = textPx ? (textPx.h / b.canvasH) * 100 : 0;
    const minX = b.leftPct;
    const minY = b.topPct;
    const maxX = b.leftPct + b.widthPct - tWpct;
    const maxY = b.topPct + b.heightPct - tHpct;
    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y)),
    };
  }

  // Snap del centro del testo al centro del media, con tolleranza ±2%
  function snapToCenter(x: number, y: number, textPx: { w: number; h: number }) {
    const b = getMediaBounds();
    if (!b) return { x, y, snapX: false, snapY: false };
    const tol = 2;
    const tWpct = (textPx.w / b.canvasW) * 100;
    const tHpct = (textPx.h / b.canvasH) * 100;
    const tCenterX = x + tWpct / 2;
    const tCenterY = y + tHpct / 2;
    const mCenterX = b.leftPct + b.widthPct / 2;
    const mCenterY = b.topPct + b.heightPct / 2;
    let snapX = false, snapY = false;
    if (Math.abs(tCenterX - mCenterX) < tol) {
      x = mCenterX - tWpct / 2;
      snapX = true;
    }
    if (Math.abs(tCenterY - mCenterY) < tol) {
      y = mCenterY - tHpct / 2;
      snapY = true;
    }
    return { x, y, snapX, snapY };
  }

  function getTextPx(id: string) {
    const el = document.getElementById(`zz-text-${id}`);
    if (!el) return { w: 80, h: 30 };
    return { w: el.offsetWidth, h: el.offsetHeight };
  }

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
    // Default position: centro del media se misurabile, altrimenti 30/40 del canvas (fallback)
    const b = getMediaBounds();
    let defaultX = 30;
    let defaultY = 40;
    if (b) {
      defaultX = b.leftPct + b.widthPct / 2 - 5; // ~10% larghezza testo / 2
      defaultY = b.topPct + b.heightPct / 2 - 2;
    }
    const newEl: TextElement = {
      id: Date.now().toString(),
      text: "Testo",
      x: defaultX, y: defaultY,
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
    // Snap dentro al video se il testo è fuori (per post legacy)
    const textPx = getTextPx(id);
    const clamped = clampToMedia(el.x, el.y, textPx);
    if (clamped.x !== el.x || clamped.y !== el.y) {
      setElements(elements.map(e => e.id === id ? { ...e, x: clamped.x, y: clamped.y } : e));
      dragRef.current = { id, startX: clientX, startY: clientY, elemX: clamped.x, elemY: clamped.y };
    } else {
      dragRef.current = { id, startX: clientX, startY: clientY, elemX: el.x, elemY: el.y };
    }
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
      let newX = dragRef.current.elemX + dx;
      let newY = dragRef.current.elemY + dy;
      const id = dragRef.current.id;
      const textPx = getTextPx(id);
      // Snap al centro
      const snap = snapToCenter(newX, newY, textPx);
      newX = snap.x;
      newY = snap.y;
      setCenterSnap({ x: snap.snapX, y: snap.snapY });
      // Clamp dentro al video
      const clamped = clampToMedia(newX, newY, textPx);
      newX = clamped.x;
      newY = clamped.y;
      setElements(elements.map(el => el.id === id ? { ...el, x: newX, y: newY } : el));
    }
    function onUp() {
      dragRef.current = null;
      setCenterSnap({ x: false, y: false });
    }
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
      const minRange = 200; // minimo 0.2s
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

  // Visibilità di un elemento alla riproduzione
  function isVisibleAt(el: TextElement, timeMs: number) {
    if (!isVideo) return true;
    const start = el.startMs ?? 0;
    const end = el.endMs ?? videoDurationMs;
    return timeMs >= start && timeMs <= end;
  }
  function shouldRender(el: TextElement) {
    if (selected === el.id) return true;     // selezionato sempre visibile per modifica
    if (!isPlaying) return true;             // in pausa: mostra tutto
    return isVisibleAt(el, currentTimeMs);   // in play: solo se nel suo range
  }

  // Posizione toolbar: sopra al testo se y > 15, altrimenti sotto
  const toolbarFlipBelow = !!selectedEl && selectedEl.y < 15;

  // Player progress %
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

      {/* Canvas (area video + testi + toolbar fluttuante) */}
      <div ref={canvasRef} onClick={() => { setSelected(null); setEditing(false); }}
        style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>

        {/* Media di sfondo */}
        {mediaPreview ? (
          isVideo ? (
            <video
              ref={(el) => { videoRef.current = el; mediaRef.current = el; }}
              src={mediaPreview}
              style={{ height: "100%", width: "auto", maxWidth: "100%", objectFit: "contain" }}
              muted loop playsInline
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onPause={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
            />
          ) : (
            <img
              ref={(el) => { mediaRef.current = el; }}
              src={mediaPreview}
              style={{ height: "100%", width: "auto", maxWidth: "100%", objectFit: "contain" }}
              alt=""
            />
          )
        ) : (
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #1a0020, #0a0a2e)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "rgba(255,255,255,.2)", fontSize: 13 }}>Anteprima</span>
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
              id={`zz-text-${el.id}`}
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

        {/* Linee guida del centro (visibili solo durante lo snap) */}
        {(centerSnap.x || centerSnap.y) && (() => {
          const b = getMediaBounds();
          if (!b) return null;
          return (
            <>
              {centerSnap.x && (
                <div style={{
                  position: "absolute",
                  left: `${b.leftPct + b.widthPct / 2}%`,
                  top: `${b.topPct}%`,
                  height: `${b.heightPct}%`,
                  width: 0,
                  borderLeft: "1px dashed #FF4D4D",
                  pointerEvents: "none",
                  zIndex: 30,
                  boxShadow: "0 0 4px rgba(255,77,77,.6)",
                }} />
              )}
              {centerSnap.y && (
                <div style={{
                  position: "absolute",
                  top: `${b.topPct + b.heightPct / 2}%`,
                  left: `${b.leftPct}%`,
                  width: `${b.widthPct}%`,
                  height: 0,
                  borderTop: "1px dashed #FF4D4D",
                  pointerEvents: "none",
                  zIndex: 30,
                  boxShadow: "0 0 4px rgba(255,77,77,.6)",
                }} />
              )}
            </>
          );
        })()}

        {/* Bottone aggiungi testo */}
        <button onClick={(e) => { e.stopPropagation(); addText(); }}
          style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", padding: "10px 22px", borderRadius: 22, background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.3)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="2"><path d="M7 2v10M2 7h10" strokeLinecap="round" /></svg>
          Aggiungi testo
        </button>
      </div>

      {/* Hint sopra timeline */}
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
                  {/* Etichetta */}
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

            {/* Playhead (linea verticale posizione corrente) */}
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

export default function Create() {
  const router = useRouter();
  const [type, setType] = useState<"video" | "photo" | "text">("video");
  const [caption, setCaption] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [showTextEditor, setShowTextEditor] = useState(false);

  const [showMusic, setShowMusic] = useState(false);
  const [musicTab, setMusicTab] = useState<"library" | "original">("library");
  const [selectedTrack, setSelectedTrack] = useState<{ id: string; title: string; artist: string; url?: string } | null>(null);
  const [uploadedAudio, setUploadedAudio] = useState<File | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});

  const [visibility, setVisibility] = useState<"public" | "friends" | "private">("public");
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

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

    if (uploadedAudio) {
      setUploadProgress(65);
      const ext = uploadedAudio.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: audioError } = await supabase.storage.from("audio").upload(path, uploadedAudio, { upsert: true });
      if (!audioError) {
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
      overlay_text: textElements.length > 0 ? textElements[0].text : null,
      overlay_position: textElements.length > 0 ? "custom" : "bottom",
      overlay_data: textElements.length > 0 ? textElements : null,
    });

    if (error) { alert("Errore: " + error.message); setPublishing(false); setUploadProgress(0); return; }

    setUploadProgress(100);
    setPublishing(false);
    setPublished(true);
    setTimeout(() => router.push("/feed"), 1500);
  }

  if (showTextEditor) {
    const currentPreview = type === "video" ? mediaPreview : (photoPreviews[carouselIndex] || null);
    return (
      <TextOverlayEditor
        mediaPreview={currentPreview}
        mediaType={type === "video" ? "video" : "photo"}
        elements={textElements}
        setElements={setTextElements}
        onClose={() => setShowTextEditor(false)}
      />
    );
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
              <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", height: 220, background: "#000" }}>
                <video src={mediaPreview} style={{ width: "100%", height: "100%", objectFit: "contain" }} muted />
                {/* Preview elementi testo (statica, tutti visibili) */}
                {textElements.map(el => {
                  const fontObj = FONTS.find(f => f.id === el.font);
                  return (
                    <div key={el.id} style={{ position: "absolute", left: `${el.x}%`, top: `${el.y}%`, padding: el.bg ? "3px 6px" : 0, background: el.bg ? "rgba(0,0,0,.55)" : "transparent", borderRadius: 4 }}>
                      <span style={{ color: el.color, fontFamily: fontObj?.family, fontSize: el.size * 0.7, fontWeight: el.bold ? 700 : 400, fontStyle: el.italic ? "italic" : "normal", whiteSpace: "nowrap" }}>
                        {el.text}
                      </span>
                    </div>
                  );
                })}
                <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6 }}>
                  <button onClick={() => setShowTextEditor(true)}
                    style={{ padding: "5px 10px", borderRadius: 8, background: "rgba(0,0,0,.6)", border: "1px solid rgba(255,255,255,.3)", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                    Aa {textElements.length > 0 ? `(${textElements.length})` : ""}
                  </button>
                  <button onClick={() => { setMediaFile(null); setMediaPreview(null); setTextElements([]); }}
                    style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,.6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="1.5"><path d="M2 2l8 8M10 2l-8 8" strokeLinecap="round" /></svg>
                  </button>
                </div>
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
              <div>
                <div style={{ borderRadius: 16, overflow: "hidden", height: 280, position: "relative", background: "#000" }}>
                  <img src={photoPreviews[carouselIndex]} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />

                  {textElements.map(el => {
                    const fontObj = FONTS.find(f => f.id === el.font);
                    return (
                      <div key={el.id} style={{ position: "absolute", left: `${el.x}%`, top: `${el.y}%`, padding: el.bg ? "3px 6px" : 0, background: el.bg ? "rgba(0,0,0,.55)" : "transparent", borderRadius: 4 }}>
                        <span style={{ color: el.color, fontFamily: fontObj?.family, fontSize: el.size * 0.7, fontWeight: el.bold ? 700 : 400, fontStyle: el.italic ? "italic" : "normal", whiteSpace: "nowrap" }}>
                          {el.text}
                        </span>
                      </div>
                    );
                  })}

                  {photoPreviews.length > 1 && (
                    <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5 }}>
                      {photoPreviews.map((_, i) => (
                        <div key={i} onClick={() => setCarouselIndex(i)}
                          style={{ width: i === carouselIndex ? 18 : 6, height: 6, borderRadius: 3, background: i === carouselIndex ? "#fff" : "rgba(255,255,255,.4)", cursor: "pointer", transition: "all .2s" }} />
                      ))}
                    </div>
                  )}

                  {photoPreviews.length > 1 && carouselIndex > 0 && (
                    <button onClick={() => setCarouselIndex(c => c - 1)}
                      style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,.5)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="2"><path d="M9 2L4 7l5 5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                  )}
                  {photoPreviews.length > 1 && carouselIndex < photoPreviews.length - 1 && (
                    <button onClick={() => setCarouselIndex(c => c + 1)}
                      style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,.5)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="2"><path d="M5 2l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                  )}

                  <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6 }}>
                    <button onClick={() => setShowTextEditor(true)}
                      style={{ padding: "5px 10px", borderRadius: 8, background: "rgba(0,0,0,.6)", border: "1px solid rgba(255,255,255,.3)", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                      Aa {textElements.length > 0 ? `(${textElements.length})` : ""}
                    </button>
                    <button onClick={() => removePhoto(carouselIndex)}
                      style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,.6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="1.5"><path d="M2 2l8 8M10 2l-8 8" strokeLinecap="round" /></svg>
                    </button>
                  </div>

                  <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,.6)", borderRadius: 8, padding: "3px 8px", color: "#fff", fontSize: 11, fontWeight: 600 }}>
                    {carouselIndex + 1}/{photoPreviews.length}
                  </div>
                </div>

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

        {/* Testo post type — bottone editor */}
        {type === "text" && (
          <button onClick={() => setShowTextEditor(true)}
            style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "14px 16px", borderRadius: 16, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)", cursor: "pointer", marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: textElements.length > 0 ? "rgba(255,77,77,.2)" : "rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: textElements.length > 0 ? "#FF4D4D" : "rgba(255,255,255,.6)", fontWeight: 900, fontSize: 16 }}>Aa</span>
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ color: textElements.length > 0 ? "#FF4D4D" : "#fff", fontWeight: 700, fontSize: 13 }}>
                {textElements.length > 0 ? `${textElements.length} elemento/i aggiunti` : "Editor testo avanzato"}
              </div>
              <div style={{ color: "rgba(255,255,255,.3)", fontSize: 11, marginTop: 2 }}>Font, stile, colore, posizione, durata</div>
            </div>
          </button>
        )}

        {/* Descrizione */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ color: "rgba(255,255,255,.3)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".4px", display: "block", marginBottom: 8 }}>Descrizione</label>
          <textarea value={caption} onChange={(e) => setCaption(e.target.value.slice(0, 300))}
            placeholder="Descrivi il tuo contenuto..." rows={type === "text" ? 4 : 3}
            style={{ width: "100%", borderRadius: 16, padding: "12px 16px", color: "#fff", fontSize: 13, outline: "none", resize: "none", background: "#1a1a1a", border: "1px solid rgba(255,255,255,.08)", boxSizing: "border-box" }} />
          <div style={{ textAlign: "right", fontSize: 10, color: "rgba(255,255,255,.2)", marginTop: 4 }}>{caption.length}/300</div>
        </div>

        {/* Musica */}
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
