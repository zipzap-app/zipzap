"use client";
import { useState } from "react";
import Link from "next/link";

const products = [
  { id: 1, name: "Sample Pack Vol. 3", seller: "vale.beats", price: 24.99, type: "digital", category: "Musica", color: "#1a0020", initials: "VB", sales: 142 },
  { id: 2, name: "Preset Lightroom Estate", seller: "giada.fashion", price: 12.99, type: "digital", category: "Fotografia", color: "#1a0010", initials: "GF", sales: 89 },
  { id: 3, name: "Hoodie ZipZap Limited", seller: "mario.reviews", price: 49.99, type: "physical", category: "Abbigliamento", color: "#001a10", initials: "MR", sales: 34 },
  { id: 4, name: "Template Notion Creator", seller: "astro.sky", price: 9.99, type: "digital", category: "Produttività", color: "#001020", initials: "AS", sales: 210 },
  { id: 5, name: "Corso Fotografia iPhone", seller: "astro.sky", price: 34.99, type: "digital", category: "Formazione", color: "#0a0a1a", initials: "AS", sales: 67 },
  { id: 6, name: "Cap Ricamata Creator", seller: "vale.beats", price: 29.99, type: "physical", category: "Abbigliamento", color: "#1a0a00", initials: "VB", sales: 18 },
];

const categories = ["Tutti", "Musica", "Fotografia", "Abbigliamento", "Produttività", "Formazione"];

