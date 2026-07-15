import React from "react";
import { ScrollViewStyleReset } from "expo-router/html";

// HTML shell for the static web export. Icon hrefs are absolute because
// the site serves from the /squishydex subpath on GitHub Pages (matches
// experiments.baseUrl in app.json); the PNGs live in public/.
const BASE = "/squishydex";

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>SquishyDex</title>
        <meta
          name="description"
          content="Track every squishy you own — and the ones you want."
        />
        <link rel="icon" type="image/png" sizes="16x16" href={`${BASE}/favicon-16.png`} />
        <link rel="icon" type="image/png" sizes="32x32" href={`${BASE}/favicon-32.png`} />
        <link rel="icon" type="image/png" sizes="48x48" href={`${BASE}/favicon-48.png`} />
        <link rel="apple-touch-icon" sizes="180x180" href={`${BASE}/apple-touch-icon.png`} />
        <meta name="theme-color" content="#F0568C" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
