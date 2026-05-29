import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter, JetBrains_Mono, Syne } from "next/font/google";
import localFont from "next/font/local";
import { BRAND_LOGO_SRC } from "@/lib/constants";
import { AdminAuthProvider } from "@/components/AdminAuthProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const orithDisplay = localFont({
  src: "../../public/fonts/OrithDisplay-Regular.otf",
  variable: "--font-orith",
  display: "swap",
});

const grooteRegular = localFont({
  src: "../../public/fonts/Groote-Regular.otf",
  variable: "--font-groote",
  display: "swap",
});

const shootingStar = localFont({
  src: "../../public/fonts/Shooting Star.ttf",
  variable: "--font-shooting-star",
  display: "swap",
});

const audiowide = localFont({
  src: "../../public/fonts/Audiowide-Regular.ttf",
  variable: "--font-audiowide",
  display: "swap",
});

const calsans = localFont({
  src: "../../public/fonts/CalSans-Regular.ttf",
  variable: "--font-calsans",
  display: "swap",
});

const zendots = localFont({
  src: "../../public/fonts/ZenDots-Regular.ttf",
  variable: "--font-zendots",
  display: "swap",
});

const elmsSans = localFont({
  src: "../../public/fonts/ElmsSans-VariableFont_wght.ttf",
  variable: "--font-elms-sans",
  display: "swap",
});

const bungeeHairline = localFont({
  src: "../../public/fonts/BungeeHairline-Regular.ttf",
  variable: "--font-bungee-hairline",
  display: "swap",
});

const ningetan = localFont({
  src: "../../public/fonts/Ningetan.ttf",
  variable: "--font-ningetan",
  display: "swap",
});

const signatie = localFont({
  src: "../../public/fonts/Signatie.otf",
  variable: "--font-signatie",
  display: "swap",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#050505" },
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
  ],
};

export const metadata: Metadata = {
  title: "RUHGEN — Where imagination becomes reality",
  description:
    "Ultimate AI generation platform for images and video. Cinematic quality, real-time previews, built for creators and studios.",
  keywords: [
    "AI",
    "image generation",
    "video generation",
    "creators",
    "RUHGEN",
  ],
  icons: {
    icon: BRAND_LOGO_SRC,
    apple: BRAND_LOGO_SRC,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrains.variable} ${syne.variable} ${bricolage.variable} ${orithDisplay.variable} ${grooteRegular.variable} ${shootingStar.variable} ${audiowide.variable} ${calsans.variable} ${zendots.variable} ${elmsSans.variable} ${bungeeHairline.variable} ${ningetan.variable} ${signatie.variable} h-full scroll-smooth antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full font-sans"
        style={{
          backgroundColor: "var(--deep-black)",
          color: "var(--text-primary)",
        }}
      >
        <ThemeProvider>
          <AuthProvider>
            <AdminAuthProvider>{children}</AdminAuthProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
