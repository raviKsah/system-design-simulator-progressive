import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Sora } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Distinctive display face for the wordmark and headings — paired with Geist
// (body) and Geist Mono (data) so the brand has a voice without losing polish.
const sora = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "SystemForge — System Design Interview Simulator",
  description: "SystemForge is an interactive system design interview simulator — build architectures on a canvas, simulate production traffic, and get scored like a real interview.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#09090b",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${sora.variable} dark h-full antialiased`}
    >
      <body className="h-full overflow-hidden bg-background text-foreground">
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
