"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const categories = [
  { id: "musica", label: "Musica", emoji: "🎵" },
  { id: "tech", label: "Tech", emoji: "💻" },
  { id: "moda", label: "Moda", emoji: "👗" },
  { id: "fotografia", label: "Fotografia", emoji: "📷" },
  { id: "cucina", label: "Cucina", emoji: "🍳" },
  { id: "sport", label: "Sport", emoji: "⚽" },
  { id: "arte", label: "Arte", emoji: "🎨" },
  { id: "viaggi", label: "Viaggi", emoji: "✈️" },
  { id: "gaming", label: "Gaming", emoji: "🎮" },
  { id: "formazione", label: "Formazione", emoji: "📚" },
  { id: "fitness", label: "Fitness", emoji: "💪" },
  { id: "altro", label: "Altro", emoji: "⚡" },
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleComplete() {
    if (!fullName || !username || !category) {
      setError("Compila tutti i campi obbligatori");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        username,
        bio,
        category,
        onboarding_complete: true,
      })
      .eq("id", user.id);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/feed");
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center px-6"
      style={{ background: "linear-gradient(135deg, #0d0000 0%, #000 60%)" }}>
      <div className="w-full flex flex-col gap-6" style={{ maxWidth: 420 }}>

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-xl"
            style={{ width: 40, height: 40, background: "#FF4D4D" }}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <polygon points="10,1 6,8 9,8 5,15 13,6 9,6" fill="white" />
            </svg>
          </div>
          <span className="text-2xl font-black text-white tracking-tight">
            Zip<span style={{ color: "#FF4D4D" }}>Zap</span>
          </span>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 rounded-full"
              style={{
                height: 4,
                background: s <= step ? "#FF4D4D" : "rgba(255,255,255,.1)",
                transition: "background .3s",
              }} />
          ))}
        </div>

        {/* Step 1 — Info base */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="text-2xl font-black text-white">Come ti chiami?</h1>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,.4)" }}>
                Questi dati appariranno sul tuo profilo
              </p>
            </div>

            {/* Avatar placeholder */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="rounded-full flex items-center justify-center font-black text-3xl cursor-pointer"
                  style={{
                    width: 90, height: 90,
                    background: "#1a1a1a",
                    border: "2px dashed rgba(255,255,255,.2)",
                    color: "rgba(255,255,255,.2)",
                  }}>
                  {fullName ? fullName[0].toUpperCase() : "+"}
                </div>
                <div className="absolute bottom-0 right-0 rounded-full flex items-center justify-center"
                  style={{ width: 28, height: 28, background: "#FF4D4D" }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                    stroke="#fff" strokeWidth="1.5">
                    <path d="M6 2v8M2 6h8" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <input type="text" placeholder="Nome completo *"
                value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-4 rounded-2xl text-white text-sm outline-none"
                style={{ background: "#1a1a1a", border: "1.5px solid rgba(255,255,255,.1)" }} />
              <input type="text" placeholder="Username * (es. vale.beats)"
                value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, "."))}
                className="w-full px-4 py-4 rounded-2xl text-white text-sm outline-none"
                style={{ background: "#1a1a1a", border: "1.5px solid rgba(255,255,255,.1)" }} />
            </div>

            <button onClick={() => {
              if (!fullName || !username) { setError("Nome e username sono obbligatori"); return; }
              setError(""); setStep(2);
            }}
              className="w-full py-4 rounded-2xl font-black text-white"
              style={{ background: "#FF4D4D" }}>
              Avanti →
            </button>
          </div>
        )}

        {/* Step 2 — Bio */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="text-2xl font-black text-white">Parlaci di te</h1>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,.4)" }}>
                La bio appare sul tuo profilo — facoltativa
              </p>
            </div>

            <textarea
              placeholder="Scrivi qualcosa di te... (es. Produco beat con qualsiasi cosa)"
              value={bio} onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full px-4 py-4 rounded-2xl text-white text-sm outline-none resize-none"
              style={{ background: "#1a1a1a", border: "1.5px solid rgba(255,255,255,.1)" }} />

            <div className="text-right text-xs" style={{ color: "rgba(255,255,255,.25)", marginTop: -16 }}>
              {bio.length}/150
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)}
                className="flex-1 py-4 rounded-2xl font-bold text-sm"
                style={{ border: "1px solid rgba(255,255,255,.15)", color: "rgba(255,255,255,.5)" }}>
                ← Indietro
              </button>
              <button onClick={() => { setError(""); setStep(3); }}
                className="flex-1 py-4 rounded-2xl font-black text-white"
                style={{ background: "#FF4D4D" }}>
                Avanti →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Categoria */}
        {step === 3 && (
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="text-2xl font-black text-white">Di cosa parli?</h1>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,.4)" }}>
                Scegli la categoria principale dei tuoi contenuti
              </p>
            </div>

            <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
              {categories.map((cat) => (
                <button key={cat.id} onClick={() => setCategory(cat.id)}
                  className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl"
                  style={{
                    background: category === cat.id ? "rgba(255,77,77,.15)" : "#1a1a1a",
                    border: category === cat.id ? "1.5px solid #FF4D4D" : "1.5px solid rgba(255,255,255,.07)",
                    transition: "all .2s",
                  }}>
                  <span style={{ fontSize: 20 }}>{cat.emoji}</span>
                  <span className="text-xs font-semibold"
                    style={{ color: category === cat.id ? "#FF4D4D" : "rgba(255,255,255,.5)" }}>
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>

            {error && <p className="text-sm" style={{ color: "#FF4D4D" }}>{error}</p>}

            <div className="flex gap-3">
              <button onClick={() => setStep(2)}
                className="flex-1 py-4 rounded-2xl font-bold text-sm"
                style={{ border: "1px solid rgba(255,255,255,.15)", color: "rgba(255,255,255,.5)" }}>
                ← Indietro
              </button>
              <button onClick={handleComplete} disabled={loading || !category}
                className="flex-1 py-4 rounded-2xl font-black text-white"
                style={{ background: !category ? "#333" : "#FF4D4D" }}>
                {loading ? "Salvataggio..." : "Entra su ZipZap ⚡"}
              </button>
            </div>
          </div>
        )}

        {error && step !== 3 && (
          <p className="text-sm" style={{ color: "#FF4D4D" }}>{error}</p>
        )}

      </div>
    </div>
  );
}