const NavLeft = ({ active }: { active: string }) => (
  <div className="hidden md:flex flex-col items-start gap-4 px-6 py-8 flex-shrink-0"
    style={{ width: 220, background: "rgba(0,0,0,.6)", borderRight: "0.5px solid rgba(255,255,255,.07)" }}>
    <Link href="/" className="flex items-center gap-2 mb-6">
      <div className="flex items-center justify-center rounded-xl"
        style={{ width: 32, height: 32, background: "#FF4D4D" }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <polygon points="10,1 6,8 9,8 5,15 13,6 9,6" fill="white" />
        </svg>
      </div>
      <span className="text-xl font-black text-white tracking-tight">
        Zip<span style={{ color: "#FF4D4D" }}>Zap</span>
      </span>
    </Link>
    {[
      { href: "/feed", label: "Home", icon: <path d="M2.5 8.5l7.5-5.5 7.5 5.5v9H2.5z" /> },
      { href: "/explore", label: "Esplora", icon: <><circle cx="10" cy="10" r="6" /></> },
      { href: "/store", label: "Zap Store", isStore: true },
      { href: "/profile", label: "Profilo", icon: <><circle cx="10" cy="7" r="3.5" /><path d="M3 18c0-3.5 3.1-6 7-6s7 2.5 7 6" /></> },
    ].map((item, i) => (
      <a key={i} href={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full"
        style={{ background: active === item.href ? "rgba(255,255,255,.1)" : "transparent" }}>
        {item.isStore ? (
          <div className="flex items-center justify-center rounded-lg"
            style={{ width: 24, height: 24, background: "#FF4D4D" }}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
              <polygon points="10,1 6,8 9,8 5,15 13,6 9,6" fill="white" />
            </svg>
          </div>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
            stroke="rgba(255,255,255,.7)" strokeWidth="1.6">{item.icon}</svg>
        )}
        <span className="text-sm font-semibold"
          style={{ color: item.isStore ? "#FF4D4D" : "rgba(255,255,255,.7)" }}>
          {item.label}
        </span>
      </a>
    ))}
  </div>
);

const NavMobile = ({ active }: { active: string }) => (
  <div className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around px-4 pb-6 pt-3 z-30"
    style={{ background: "rgba(0,0,0,.9)", borderTop: "0.5px solid rgba(255,255,255,.08)" }}>
    {[
      { href: "/feed", label: "Home", icon: <path d="M2.5 8.5l7.5-5.5 7.5 5.5v9H2.5z" /> },
      { href: "/explore", label: "Esplora", icon: <><circle cx="10" cy="10" r="6" /></> },
      { href: "/store", label: "Store", isStore: true },
      { href: "/profile", label: "Profilo", icon: <><circle cx="10" cy="7" r="3.5" /><path d="M3 18c0-3.5 3.1-6 7-6s7 2.5 7 6" /></> },
    ].map((item, i) => (
      <a key={i} href={item.href} className="flex flex-col items-center gap-1">
        {item.isStore ? (
          <div className="flex items-center justify-center rounded-lg px-2 py-1"
            style={{ background: "#FF4D4D" }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <polygon points="10,1 6,8 9,8 5,15 13,6 9,6" fill="white" />
            </svg>
            <span className="text-white font-black text-xs ml-1">Store</span>
          </div>
        ) : (
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none"
            stroke={active === item.href ? "#fff" : "rgba(255,255,255,.35)"}
            strokeWidth={active === item.href ? "1.8" : "1.6"}>
            {item.icon}
          </svg>
        )}
        {!item.isStore && (
          <span style={{ fontSize: 9, fontWeight: 500, color: active === item.href ? "#fff" : "rgba(255,255,255,.35)" }}>
            {item.label}
          </span>
        )}
      </a>
    ))}
  </div>
);

export default function ZapStore() {
  const [activeCategory, setActiveCategory] = useState("Tutti");
  const [activeType, setActiveType] = useState("tutti");
  const [selected, setSelected] = useState<number | null>(null);

  const filtered = products.filter((p) => {
    const catMatch = activeCategory === "Tutti" || p.category === activeCategory;
    const typeMatch = activeType === "tutti" || p.type === activeType;
    return catMatch && typeMatch;
  });

  const selectedProduct = products.find((p) => p.id === selected);

  return (
    <div className="fixed inset-0 flex" style={{ background: "#0a0a0a" }}>
      <NavLeft active="/store" />

      <div className="flex-1 overflow-y-auto pb-28 md:pb-8">

        {/* Header */}
        <div className="px-6 pt-8 pb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center rounded-xl"
                style={{ width: 36, height: 36, background: "#FF4D4D" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <polygon points="10,1 6,8 9,8 5,15 13,6 9,6" fill="white" />
                </svg>
              </div>
              <span className="text-2xl font-black text-white tracking-tight">
                Zap<span style={{ color: "#FF4D4D" }}>Store</span>
              </span>
            </div>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,.35)" }}>
              Prodotti fisici e digitali dai creator
            </p>
          </div>
          <button className="px-4 py-2.5 rounded-xl font-bold text-white text-sm"
            style={{ background: "#FF4D4D" }}>
            + Vendi
          </button>
        </div>

        {/* Filtri tipo */}
        <div className="flex gap-2 px-6 mb-4">
          {[["tutti", "Tutti"], ["digital", "Digitali"], ["physical", "Fisici"]].map(([val, label]) => (
            <button key={val} onClick={() => setActiveType(val)}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{
                background: activeType === val ? "#FF4D4D" : "rgba(255,255,255,.07)",
                color: activeType === val ? "#fff" : "rgba(255,255,255,.5)",
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Categorie */}
        <div className="flex gap-2 px-6 mb-6 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: activeCategory === cat ? "rgba(255,77,77,.15)" : "transparent",
                color: activeCategory === cat ? "#FF4D4D" : "rgba(255,255,255,.4)",
                border: activeCategory === cat ? "1px solid rgba(255,77,77,.3)" : "1px solid rgba(255,255,255,.08)",
              }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Grid prodotti */}
        <div className="grid gap-3 px-6"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
          {filtered.map((product) => (
            <div key={product.id} onClick={() => setSelected(product.id)}
              className="rounded-2xl overflow-hidden cursor-pointer"
              style={{
                background: "#111",
                border: selected === product.id
                  ? "1.5px solid #FF4D4D"
                  : "1.5px solid rgba(255,255,255,.07)",
                transition: "border-color .2s",
              }}>

              {/* Immagine */}
              <div className="relative flex items-center justify-center"
                style={{ height: 150, background: product.color }}>
                <div className="font-black" style={{ fontSize: 40, color: "rgba(255,255,255,.12)" }}>
                  {product.initials}
                </div>
                <div className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded"
                  style={{
                    background: product.type === "digital" ? "rgba(29,158,117,.25)" : "rgba(255,150,0,.2)",
                    color: product.type === "digital" ? "#4dffb8" : "#ffaa00",
                    fontSize: 9,
                  }}>
                  {product.type === "digital" ? "DIGITALE" : "FISICO"}
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <div className="font-bold text-white text-sm mb-1 truncate">{product.name}</div>
                <div className="flex items-center gap-1 mb-3">
                  <span className="text-xs" style={{ color: "rgba(255,255,255,.35)" }}>@{product.seller}</span>
                  <span className="text-xs ml-auto" style={{ color: "rgba(255,255,255,.2)" }}>{product.sales} vendite</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-black text-white" style={{ fontSize: 18 }}>
                    €{product.price.toFixed(2)}
                  </span>
                  <button className="px-3 py-1.5 rounded-lg text-white font-bold text-xs"
                    style={{ background: "#FF4D4D" }}>
                    Acquista
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="font-black text-4xl" style={{ color: "rgba(255,77,77,.2)" }}>⚡</div>
            <div className="text-sm" style={{ color: "rgba(255,255,255,.3)" }}>
              Nessun prodotto in questa categoria
            </div>
          </div>
        )}

        {/* Banner venditore */}
        <div className="mx-6 mt-8 rounded-2xl p-5"
          style={{ background: "rgba(255,77,77,.07)", border: "1px solid rgba(255,77,77,.15)" }}>
          <div className="font-black text-white text-base mb-1">Sei un venditore?</div>
          <div className="text-sm mb-4" style={{ color: "rgba(255,255,255,.4)", lineHeight: 1.6 }}>
            Vendi i tuoi prodotti su ZipZap. Tieni il 95% di ogni vendita — tu gestisci magazzino e spedizioni.
          </div>
          <button className="px-5 py-2.5 rounded-xl font-bold text-white text-sm"
            style={{ background: "#FF4D4D" }}>
            Inizia a vendere
          </button>
        </div>
      </div>

      {/* Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4"
          style={{ background: "rgba(0,0,0,.85)" }}
          onClick={() => setSelected(null)}>
          <div className="rounded-2xl overflow-hidden w-full"
            style={{ maxWidth: 400, background: "#111", border: "1px solid rgba(255,255,255,.1)" }}
            onClick={(e) => e.stopPropagation()}>

            <div className="flex items-center justify-center relative"
              style={{ height: 200, background: selectedProduct.color }}>
              <div className="font-black" style={{ fontSize: 64, color: "rgba(255,255,255,.1)" }}>
                {selectedProduct.initials}
              </div>
              <button onClick={() => setSelected(null)}
                className="absolute top-3 right-3 rounded-full flex items-center justify-center"
                style={{ width: 30, height: 30, background: "rgba(0,0,0,.5)" }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                  stroke="rgba(255,255,255,.7)" strokeWidth="1.5">
                  <path d="M2 2l8 8M10 2l-8 8" strokeLinecap="round" />
                </svg>
              </button>
              <div className="absolute bottom-3 left-3 text-xs font-bold px-2 py-0.5 rounded"
                style={{
                  background: selectedProduct.type === "digital" ? "rgba(29,158,117,.3)" : "rgba(255,150,0,.25)",
                  color: selectedProduct.type === "digital" ? "#4dffb8" : "#ffaa00",
                  fontSize: 9,
                }}>
                {selectedProduct.type === "digital" ? "PRODOTTO DIGITALE" : "PRODOTTO FISICO"}
              </div>
            </div>

            <div className="p-5">
              <div className="font-black text-white text-lg mb-1">{selectedProduct.name}</div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm" style={{ color: "rgba(255,255,255,.4)" }}>
                  @{selectedProduct.seller}
                </span>
                <span className="text-xs ml-auto" style={{ color: "rgba(255,255,255,.25)" }}>
                  {selectedProduct.sales} vendite
                </span>
              </div>

              <div className="rounded-xl p-3 mb-4"
                style={{ background: "rgba(255,255,255,.05)" }}>
                <div className="text-sm" style={{ color: "rgba(255,255,255,.5)", lineHeight: 1.6 }}>
                  {selectedProduct.type === "digital"
                    ? "Prodotto digitale — ricevi il file subito dopo il pagamento."
                    : "Prodotto fisico — il venditore gestisce spedizione e consegna direttamente a te."}
                </div>
              </div>

              <div className="flex items-end justify-between mb-5">
                <div>
                  <div className="font-black text-white" style={{ fontSize: 32 }}>
                    €{selectedProduct.price.toFixed(2)}
                  </div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,.25)" }}>IVA inclusa</div>
                </div>
                <div className="text-right">
                  <div className="text-xs" style={{ color: "rgba(255,255,255,.3)" }}>Categoria</div>
                  <div className="text-sm font-semibold text-white">{selectedProduct.category}</div>
                </div>
              </div>

              <button className="w-full py-4 rounded-2xl font-black text-white"
                style={{ background: "#FF4D4D" }}>
                Acquista — €{selectedProduct.price.toFixed(2)}
              </button>

              <div className="flex items-center justify-center gap-2 mt-3">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                  stroke="rgba(255,255,255,.2)" strokeWidth="1.2">
                  <rect x="1" y="4" width="10" height="7" rx="1.5" />
                  <path d="M4 4V3a2 2 0 0 1 4 0v1" />
                </svg>
                <span className="text-xs" style={{ color: "rgba(255,255,255,.2)" }}>
                  Pagamento sicuro via Stripe
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <NavMobile active="/store" />
    </div>
  );
}