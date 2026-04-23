import Link from "next/link";

export default function Home() {
  return (
    <div className="fixed inset-0 flex flex-col md:flex-row"
      style={{ background: "linear-gradient(135deg, #0d0000 0%, #000 60%)" }}>

      {/* Left — branding */}
      <div className="flex-1 flex flex-col justify-center px-10 md:px-20 py-12 gap-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-2xl"
            style={{ width: 52, height: 52, background: "#FF4D4D" }}>
            <svg width="24" height="24" viewBox="0 0 16 16" fill="none">
              <polygon points="10,1 6,8 9,8 5,15 13,6 9,6" fill="white" />
            </svg>
          </div>
          <span className="font-black text-white tracking-tight" style={{ fontSize: 40 }}>
            Zip<span style={{ color: "#FF4D4D" }}>Zap</span>
          </span>
        </div>

        <div>
          <h1 className="font-black text-white leading-tight" style={{ fontSize: 48 }}>
            Il social<br />senza limiti
          </h1>
          <p className="mt-4 text-lg" style={{ color: "rgba(255,255,255,.5)", lineHeight: 1.7, maxWidth: 420 }}>
            Pubblica quello che vuoi. Vendi i tuoi prodotti. Guadagna con i tuoi contenuti. Senza restrizioni, senza soglie di follower.
          </p>
        </div>

        <div className="flex flex-col gap-3" style={{ maxWidth: 320 }}>
          {["Link aperti nel browser nativo", "Zap Store — vendi prodotti fisici e digitali", "Guadagni automatici via Stripe", "0 follower minimi per monetizzare"].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <div className="rounded-full flex-shrink-0" style={{ width: 7, height: 7, background: "#FF4D4D" }} />
              <span className="text-sm" style={{ color: "rgba(255,255,255,.6)" }}>{item}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Link href="/register"
            className="px-8 py-4 rounded-2xl font-black text-white text-base"
            style={{ background: "#FF4D4D" }}>
            Inizia gratis
          </Link>
          <Link href="/login"
            className="px-8 py-4 rounded-2xl font-bold text-base"
            style={{ border: "1.5px solid rgba(255,255,255,.2)", color: "rgba(255,255,255,.7)" }}>
            Accedi
          </Link>
        </div>

        <p className="text-xs" style={{ color: "rgba(255,255,255,.2)" }}>
          Gratis per sempre · Commissione solo sulle vendite
        </p>
      </div>

      {/* Right — preview */}
      <div className="hidden md:flex flex-col items-center justify-center px-16 gap-4"
        style={{ width: 400, flexShrink: 0 }}>
        <div className="relative rounded-3xl overflow-hidden"
          style={{ width: 240, height: 420, border: "2px solid rgba(255,255,255,.1)", background: "#0a1525" }}>
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,.9) 0%, transparent 50%)" }} />
          <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="rounded-full border border-white flex items-center justify-center font-bold text-white"
                style={{ width: 32, height: 32, background: "#1a2a3a", fontSize: 11 }}>AS</div>
              <span className="font-bold text-white text-sm">astro.sky</span>
              <span className="text-xs rounded-full px-2 py-0.5 ml-1"
                style={{ border: "1px solid rgba(255,255,255,.5)", color: "#fff" }}>+ Segui</span>
            </div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,.8)" }}>
              Via Lattea dal Gran Sasso — 4 ore di esposizione, zero filtri
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,.35)" }}>#astronomia #fotografia</p>
          </div>
          <div className="absolute right-3 bottom-24 flex flex-col items-center gap-3">
            {["♡", "💬", "↗"].map((icon, i) => (
              <div key={i} className="rounded-full flex items-center justify-center"
                style={{ width: 36, height: 36, background: "rgba(255,255,255,.12)", fontSize: 14 }}>
                {icon}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-center" style={{ color: "rgba(255,255,255,.2)" }}>
          Feed fullscreen · TikTok-style
        </p>
      </div>
    </div>
  );
}