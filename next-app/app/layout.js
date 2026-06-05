import "./globals.css";

export const metadata = { title: "How Sound Works", description: "Interactive audio tutorial" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Hanken+Grotesk:wght@400;500;600;700&family=Spline+Sans+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css" />
        <script defer src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js"></script>
        <script defer src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/contrib/auto-render.min.js"></script>
      </head>
      <body>
        <header className="topnav">
          <a href="/" className="brand">How Sound Works <em>— lab</em></a>
          <nav>
            <a href="/learn">Learn</a>
            <a href="/gallery">Gallery</a>
          </nav>
        </header>
        <main className="page">{children}</main>
      </body>
    </html>
  );
}
