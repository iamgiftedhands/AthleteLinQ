"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

const NIGERIAN_STATES = ["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT Abuja","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"];
const SPORTS = ["Football","Basketball","Athletics (Track & Field)","Boxing","Wrestling","Tennis","Table Tennis","Volleyball","Handball","Badminton","Para Sports","Other"];

function ageFrom(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

export default function Discover() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sport, setSport] = useState("");
  const [state, setState] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("athletes")
        .select("profile_id, sport, position, date_of_birth, trust_level, profiles(full_name, state, photo_url)")
        .limit(200);
      setRows((data || []).filter((r) => r.profiles && r.profiles.full_name));
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (sport && r.sport !== sport) return false;
      if (state && r.profiles.state !== state) return false;
      if (verifiedOnly && (r.trust_level || 1) < 2) return false;
      const age = ageFrom(r.date_of_birth);
      if (minAge && (age === null || age < Number(minAge))) return false;
      if (maxAge && (age === null || age > Number(maxAge))) return false;
      return true;
    });
  }, [rows, sport, state, minAge, maxAge, verifiedOnly]);

  return (
    <div className="container">
      <h1 className="page-title">Discover athletes</h1>
      <p className="sub" style={{ marginBottom: 16 }}>
        Grassroots talent across Africa — filter by sport, age, and location.
      </p>

      <div className="filters">
        <select value={sport} onChange={(e) => setSport(e.target.value)}>
          <option value="">All sports</option>
          {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={state} onChange={(e) => setState(e.target.value)}>
          <option value="">All states</option>
          {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="number" min="8" max="60" placeholder="Min age" value={minAge} onChange={(e) => setMinAge(e.target.value)} />
        <input type="number" min="8" max="60" placeholder="Max age" value={maxAge} onChange={(e) => setMaxAge(e.target.value)} />
        <label className="check">
          <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
          Verified only
        </label>
      </div>

      {loading && <div className="card">Loading athletes...</div>}

      {!loading && filtered.length === 0 && (
        <div className="card">
          <p className="sub" style={{ marginBottom: 0 }}>
            No athletes match these filters yet. Try widening your search.
          </p>
        </div>
      )}

      <div className="feed-grid">
        {filtered.map((r) => {
          const age = ageFrom(r.date_of_birth);
          return (
            <Link key={r.profile_id} href={`/athletes/${r.profile_id}`} className="athlete-card">
              {r.profiles.photo_url ? (
                <img src={r.profiles.photo_url} alt={r.profiles.full_name} className="card-photo" />
              ) : (
                <div className="card-photo card-photo-empty">
                  {r.profiles.full_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="card-body">
                <div className="card-name-row">
                  <strong>{r.profiles.full_name}</strong>
                  {(r.trust_level || 1) >= 2 && <span className="verified-chip">✓ Verified</span>}
                </div>
                <div className="card-meta">
                  {[r.sport, r.position].filter(Boolean).join(" · ") || "Sport not set"}
                </div>
                <div className="card-meta muted">
                  {[age !== null ? `${age} yrs` : null, r.profiles.state].filter(Boolean).join(" · ")}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
