import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "AthleteLinQ",
  description: "Discover, verify and support grassroots African athletes — across every sport.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <nav className="nav">
          <div className="container">
            <Link href="/" className="brand">
              <img src="/logo.png" alt="AthleteLinQ" className="brand-logo" />
            </Link>
            <div>
              <Link href="/athletes">Discover</Link>
              <Link href="/login">Sign in</Link>
              <Link href="/signup">Join</Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
