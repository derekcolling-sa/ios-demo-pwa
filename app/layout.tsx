import type { Metadata, Viewport } from "next";
import { ServiceWorker } from "@/components/service-worker";
import { STORAGE_KEY } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  title: "iOS Demo",
  description: "A SwiftUI-style project tracker, rebuilt as an installable web app.",
  appleWebApp: {
    capable: true,
    title: "iOS Demo",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

// Applies the saved theme + accent before first paint so there's no flash.
const themeScript = `(function(){try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(
  STORAGE_KEY,
)})||"{}");var a=s.appearance||"system";if(a==="dark"||(a==="system"&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark");document.documentElement.style.setProperty("--accent","var(--"+(s.accent||"indigo")+")")}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="h-full overflow-hidden">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
