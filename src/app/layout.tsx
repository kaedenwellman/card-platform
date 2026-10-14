import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// Archivo variable (weight 100–900, width 62–125%), latin subset, self-hosted from
// @fontsource-variable/archivo (OFL, see src/fonts/Archivo-OFL.txt).
const archivo = localFont({
  src: "../fonts/archivo-latin-wdth-normal.woff2",
  variable: "--font-archivo",
  weight: "100 900",
  style: "normal",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
});

export const metadata: Metadata = {
  title: { default: "BRAND", template: "%s" },
  description: "Turn your resume into a personal site and a print-ready business card.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the landing page's look switcher sets data-look on <html> before hydration.
    <html lang="en" className={`${archivo.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
