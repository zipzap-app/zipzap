"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const categories = [
  { id: "musica", label: "Musica" },
  { id: "tech", label: "Tech" },
  { id: "moda", label: "Moda" },
  { id: "fotografia", label: "Fotografia" },
  { id: "cucina", label: "Cucina" },
  { id: "sport", label: "Sport" },
  { id: "arte", label: "Arte" },
  { id: "viaggi", label: "Viaggi" },
  { id: "gaming", label: "Gaming" },
  { id: "formazione", label: "Formazione" },
  { id: "fitness", label: "Fitness" },
  { id: "altro", label: "Altro" },
];

export default function EditProfile() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [category, setCategory] = useState("");
  const [linkBioUrl, setLinkBioUrl] = useState("");
  const [linkBioTitle, setLinkBioTitle] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (data) {
        setFullName(data.full_name || "");
        setUsername(data.username || "");
        setBio(data.bio || "");
        setCategory(data.category || "");
        setLinkBioUrl(data.link_bio_url || "");
        setLinkBioTitle(data.link_bio_title || "");
        setAvatarUrl(data.avatar_url || "");
      }
      setLoading(false);
    }
    loadProfile();
  }, [router]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });
    if (!uploadError) {
      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);
      const publicUrl = data.publicUrl + `?t=${Date.now()}`;
      setAvatarUrl(publicUrl);
      await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);
    }
    setUploadingAvatar(false);
  }

  async function handleSave() {
    if (!fullName || !username) {
      setError("Nome e username sono obbligatori");
      return;
    }
    setSaving(true);
    setError("");
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
        link_bio_url: linkBioUrl,
        link_bio_title: linkBioTitle,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => { router.push("/profile"); }, 1200);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center"
        style={{ background: "#000" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-xl flex items-center justify-center"
            style={{ width: 44, height: 44, background: "#FF4D4D" }}>
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
              <polygon points="10,1 6,8 9,8 5,15 13,6 9,6" fill="white" />
            </svg>
          </div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,.4)" }}>Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-y-auto"
      style={{ background: "linear-gradient(135deg, #0d0000 0%, #000 60%)" }}>
      <div className="max-w-lg mx-auto px-6 py-8 pb-20">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.push("/profile")}
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
          <span className="font-bold text-white ml-2">Modifica profilo</span>
        </div>

        {/* Avatar */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="rounded-full flex items-center justify-center font-black text-3xl overflow-hidden"
              style={{
                width: 90, height: 90,
                background: "#1a0020",
                border: "3px solid rgba(255,77,77,.3)",
              }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ color: "#FF4D4D" }}>
                  {fullName ? fullName[0].toUpperCase() : "?"}
                </span>
              )}
            </div>
            <label htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 rounded-full flex items-center justify-center cursor-pointer"
              style={{ width: 28, height: 28, background: "#FF4D4D" }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                stroke="#fff" strokeWidth="1.5">
                <path d="M6 2v8M2 6h8" strokeLinecap="round" />
              </svg>
            </label>
            <input id="avatar-upload" type="file" accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload} />
            {uploadingAvatar && (
              <div className="absolute inset-0 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,0,0,.6)" }}>
                <span className="text-white text-xs font-bold">...</span>
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-5">

          {/* Info base */}
          <div className="rounded-2xl overflow-hidden"
            style={{ border: "0.5px solid rgba(255,255,255,.08)" }}>
            <div className="px-4 py-2.5"
              style={{ background: "rgba(255,255,255,.04)", borderBottom: "0.5px solid rgba(255,255,255,.08)" }}>
              <span className="text-xs font-bold"
                style={{ color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: ".4px" }}>
                Info base
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center px-4 py-3 gap-3">
                <span className="text-sm w-24 flex-shrink-0" style={{ color: "rgba(255,255,255,.4)" }}>Nome</span>
                <input type="text" value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nome completo"
                  className="flex-1 bg-transparent text-white text-sm outline-none" />
              </div>
              <div className="flex items-center px-4 py-3 gap-3"
                style={{ borderTop: "0.5px solid rgba(255,255,255,.06)" }}>
                <span className="text-sm w-24 flex-shrink-0" style={{ color: "rgba(255,255,255,.4)" }}>Username</span>
                <input type="text" value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, "."))}
                  placeholder="username"
                  className="flex-1 bg-transparent text-white text-sm outline-none" />
              </div>
              <div className="flex items-start px-4 py-3 gap-3"
                style={{ borderTop: "0.5px solid rgba(255,255,255,.06)" }}>
                <span className="text-sm w-24 flex-shrink-0 pt-0.5" style={{ color: "rgba(255,255,255,.4)" }}>Bio</span>
                <textarea value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 150))}
                  placeholder="Scrivi qualcosa di te..."
                  rows={3}
                  className="flex-1 bg-transparent text-white text-sm outline-none resize-none" />
              </div>
            </div>
          </div>

          {/* Categoria */}
          <div className="rounded-2xl overflow-hidden"
            style={{ border: "0.5px solid rgba(255,255,255,.08)" }}>
            <div className="px-4 py-2.5"
              style={{ background: "rgba(255,255,255,.04)", borderBottom: "0.5px solid rgba(255,255,255,.08)" }}>
              <span className="text-xs font-bold"
                style={{ color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: ".4px" }}>
                Categoria
              </span>
            </div>
            <div className="p-3 grid gap-2" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
              {categories.map((cat) => (
                <button key={cat.id} onClick={() => setCategory(cat.id)}
                  className="py-2 px-2 rounded-xl text-xs font-semibold"
                  style={{
                    background: category === cat.id ? "rgba(255,77,77,.15)" : "transparent",
                    color: category === cat.id ? "#FF4D4D" : "rgba(255,255,255,.4)",
                    border: category === cat.id ? "1px solid rgba(255,77,77,.3)" : "1px solid rgba(255,255,255,.07)",
                  }}>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Link in bio */}
          <div className="rounded-2xl overflow-hidden"
            style={{ border: "0.5px solid rgba(255,77,77,.2)" }}>
            <div className="px-4 py-2.5"
              style={{ background: "rgba(255,77,77,.07)", borderBottom: "0.5px solid rgba(255,77,77,.15)" }}>
              <span className="text-xs font-bold"
                style={{ color: "#FF4D4D", textTransform: "uppercase", letterSpacing: ".4px" }}>
                Link in bio
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center px-4 py-3 gap-3">
                <span className="text-sm w-24 flex-shrink-0" style={{ color: "rgba(255,255,255,.4)" }}>Titolo</span>
                <input type="text" value={linkBioTitle}
                  onChange={(e) => setLinkBioTitle(e.target.value)}
                  placeholder="Es. I miei prodotti"
                  className="flex-1 bg-transparent text-white text-sm outline-none" />
              </div>
              <div className="flex items-center px-4 py-3 gap-3"
                style={{ borderTop: "0.5px solid rgba(255,255,255,.06)" }}>
                <span className="text-sm w-24 flex-shrink-0" style={{ color: "rgba(255,255,255,.4)" }}>URL</span>
                <input type="url" value={linkBioUrl}
                  onChange={(e) => setLinkBioUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: "#FF4D4D" }} />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-center" style={{ color: "#FF4D4D" }}>{error}</p>
          )}

          {success && (
            <div className="rounded-2xl py-3 text-center"
              style={{ background: "rgba(29,158,117,.15)", border: "1px solid rgba(29,158,117,.3)" }}>
              <p className="text-sm font-bold" style={{ color: "#4dffb8" }}>
                Profilo salvato ✓
              </p>
            </div>
          )}

          <button onClick={handleSave} disabled={saving}
            className="w-full py-4 rounded-2xl font-black text-white text-base"
            style={{ background: saving ? "#993333" : "#FF4D4D" }}>
            {saving ? "Salvataggio..." : "Salva modifiche"}
          </button>

          <button onClick={async () => {
            const supabase = createClient();
            await supabase.auth.signOut();
            router.push("/");
          }}
            className="w-full py-3 rounded-2xl font-bold text-sm"
            style={{ border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.4)" }}>
            Esci dall'account
          </button>

        </div>
      </div>
    </div>
  );
}