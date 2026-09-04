"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const NIGERIAN_STATES = ["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT Abuja","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"];
const POSITIONS = ["Goalkeeper","Right Back","Left Back","Centre Back","Defensive Midfielder","Central Midfielder","Attacking Midfielder","Right Winger","Left Winger","Striker"];

export default function EditProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [athlete, setAthlete] = useState(null);
  const [academy, setAcademy] = useState(null);
  const [msg, setMsg] = useState(null); // { type: "success" | "error", text }
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
    setSaving(true);
    const { error: e1 } = await supabase.from("profiles").update({
      full_name: profile.full_name,
      state: profile.state,
      phone: profile.phone,
    }).eq("id", profile.id);

    let e2 = null;
    if (profile.role === "athlete" && athlete) {
      const { error } = await supabase.from("athletes").upsert({
        profile_id: profile.id,
        date_of_birth: athlete.date_of_birth || null,
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
    setMsg({ type: "success", text: "Profile saved." });
  }

  if (!profile) return <div className="container"><div className="card">Loading...</div></div>;

  return (
    <div className="container" style={{ maxWidth: 560 }}>
      <div className="card">
        <span className="badge">{profile.role}</span>
        <h1 style={{ marginTop: 10 }}>Edit profile</h1>
        <p className="sub">This is what coaches, scouts and supporters will see.</p>

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

            <label>Position</label>
            <select value={athlete.position || ""} onChange={(e) => setAthlete({ ...athlete, position: e.target.value })}>
              <option value="">Select position</option>
              {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>

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
