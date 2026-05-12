import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spine West Clinical Assistant",
  description: "AI-Powered Medical Insights built on eClinicalWorks FHIR APIs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
