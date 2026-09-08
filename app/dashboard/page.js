"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

const ROLE_INTRO = {
  athlete: "Complete your profile, then upload highlight videos so coaches and scouts can see you play.",
  coach: "Complete your profile. Athlete verification tools arrive in the next release.",
  academy: "Complete your academy profile. Roster management arrives in the next release.",
  scout: "Browse the discovery feed to find verified grassroots talent across every sport.",
};

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(data);
      setLoading(false);
    }
    load();
  }, [router]);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) return <div className="container"><div className="card">Loading...</div></div>;
  if (!profile) return (
    <div className="container"><div className="card">
      <h1>Almost there</h1>
      <p className="sub">Your profile is still being created. Refresh in a few seconds.</p>
    </div></div>
  );

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <div className="card">
        <div className="dash-head">
          {profile.photo_url ? (
            <img src={profile.photo_url} alt="" className="avatar-md" />
          ) : (
            <div className="avatar-md avatar-empty">{(profile.full_name || "?").charAt(0).toUpperCase()}</div>
          )}
          <span className="badge">{profile.role}</span>
        </div>
        <h1 style={{ marginTop: 10 }}>Hi, {profile.full_name}</h1>
        <p className="sub">{ROLE_INTRO[profile.role]}</p>
        {profile.role === "athlete" && (
          <Link href="/videos"><button className="btn">My videos</button></Link>
        )}
        {(profile.role === "scout" || profile.role === "coach") && (
          <Link href="/athletes"><button className="btn">Discover athletes</button></Link>
        )}
        <Link href="/profile/edit"><button className={profile.role === "athlete" ? "btn btn-secondary" : "btn"}>Edit my profile</button></Link>
        <button className="btn btn-secondary" onClick={signOut}>Sign out</button>
      </div>
    </div>
  );
}
