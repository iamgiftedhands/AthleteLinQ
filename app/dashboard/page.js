"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

const ROLE_INTRO = {
  athlete: "Complete your profile so coaches and scouts can find you. Video uploads arrive in the next release.",
  coach: "Complete your profile. Athlete verification tools arrive in the next release.",
  academy: "Complete your academy profile. Roster management arrives in the next release.",
  scout: "Complete your profile. Advanced athlete search arrives in the next release.",
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
        <span className="badge">{profile.role}</span>
        <h1 style={{ marginTop: 10 }}>Hi, {profile.full_name}</h1>
        <p className="sub">{ROLE_INTRO[profile.role]}</p>
        <Link href="/profile/edit"><button className="btn">Edit my profile</button></Link>
        <button className="btn btn-secondary" onClick={signOut}>Sign out</button>
      </div>
    </div>
  );
}
