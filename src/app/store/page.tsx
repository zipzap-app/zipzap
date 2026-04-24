"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  type: string;
  images: string[];
  seller_id: string;
  sales?: number;
  profiles?: { username: string; full_name: string };
};

const categories = ["Tutti", "Musica", "Fotografia", "Abbigliamento", "Produttività", "Formazione", "Arte", "Tech", "Altro"];

export default function ZapStore() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Tutti");
  const [activeType, setActiveType] = useState("tutti");
  const [selected, setSelected] = useState<Product | null>(null);

  useEffect(() => {
    async function loadProducts() {
      const supabase = createClient();
      const { data } = await supabase
        .from("products")
        .select("*, profiles(username, full_name)")
        .eq("active", true)
        .order("created_at", { ascending: false });
      setProducts(data || []);
      setLoading(false);
    }
    loadProducts();
  }, []);

  const filtered = products.filter((p) => {
    const catMatch = activeCategory === "Tutti" || p.category === activeCategory;
    const typeMatch = activeType === "tutti" || p.type === activeType;
    return catMatch && typeMatch;
  });

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
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><polygon points="10,1 6,8 9,8 5,15 13,6 9,6" fill="white" /></svg>
          </div>
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 22, letterSpacing: -1 }}>Zip<span style={{ color: "#FF4D4D" }}>Zap</span></span>
        </div>
        {[
          { label: "Home", href: "/feed" },
          { label: "Esplora", href: "/explore" },
          { label: "Zap Store", href: "/store", active: true, isStore: true },
          { label: "Profilo", href: "/profile" },
        ].map((item) => (
          <a key={item.href} href={item.href} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12, background: item.active ? "rgba(255,77,77,.1)" : "transparent", textDecoration: "none", color: item.isStore ? "#FF4D4D" : "rgba(255,255,255,.8)", fontWeight: 600, fontSize: 14 }}>
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
          { href: "/store", label: "Store", isStore: true, active: true },
          { href: "/profile", label: "Profilo" },
        ].map((item) => (
          <a key={item.href} href={item.href} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textDecoration: "none" }}>
            {item.isCreate ? (
              <div style={{ width: 46, height: 32, borderRadius: 10, background: "#FF4D4D", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#fff" strokeWidth="2"><path d="M9 3v12M3 9h12" strokeLinecap="round" /></svg>
              </div>
            ) : item.isStore ? (
              <div style={{ display: "flex", alignItems: "center", gap: 4, background: item.active ? "#FF4D4D" : "rgba(255,77,77,.12)", border: item.active ? "none" : "1px solid rgba(255,77,77,.25)", borderRadius: 8, padding: "4px 8px" }}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><polygon points="10,1 6,8 9,8 5,15 13,6 9,6" fill="#fff" /></svg>
                <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>Store</span>
              </div>
            ) : (
              <>
                <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="1.6">
                  {item.href === "/feed" && <path d="M2.5 8.5l7.5-5.5 7.5 5.5v9H2.5z" />}
                  {item.href === "/explore" && <><circle cx="10" cy="10" r="6" /></>}
                  {item.href === "/profile" && <><circle cx="10" cy="7" r="3.5" /><path d="M3 18c0-3.5 3.1-6 7-6s7 2.5 7 6" /></>}
                </svg>
                <span style={{ fontSize: 9, fontWeight: 500, color: "rgba(255,255,255,.35)" }}>{item.label}</span>
              </>
            )}
          </a>
        ))}
      </div>

      <div className="zz-content" style={{ minHeight: "100vh", background: "#0a0a0a", paddingBottom: 100 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "32px 24px 20px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FF4D4D", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><polygon points="10,1 6,8 9,8 5,15 13,6 9,6" fill="white" /></svg>
              </div>
              <span style={{ color: "#fff", fontWeight: 900, fontSize: 24, letterSpacing: -0.5 }}>Zap<span style={{ color: "#FF4D4D" }}>Store</span></span>
            </div>
            <p style={{ color: "rgba(255,255,255,.35)", fontSize: 13, marginTop: 4 }}>Prodotti fisici e digitali dai creator</p>
          </div>
          <button onClick={() => router.push("/sell")}
            style={{ padding: "10px 20px", borderRadius: 12, background: "#FF4D4D", border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            + Vendi
          </button>
        </div>

        {/* Filtri tipo */}
        <div style={{ display: "flex", gap: 8, padding: "0 24px", marginBottom: 12 }}>
          {[["tutti", "Tutti"], ["digital", "Digitali"], ["physical", "Fisici"]].map(([val, label]) => (
            <button key={val} onClick={() => setActiveType(val)}
              style={{ padding: "8px 18px", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, background: activeType === val ? "#FF4D4D" : "rgba(255,255,255,.07)", color: activeType === val ? "#fff" : "rgba(255,255,255,.5)" }}>
              {label}
            </button>
          ))}
        </div>

        {/* Categorie */}
        <div style={{ display: "flex", gap: 8, padding: "0 24px", marginBottom: 24, overflowX: "auto", paddingBottom: 4 }}>
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              style={{ flexShrink: 0, padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", background: activeCategory === cat ? "rgba(255,77,77,.15)" : "transparent", color: activeCategory === cat ? "#FF4D4D" : "rgba(255,255,255,.4)", border: activeCategory === cat ? "1px solid rgba(255,77,77,.3)" : "1px solid rgba(255,255,255,.08)" }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
            <p style={{ color: "rgba(255,255,255,.3)", fontSize: 13 }}>Caricamento prodotti...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", gap: 12 }}>
            <div style={{ fontSize: 40, opacity: .2 }}>⚡</div>
            <p style={{ color: "rgba(255,255,255,.3)", fontSize: 13, textAlign: "center" }}>
              Nessun prodotto ancora.<br />
              <button onClick={() => router.push("/sell")} style={{ color: "#FF4D4D", background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Sii il primo a vendere ⚡</button>
            </p>
          </div>
        ) : (
          /* Grid prodotti */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, padding: "0 24px" }}>
            {filtered.map((product) => (
              <div key={product.id} onClick={() => setSelected(product)}
                style={{ borderRadius: 16, overflow: "hidden", cursor: "pointer", background: "#111", border: selected?.id === product.id ? "1.5px solid #FF4D4D" : "1.5px solid rgba(255,255,255,.07)", transition: "border-color .2s" }}>

                {/* Immagine */}
                <div style={{ position: "relative", height: 150, background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: 40, opacity: .15, color: "#fff", fontWeight: 900 }}>
                      {product.profiles?.username?.[0]?.toUpperCase() || "?"}
                    </span>
                  )}
                  <div style={{ position: "absolute", top: 8, left: 8, fontSize: 9, fontWeight: 700, borderRadius: 4, padding: "2px 7px", background: product.type === "digital" ? "rgba(29,158,117,.3)" : "rgba(255,150,0,.25)", color: product.type === "digital" ? "#4dffb8" : "#ffaa00" }}>
                    {product.type === "digital" ? "DIGITALE" : "FISICO"}
                  </div>
                </div>

                {/* Info */}
                <div style={{ padding: 12 }}>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.name}</div>
                  <div style={{ color: "rgba(255,255,255,.35)", fontSize: 11, marginBottom: 10 }}>
                    @{product.profiles?.username || "creator"}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ color: "#fff", fontWeight: 900, fontSize: 18 }}>€{product.price.toFixed(2)}</span>
                    <button style={{ padding: "6px 14px", borderRadius: 8, background: "#FF4D4D", border: "none", color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
                      Acquista
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Banner venditore */}
        <div style={{ margin: "32px 24px 0", borderRadius: 20, padding: "20px", background: "rgba(255,77,77,.07)", border: "1px solid rgba(255,77,77,.15)" }}>
          <div style={{ color: "#fff", fontWeight: 900, fontSize: 16, marginBottom: 6 }}>Sei un creator?</div>
          <div style={{ color: "rgba(255,255,255,.45)", fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
            Vendi i tuoi prodotti su ZipZap. Tieni il <strong style={{ color: "#4dffb8" }}>95%</strong> di ogni vendita.
          </div>
          <button onClick={() => router.push("/sell")} style={{ padding: "10px 20px", borderRadius: 12, background: "#FF4D4D", border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            Inizia a vendere ⚡
          </button>
        </div>
      </div>

      {/* Modal prodotto */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.85)", padding: 16 }}
          onClick={() => setSelected(null)}>
          <div style={{ width: "100%", maxWidth: 400, borderRadius: 24, overflow: "hidden", background: "#111", border: "1px solid rgba(255,255,255,.1)" }}
            onClick={e => e.stopPropagation()}>

            <div style={{ position: "relative", height: 220, background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {selected.images?.[0] ? (
                <img src={selected.images[0]} alt={selected.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 64, opacity: .1, color: "#fff", fontWeight: 900 }}>
                  {selected.profiles?.username?.[0]?.toUpperCase() || "?"}
                </span>
              )}
              <button onClick={() => setSelected(null)} style={{ position: "absolute", top: 12, right: 12, width: 30, height: 30, borderRadius: "50%", background: "rgba(0,0,0,.5)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="1.5">
                  <path d="M2 2l8 8M10 2l-8 8" strokeLinecap="round" />
                </svg>
              </button>
              <div style={{ position: "absolute", bottom: 12, left: 12, fontSize: 9, fontWeight: 700, borderRadius: 4, padding: "2px 7px", background: selected.type === "digital" ? "rgba(29,158,117,.3)" : "rgba(255,150,0,.25)", color: selected.type === "digital" ? "#4dffb8" : "#ffaa00" }}>
                {selected.type === "digital" ? "PRODOTTO DIGITALE" : "PRODOTTO FISICO"}
              </div>
            </div>

            <div style={{ padding: 20 }}>
              <div style={{ color: "#fff", fontWeight: 900, fontSize: 18, marginBottom: 4 }}>{selected.name}</div>
              <div style={{ color: "rgba(255,255,255,.4)", fontSize: 13, marginBottom: 12 }}>
                @{selected.profiles?.username || "creator"} · {selected.category}
              </div>

              {selected.description && (
                <div style={{ color: "rgba(255,255,255,.6)", fontSize: 13, lineHeight: 1.6, marginBottom: 16, padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,.05)" }}>
                  {selected.description}
                </div>
              )}

              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <div style={{ color: "#fff", fontWeight: 900, fontSize: 32 }}>€{selected.price.toFixed(2)}</div>
                  <div style={{ color: "rgba(255,255,255,.25)", fontSize: 11 }}>IVA inclusa</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "rgba(255,255,255,.3)", fontSize: 11 }}>Tipo</div>
                  <div style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>{selected.type === "digital" ? "Digitale" : "Fisico"}</div>
                </div>
              </div>

              <button style={{ width: "100%", padding: "14px 0", borderRadius: 16, background: "#FF4D4D", border: "none", color: "#fff", fontWeight: 900, fontSize: 15, cursor: "pointer" }}>
                Acquista — €{selected.price.toFixed(2)}
              </button>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10 }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="1.2">
                  <rect x="1" y="4" width="10" height="7" rx="1.5" />
                  <path d="M4 4V3a2 2 0 0 1 4 0v1" />
                </svg>
                <span style={{ color: "rgba(255,255,255,.2)", fontSize: 11 }}>Pagamento sicuro via Stripe</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}