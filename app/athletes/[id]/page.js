"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

function ageFrom(dob) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}

export default function AthleteProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [athlete, setAthlete] = useState(null);
  const [videos, setVideos] = useState([]);
  const [verifCount, setVerifCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: p } = await supabase
        .from("profiles")
        .select("id, full_name, state, photo_url, role")
        .eq("id", id)
        .single();
      if (!p || p.role !== "athlete") { setLoading(false); return; }
      setProfile(p);

      const [{ data: a }, { data: v }, { count }] = await Promise.all([
        supabase.from("athletes").select("*").eq("profile_id", id).single(),
        supabase.from("videos").select("*").eq("athlete_id", id).eq("status", "ready").order("created_at", { ascending: false }),
        supabase.from("verifications").select("id", { count: "exact", head: true }).eq("athlete_id", id),
      ]);
      setAthlete(a);
      setVideos(v || []);
      setVerifCount(count || 0);
      setLoading(false);
    }
    load();
  }, [id]);

  function videoUrl(path) {
    return supabase.storage.from("videos").getPublicUrl(path).data.publicUrl;
  }

  if (loading) return <div className="container"><div className="card">Loading...</div></div>;
  if (!profile) return (
    <div className="container"><div className="card">
      <h1>Athlete not found</h1>
      <p className="sub">This profile does not exist or is not an athlete account.</p>
    </div></div>
  );

  const age = ageFrom(athlete?.date_of_birth);
  const level = athlete?.trust_level || 1;

  return (
    <div className="container" style={{ maxWidth: 680 }}>
      <div className="card">
        <div className="profile-head">
          {profile.photo_url ? (
            <img src={profile.photo_url} alt={profile.full_name} className="avatar-lg" />
          ) : (
            <div className="avatar-lg avatar-empty">{profile.full_name.charAt(0).toUpperCase()}</div>
          )}
          <div>
            <h1 style={{ marginBottom: 4 }}>{profile.full_name}</h1>
            <div className="card-meta">
              {[athlete?.sport, athlete?.position].filter(Boolean).join(" · ") || "Sport not set"}
            </div>
            <div className="card-meta muted">
              {[age !== null ? `${age} yrs` : null, profile.state].filter(Boolean).join(" · ")}
            </div>
            <div style={{ marginTop: 8 }}>
              {level >= 2 ? (
                <span className="verified-chip">✓ LinQ Verified — Level {level}</span>
              ) : (
                <span className="registered-chip">Registered — Level 1</span>
              )}
              {verifCount > 0 && (
                <span className="card-meta muted" style={{ marginLeft: 8 }}>
                  Vouched for by {verifCount} coach{verifCount > 1 ? "es" : ""}
                </span>
              )}
            </div>
          </div>
        </div>
        {athlete?.bio && <p style={{ marginTop: 16 }}>{athlete.bio}</p>}
      </div>

      <h2 className="section-title">Highlights</h2>
      {videos.length === 0 && (
        <div className="card"><p className="sub" style={{ marginBottom: 0 }}>No videos uploaded yet.</p></div>
      )}
      {videos.map((v) => (
        <div className="card" key={v.id}>
          <video controls preload="metadata" src={videoUrl(v.playback_id)} className="video-player" />
          <div className="video-row"><strong>{v.title}</strong></div>
        </div>
      ))}
    </div>
  );
}
