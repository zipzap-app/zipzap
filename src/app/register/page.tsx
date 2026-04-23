"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { username } },
    });
    if (error) { setError(error.message); setLoading(false); }
    else router.push("/feed");
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center px-6"
      style={{ background: "linear-gradient(135deg, #0d0000 0%, #000 60%)" }}>
      <div className="w-full flex flex-col gap-6" style={{ maxWidth: 380 }}>

        <Link href="/" className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-xl"
            style={{ width: 40, height: 40, background: "#FF4D4D" }}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <polygon points="10,1 6,8 9,8 5,15 13,6 9,6" fill="white" />
            </svg>
          </div>
          <span className="text-2xl font-black text-white tracking-tight">
            Zip<span style={{ color: "#FF4D4D" }}>Zap</span>
          </span>
        </Link>

        <div>
          <h1 className="text-3xl font-black text-white">Crea account</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,.4)" }}>
            Inizia a creare, condividere e guadagnare
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <input type="text" placeholder="Username" value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-4 rounded-2xl text-white text-sm outline-none"
            style={{ background: "#1a1a1a", border: "1.5px solid rgba(255,255,255,.1)" }} />
          <input type="email" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-4 rounded-2xl text-white text-sm outline-none"
            style={{ background: "#1a1a1a", border: "1.5px solid rgba(255,255,255,.1)" }} />
          <input type="password" placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-4 rounded-2xl text-white text-sm outline-none"
            style={{ background: "#1a1a1a", border: "1.5px solid rgba(255,255,255,.1)" }} />
        </div>

        {error && <p className="text-sm" style={{ color: "#FF4D4D" }}>{error}</p>}

        <button onClick={handleRegister} disabled={loading}
          className="w-full py-4 rounded-2xl font-black text-white text-base"
          style={{ background: loading ? "#993333" : "#FF4D4D" }}>
          {loading ? "Registrazione..." : "Crea account"}
        </button>

        <p className="text-sm text-center" style={{ color: "rgba(255,255,255,.4)" }}>
          Hai già un account?{" "}
          <Link href="/login" style={{ color: "#FF4D4D" }}>Accedi</Link>
        </p>

        <p className="text-xs text-center" style={{ color: "rgba(255,255,255,.2)" }}>
          Registrandoti accetti i Termini di servizio di ZipZap
        </p>
      </div>
    </div>
  );
}