import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "AthleteLinq",
  description: "Discover, verify and support grassroots football talent in Africa.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <nav className="nav">
          <div className="container">
            <Link href="/" className="brand">AthleteLinQ</Link>
            <div>
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
