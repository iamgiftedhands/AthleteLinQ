"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const MAX_MB = 50;

export default function MyVideos() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState([]);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState(null); // { type, text }
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadVideos = useCallback(async (uid) => {
    const { data } = await supabase
      .from("videos")
      .select("*")
      .eq("athlete_id", uid)
      .neq("status", "removed")
      .order("created_at", { ascending: false });
    setVideos(data || []);
  }, []);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (!p || p.role !== "athlete") return router.push("/dashboard");
      setUser(user);
      await loadVideos(user.id);
      setLoading(false);
    }
    init();
  }, [router, loadVideos]);

  function publicUrl(path) {
    return supabase.storage.from("videos").getPublicUrl(path).data.publicUrl;
  }

  async function handleUpload() {
    setMsg(null);
    if (!title.trim()) return setMsg({ type: "error", text: "Give the video a title first." });
    if (!file) return setMsg({ type: "error", text: "Choose a video file." });
    if (!file.type.startsWith("video/")) return setMsg({ type: "error", text: "That file is not a video." });
    if (file.size > MAX_MB * 1024 * 1024)
      return setMsg({ type: "error", text: `Video is too large. Max ${MAX_MB}MB — trim the clip and try again.` });

    setUploading(true);
    const ext = file.name.split(".").pop().toLowerCase();
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage.from("videos").upload(path, file);
    if (upErr) {
      setUploading(false);
      return setMsg({ type: "error", text: "Upload failed: " + upErr.message });
    }

    const { error: dbErr } = await supabase.from("videos").insert({
      athlete_id: user.id,
      playback_id: path,
      title: title.trim(),
      status: "ready",
    });
    setUploading(false);
    if (dbErr) return setMsg({ type: "error", text: "Saved file but not the record: " + dbErr.message });

    setTitle("");
    setFile(null);
    document.getElementById("video-file-input").value = "";
    setMsg({ type: "success", text: "Video uploaded. Scouts can now watch it on your profile." });
    await loadVideos(user.id);
  }

  async function handleDelete(v) {
    if (!confirm(`Delete "${v.title}"? This cannot be undone.`)) return;
    await supabase.storage.from("videos").remove([v.playback_id]);
    await supabase.from("videos").delete().eq("id", v.id);
    await loadVideos(user.id);
  }

  if (loading) return <div className="container"><div className="card">Loading...</div></div>;

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <div className="card">
        <h1>My videos</h1>
        <p className="sub">
          Short highlight clips work best — one skill, one moment, under a minute.
          Max {MAX_MB}MB per clip.
        </p>

        <label>Video title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='e.g. "Match highlights vs Ikorodu FC"'
        />

        <label>Video file</label>
        <input
          id="video-file-input"
          type="file"
          accept="video/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        {msg && <div className={msg.type}>{msg.text}</div>}

        <button className="btn" onClick={handleUpload} disabled={uploading}>
          {uploading ? "Uploading... keep this page open" : "Upload video"}
        </button>
        <button className="btn btn-secondary" onClick={() => router.push("/dashboard")}>
          Back to dashboard
        </button>
      </div>

      {videos.map((v) => (
        <div className="card" key={v.id}>
          <video controls preload="metadata" src={publicUrl(v.playback_id)} className="video-player" />
          <div className="video-row">
            <strong>{v.title}</strong>
            <button className="link-danger" onClick={() => handleDelete(v)}>Delete</button>
          </div>
        </div>
      ))}

      {videos.length === 0 && (
        <div className="card">
          <p className="sub" style={{ marginBottom: 0 }}>
            No videos yet. Your first clip is your handshake with every scout on
            AthleteLinQ — upload one above.
          </p>
        </div>
      )}
    </div>
  );
}
