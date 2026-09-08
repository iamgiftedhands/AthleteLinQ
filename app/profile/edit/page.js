"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const NIGERIAN_STATES = ["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT Abuja","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"];
const SPORTS = ["Football","Basketball","Athletics (Track & Field)","Boxing","Wrestling","Tennis","Table Tennis","Volleyball","Handball","Badminton","Para Sports","Other"];
const POSITIONS_BY_SPORT = {
  "Football": ["Goalkeeper","Right Back","Left Back","Centre Back","Defensive Midfielder","Central Midfielder","Attacking Midfielder","Right Winger","Left Winger","Striker"],
  "Basketball": ["Point Guard","Shooting Guard","Small Forward","Power Forward","Center"],
  "Volleyball": ["Setter","Outside Hitter","Opposite Hitter","Middle Blocker","Libero"],
  "Handball": ["Goalkeeper","Left Wing","Right Wing","Left Back","Right Back","Centre Back","Pivot"],
};
const MAX_PHOTO_MB = 5;

export default function EditProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [athlete, setAthlete] = useState(null);
  const [academy, setAcademy] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (!p) return router.push("/dashboard");
      setProfile(p);
      if (p.role === "athlete") {
        const { data } = await supabase.from("athletes").select("*").eq("profile_id", user.id).single();
        setAthlete(data || { profile_id: user.id });
      }
      if (p.role === "academy") {
        const { data } = await supabase.from("academies").select("*").eq("profile_id", user.id).single();
        setAcademy(data || { profile_id: user.id });
      }
    }
    load();
  }, [router]);

  async function save() {
    setMsg(null);

    let photo_url = profile.photo_url;
    if (photoFile) {
      if (!photoFile.type.startsWith("image/"))
        return setMsg({ type: "error", text: "Profile photo must be an image (JPG or PNG)." });
      if (photoFile.size > MAX_PHOTO_MB * 1024 * 1024)
        return setMsg({ type: "error", text: `Photo too large — max ${MAX_PHOTO_MB}MB.` });
    }

    setSaving(true);

    if (photoFile) {
      const ext = photoFile.name.split(".").pop().toLowerCase();
      const path = `${profile.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, photoFile);
      if (upErr) {
        setSaving(false);
        return setMsg({ type: "error", text: "Photo upload failed: " + upErr.message });
      }
      photo_url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    }

    const { error: e1 } = await supabase.from("profiles").update({
      full_name: profile.full_name,
      state: profile.state,
      phone: profile.phone,
      photo_url,
    }).eq("id", profile.id);

    let e2 = null;
    if (profile.role === "athlete" && athlete) {
      const { error } = await supabase.from("athletes").upsert({
        profile_id: profile.id,
        date_of_birth: athlete.date_of_birth || null,
        sport: athlete.sport || null,
        position: athlete.position || null,
        bio: athlete.bio || null,
      });
      e2 = error;
    }
    if (profile.role === "academy" && academy) {
      const { error } = await supabase.from("academies").upsert({
        profile_id: profile.id,
        club_name: academy.club_name || null,
        home_location: academy.home_location || null,
      });
      e2 = error;
    }
    setSaving(false);
    if (e1 || e2) return setMsg({ type: "error", text: (e1 || e2).message });
    setProfile({ ...profile, photo_url });
    setPhotoFile(null);
    setMsg({ type: "success", text: "Profile saved." });
  }

  if (!profile) return <div className="container"><div className="card">Loading...</div></div>;

  return (
    <div className="container" style={{ maxWidth: 560 }}>
      <div className="card">
        <span className="badge">{profile.role}</span>
        <h1 style={{ marginTop: 10 }}>Edit profile</h1>
        <p className="sub">This is what coaches, scouts and supporters will see.</p>

        <label>Profile photo</label>
        <div className="avatar-row">
          {profile.photo_url ? (
            <img src={profile.photo_url} alt="Profile photo" className="avatar-lg" />
          ) : (
            <div className="avatar-lg avatar-empty">
              {(profile.full_name || "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
            <small className="hint">
              {profile.role === "academy"
                ? "Your club badge or a team photo. JPG/PNG, max 5MB."
                : "A clear photo of your face. JPG/PNG, max 5MB."}
            </small>
          </div>
        </div>

        <label>Full name</label>
        <input value={profile.full_name || ""} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />

        <label>State</label>
        <select value={profile.state || ""} onChange={(e) => setProfile({ ...profile, state: e.target.value })}>
          <option value="">Select state</option>
          {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <label>Phone (only shown to verified scouts)</label>
        <input value={profile.phone || ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+234..." />

        {profile.role === "athlete" && athlete && (
          <>
            <label>Date of birth</label>
            <input type="date" value={athlete.date_of_birth || ""} onChange={(e) => setAthlete({ ...athlete, date_of_birth: e.target.value })} />

            <label>Sport</label>
            <select
              value={athlete.sport || ""}
              onChange={(e) => setAthlete({ ...athlete, sport: e.target.value, position: "" })}
            >
              <option value="">Select sport</option>
              {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            <label>Position / discipline</label>
            {POSITIONS_BY_SPORT[athlete.sport] ? (
              <select value={athlete.position || ""} onChange={(e) => setAthlete({ ...athlete, position: e.target.value })}>
                <option value="">Select position</option>
                {POSITIONS_BY_SPORT[athlete.sport].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            ) : (
              <input
                value={athlete.position || ""}
                onChange={(e) => setAthlete({ ...athlete, position: e.target.value })}
                placeholder="e.g. 100m sprint, Featherweight, Singles"
              />
            )}

            <label>Short bio</label>
            <textarea value={athlete.bio || ""} onChange={(e) => setAthlete({ ...athlete, bio: e.target.value })} placeholder="Tell scouts who you are, where you play, and what makes you different." />
          </>
        )}

        {profile.role === "academy" && academy && (
          <>
            <label>Club / academy name</label>
            <input value={academy.club_name || ""} onChange={(e) => setAcademy({ ...academy, club_name: e.target.value })} />

            <label>Home ground / community</label>
            <input value={academy.home_location || ""} onChange={(e) => setAcademy({ ...academy, home_location: e.target.value })} placeholder="e.g. Agege Stadium annex, Lagos" />
          </>
        )}

        {msg && <div className={msg.type}>{msg.text}</div>}

        <button className="btn" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save profile"}</button>
        <button className="btn btn-secondary" onClick={() => router.push("/dashboard")}>Back to dashboard</button>
      </div>
    </div>
  );
}
