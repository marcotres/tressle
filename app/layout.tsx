import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Tressle — One Letter. Endless Possibilities.",
  description: "The daily word challenge. Think fast. Dig deep. Find the rarest words."
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}