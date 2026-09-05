import Link from "next/link";

export default function Home() {
  return (
    <>
      <div className="hero hero-photo">
        <div className="hero-inner">
          <h1>Talent deserves to be seen.</h1>
          <p>
            AthleteLinQ connects grassroots African athletes — footballers,
            basketballers, runners, fighters and more — with the coaches,
            academies and scouts who can change their story, through verified
            profiles you can trust.
          </p>
          <Link href="/signup"><button className="btn">Create your profile</button></Link>
        </div>
      </div>

      <section className="container">
        <div className="photo-strip">
          <img src="/g1.jpg" alt="Basketball players competing on an outdoor court" />
          <img src="/g2.jpg" alt="Community football match on a sand pitch" />
          <img src="/g3.jpg" alt="Athlete training on a green field" />
        </div>
        <p className="strip-caption">
          Every sport. Every field. From street courts to sand pitches — this is
          where careers begin.
        </p>
      </section>
    </>
  );
}
