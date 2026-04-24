"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const categories = ["Musica", "Fotografia", "Abbigliamento", "Produttività", "Formazione", "Arte", "Tech", "Altro"];

export default function Sell() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState<"digital" | "physical">("digital");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [digitalFile, setDigitalFile] = useState<File | null>(null);
  const [stock, setStock] = useState("1");
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!name || !price || !category) { setError("Compila nome, prezzo e categoria"); return; }
    if (type === "digital" && !digitalFile) { setError("Carica il file digitale"); return; }
    setSaving(true); setError(""); setProgress(10);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    let imageUrl = "";
    let digitalUrl = "";

    // Upload immagine copertina
    if (imageFile) {
      setProgress(25);
      const ext = imageFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: imgErr } = await supabase.storage.from("images").upload(path, imageFile, { upsert: true });
      if (!imgErr) {
        const { data } = supabase.storage.from("images").getPublicUrl(path);
        imageUrl = data.publicUrl;
      }
    }

    // Upload file digitale
    if (type === "digital" && digitalFile) {
      setProgress(55);
      const ext = digitalFile.name.split(".").pop();
      const path = `${user.id}/products/${Date.now()}.${ext}`;
      const { error: digErr } = await supabase.storage.from("audio").upload(path, digitalFile, { upsert: true });
      if (!digErr) {
        const { data } = supabase.storage.from("audio").getPublicUrl(path);
        digitalUrl = data.publicUrl;
      }
    }

    setProgress(80);

    const { error: insertErr } = await supabase.from("products").insert({
      seller_id: user.id,
      name,
      description,
      price: parseFloat(price),
      category,
      type,
      images: imageUrl ? [imageUrl] : [],
      digital_url: digitalUrl || null,
      stock: type === "physical" ? parseInt(stock) : 999,
      active: true,
    });

    if (insertErr) { setError(insertErr.message); setSaving(false); return; }

    setProgress(100);
    setDone(true);
    setTimeout(() => router.push("/store"), 1500);
  }

  if (done) return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: "#000" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(29,158,117,.15)", border: "2px solid rgba(29,158,117,.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#4dffb8" strokeWidth="2.5">
          <path d="M5 14l6 6L23 8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p style={{ color: "#fff", fontWeight: 900, fontSize: 20 }}>Prodotto pubblicato! ⚡</p>
      <p style={{ color: "rgba(255,255,255,.4)", fontSize: 13 }}>Torno allo store...</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0d0000 0%, #000 60%)" }}>
      <style>{`body { margin: 0; }`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "48px 20px 20px", borderBottom: "0.5px solid rgba(255,255,255,.08)" }}>
        <button onClick={() => router.back()} style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,.08)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="1.5">
            <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "#FF4D4D", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><polygon points="10,1 6,8 9,8 5,15 13,6 9,6" fill="white" /></svg>
          </div>
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 20, letterSpacing: -0.5 }}>Zap<span style={{ color: "#FF4D4D" }}>Store</span></span>
        </div>
        <span style={{ color: "rgba(255,255,255,.5)", fontSize: 14, marginLeft: 4 }}>— Nuovo prodotto</span>
      </div>

      {saving && progress > 0 && (
        <div style={{ height: 3, background: "rgba(255,255,255,.1)" }}>
          <div style={{ height: "100%", background: "#FF4D4D", width: `${progress}%`, transition: "width .3s" }} />
        </div>
      )}

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 20px 80px" }}>

        {/* Tipo prodotto */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ color: "rgba(255,255,255,.4)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".4px", display: "block", marginBottom: 10 }}>Tipo di prodotto</label>
          <div style={{ display: "flex", gap: 10 }}>
            {(["digital", "physical"] as const).map((t) => (
              <button key={t} onClick={() => setType(t)} style={{ flex: 1, padding: "14px 0", borderRadius: 14, border: type === t ? "2px solid #FF4D4D" : "1.5px solid rgba(255,255,255,.1)", background: type === t ? "rgba(255,77,77,.1)" : "rgba(255,255,255,.04)", cursor: "pointer" }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{t === "digital" ? "💾" : "📦"}</div>
                <div style={{ color: type === t ? "#FF4D4D" : "rgba(255,255,255,.6)", fontWeight: 700, fontSize: 13 }}>
                  {t === "digital" ? "Digitale" : "Fisico"}
                </div>
                <div style={{ color: "rgba(255,255,255,.3)", fontSize: 11, marginTop: 3 }}>
                  {t === "digital" ? "File, audio, template..." : "Oggetti, abbigliamento..."}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Immagine copertina */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ color: "rgba(255,255,255,.4)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".4px", display: "block", marginBottom: 10 }}>Immagine copertina</label>
          {imagePreview ? (
            <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", height: 180 }}>
              <img src={imagePreview} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button onClick={() => { setImageFile(null); setImagePreview(null); }} style={{ position: "absolute", top: 10, right: 10, width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,.6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="1.5">
                  <path d="M2 2l8 8M10 2l-8 8" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ) : (
            <label htmlFor="img-upload" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 140, borderRadius: 16, border: "1.5px dashed rgba(255,255,255,.15)", background: "rgba(255,255,255,.03)", cursor: "pointer", gap: 8 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF4D4D" strokeWidth="1.5">
                <rect x="2" y="2" width="20" height="20" rx="3" />
                <circle cx="8" cy="8" r="2" />
                <path d="M2 17l6-5 4 4 3-3 7 7" />
              </svg>
              <span style={{ color: "rgba(255,255,255,.4)", fontSize: 13 }}>Carica immagine</span>
              <span style={{ color: "rgba(255,255,255,.2)", fontSize: 11 }}>JPG, PNG · max 10MB</span>
            </label>
          )}
          <input id="img-upload" type="file" accept="image/*" style={{ display: "none" }} onChange={handleImage} />
        </div>

        {/* Nome */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ color: "rgba(255,255,255,.4)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".4px", display: "block", marginBottom: 8 }}>Nome prodotto *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Es. Sample Pack Vol. 1"
            style={{ width: "100%", padding: "12px 16px", borderRadius: 14, background: "#1a1a1a", border: "1px solid rgba(255,255,255,.08)", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
        </div>

        {/* Descrizione */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ color: "rgba(255,255,255,.4)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".4px", display: "block", marginBottom: 8 }}>Descrizione</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrivi il tuo prodotto..." rows={4}
            style={{ width: "100%", padding: "12px 16px", borderRadius: 14, background: "#1a1a1a", border: "1px solid rgba(255,255,255,.08)", color: "#fff", fontSize: 14, outline: "none", resize: "none", boxSizing: "border-box" }} />
        </div>

        {/* Prezzo + Categoria */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: "rgba(255,255,255,.4)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".4px", display: "block", marginBottom: 8 }}>Prezzo (€) *</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="9.99" min="0" step="0.01"
              style={{ width: "100%", padding: "12px 16px", borderRadius: 14, background: "#1a1a1a", border: "1px solid rgba(255,255,255,.08)", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ color: "rgba(255,255,255,.4)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".4px", display: "block", marginBottom: 8 }}>Categoria *</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              style={{ width: "100%", padding: "12px 16px", borderRadius: 14, background: "#1a1a1a", border: "1px solid rgba(255,255,255,.08)", color: category ? "#fff" : "rgba(255,255,255,.3)", fontSize: 14, outline: "none", boxSizing: "border-box" }}>
              <option value="">Scegli...</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Stock — solo fisici */}
        {type === "physical" && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: "rgba(255,255,255,.4)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".4px", display: "block", marginBottom: 8 }}>Quantità in magazzino</label>
            <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} min="1"
              style={{ width: "100%", padding: "12px 16px", borderRadius: 14, background: "#1a1a1a", border: "1px solid rgba(255,255,255,.08)", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
        )}

        {/* File digitale */}
        {type === "digital" && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: "rgba(255,255,255,.4)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".4px", display: "block", marginBottom: 8 }}>File digitale *</label>
            <label htmlFor="digital-upload" style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14, border: digitalFile ? "1.5px solid rgba(29,158,117,.4)" : "1.5px dashed rgba(255,255,255,.15)", background: digitalFile ? "rgba(29,158,117,.06)" : "rgba(255,255,255,.03)", cursor: "pointer" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: digitalFile ? "rgba(29,158,117,.15)" : "rgba(255,77,77,.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke={digitalFile ? "#4dffb8" : "#FF4D4D"} strokeWidth="1.5">
                  <path d="M4 14v2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2" strokeLinecap="round" />
                  <path d="M10 3v10M6 7l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <div style={{ color: digitalFile ? "#4dffb8" : "#fff", fontWeight: 600, fontSize: 13 }}>
                  {digitalFile ? digitalFile.name : "Carica il tuo file"}
                </div>
                <div style={{ color: "rgba(255,255,255,.3)", fontSize: 11, marginTop: 2 }}>
                  {digitalFile ? `${(digitalFile.size / 1024 / 1024).toFixed(1)} MB` : "ZIP, PDF, MP3, WAV · max 100MB"}
                </div>
              </div>
            </label>
            <input id="digital-upload" type="file" style={{ display: "none" }} onChange={(e) => setDigitalFile(e.target.files?.[0] || null)} />
          </div>
        )}

        {/* Info commissione */}
        <div style={{ marginBottom: 24, padding: "12px 16px", borderRadius: 14, background: "rgba(255,77,77,.07)", border: "1px solid rgba(255,77,77,.15)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "rgba(255,255,255,.5)", fontSize: 13 }}>Prezzo di vendita</span>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>€{price ? parseFloat(price).toFixed(2) : "0.00"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
            <span style={{ color: "rgba(255,255,255,.5)", fontSize: 13 }}>Commissione ZipZap (5%)</span>
            <span style={{ color: "rgba(255,77,77,.7)", fontSize: 14 }}>-€{price ? (parseFloat(price) * 0.05).toFixed(2) : "0.00"}</span>
          </div>
          <div style={{ height: "0.5px", background: "rgba(255,255,255,.08)", margin: "10px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "rgba(255,255,255,.7)", fontSize: 13, fontWeight: 600 }}>Guadagno netto</span>
            <span style={{ color: "#4dffb8", fontWeight: 900, fontSize: 16 }}>€{price ? (parseFloat(price) * 0.95).toFixed(2) : "0.00"}</span>
          </div>
        </div>

        {error && <p style={{ color: "#FF4D4D", fontSize: 13, marginBottom: 16, textAlign: "center" }}>{error}</p>}

        <button onClick={handleSave} disabled={saving}
          style={{ width: "100%", padding: "16px 0", borderRadius: 16, fontWeight: 900, fontSize: 15, color: "#fff", border: "none", cursor: saving ? "not-allowed" : "pointer", background: saving ? "#993333" : "#FF4D4D" }}>
          {saving ? `Pubblicazione... ${progress}%` : "Pubblica prodotto ⚡"}
        </button>
      </div>
    </div>
  );
}