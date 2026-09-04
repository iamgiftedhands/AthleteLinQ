import Link from "next/link";

export default function Home() {
  return (
    <div className="hero">
      <h1>Talent deserves to be seen.</h1>
      <p>
        AthleteLinQ connects grassroots African footballers with the coaches,
        academies and scouts who can change their story — with verified
        profiles you can trust.
      </p>
      <Link href="/signup"><button className="btn">Create your profile</button></Link>
    </div>
  );
}
