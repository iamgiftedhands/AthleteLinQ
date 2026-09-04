"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const ROLES = [
  { value: "athlete", label: "Athlete", desc: "Get discovered and supported" },
  { value: "coach", label: "Coach / Local scout", desc: "Verify the talent you train" },
  { value: "academy", label: "Academy / Club", desc: "Showcase your squad" },
  { value: "scout", label: "Foreign scout / Agent", desc: "Find verified players" },
];

export default function SignUp() {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError("");
    if (!role) return setError("Please choose your role.");
    if (!fullName.trim()) return setError("Please enter your full name.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");

    setLoading(true);
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role, full_name: fullName.trim() } },
    });
    setLoading(false);
    if (err) return setError(err.message);
    router.push("/dashboard");
  }

  return (
    <div className="container" style={{ maxWidth: 480 }}>
      <div className="card">
        <h1>Join AthleteLinQ</h1>
        <p className="sub">Free to join. Choose who you are to get started.</p>

        <label>I am joining as</label>
        <div className="role-grid">
          {ROLES.map((r) => (
            <div
              key={r.value}
              className={"role-option" + (role === r.value ? " selected" : "")}
              onClick={() => setRole(r.value)}
            >
              {r.label}
              <small>{r.desc}</small>
            </div>
          ))}
        </div>

        <label>Full name</label>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Chinedu Okafor" />

        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />

        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />

        {error && <div className="error">{error}</div>}

        <button className="btn" onClick={handleSubmit} disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>
      </div>
    </div>
  );
}
