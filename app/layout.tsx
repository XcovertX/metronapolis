// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Metronapolis – Text Prototype",
  description: "Looping, neon-noir text adventure prototype.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          background: "#050509",
          color: "#f5f5f5",
        }}
      >
        {children}
      </body>
    </html>
  );
}
