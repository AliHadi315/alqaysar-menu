import type { Metadata } from "next";
import { Inter, Noto_Sans_Arabic, Playfair_Display } from "next/font/google";
import { LanguageProvider } from "@/components/LanguageProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });
const arabic = Noto_Sans_Arabic({ subsets: ["arabic"], variable: "--font-arabic", display: "swap" });

export const metadata: Metadata = {
  title: "Al Qaysr — Grills, Shawarma & Sandwiches",
  description: "The Al Qaysr menu in Chiyah, Beirut — charcoal grills, shawarma, sandwiches and shisha. Browse the take away and dine-in menus.",
  openGraph: { title: "Al Qaysr", description: "Charcoal grills, shawarma and sandwiches in Chiyah, Beirut.", type: "website" },
};

// Applies the saved language before first paint so Arabic does not flash LTR.
const LANG_BOOT = `document.documentElement.classList.add('js');try{if(localStorage.getItem('alqaysr.lang')==='ar'){document.documentElement.lang='ar';document.documentElement.dir='rtl'}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // The boot script sets lang/dir/class on <html> before React hydrates, so the
  // server markup and the live DOM differ here by design.
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={`${inter.variable} ${playfair.variable} ${arabic.variable}`}
    >
      <body className="font-sans antialiased">
        <script dangerouslySetInnerHTML={{ __html: LANG_BOOT }} />
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
