import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter, Inter_Tight, JetBrains_Mono, Syne } from "next/font/google";
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

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
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

const shootingStar = localFont({
  src: "../../public/fonts/Shooting Star.ttf",
  variable: "--font-shooting-star",
  display: "swap",
});

const calsans = localFont({
  src: "../../public/fonts/CalSans-Regular.ttf",
  variable: "--font-calsans",
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

const quadratGrotesk = localFont({
  src: "../../public/fonts/Quadrat Grotesk W01 Regular.ttf",
  variable: "--font-quadrat-grotesk",
  display: "swap",
});

const hypnoticColr = localFont({
  src: "../../public/fonts/Hypnotic 01-COLR.otf",
  variable: "--font-hypnotic-colr",
  display: "swap",
});

const hypnoticOutline = localFont({
  src: "../../public/fonts/Hypnotic 01 Outline.otf",
  variable: "--font-hypnotic-outline",
  display: "swap",
});

const toqsi = localFont({
  src: "../../public/fonts/Toqsi-Regular.otf",
  variable: "--font-toqsi",
  display: "swap",
});

const nareko = localFont({
  src: "../../public/fonts/Nareko.ttf",
  variable: "--font-nareko",
  display: "swap",
});

const rink = localFont({
  src: [
    {
      path: "../../public/fonts/Rink-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Rink-Medium.otf",
      weight: "500 700",
      style: "normal",
    },
  ],
  variable: "--font-rink",
  display: "swap",
});

const ticdar = localFont({
  src: [
    {
      path: "../../public/fonts/Ticdar-Regular.otf",
      weight: "400 600",
      style: "normal",
    },
    {
      path: "../../public/fonts/Ticdar-SemiBold.otf",
      weight: "700 900",
      style: "normal",
    },
  ],
  variable: "--font-ticdar",
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

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || "https://ruhgen.com").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "RUHGEN — AI Image & Video Generation Platform",
    template: "%s | RUHGEN",
  },
  description:
    "Transform prompts and ideas into ultra-high-definition images and cinematic video clips. Professional generative AI suite built for visual artists, agencies, and studios.",
  keywords: [
    "AI image generator",
    "AI video generator",
    "cinematic AI generator",
    "text to image",
    "text to video",
    "generative studio",
    "RUHGEN",
    "Qwen AI",
    "FLUX AI",
  ],
  authors: [{ name: "RUHGEN Platform" }],
  creator: "RUHGEN Studio",
  publisher: "RUHGEN Generative AI",
  alternates: {
    canonical: "./",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "RUHGEN Generative AI",
    title: "RUHGEN — AI Image & Video Generation Platform",
    description:
      "Transform prompts and ideas into ultra-high-definition images and cinematic video clips. Professional generative AI suite for creators and studios.",
    images: [
      {
        url: BRAND_LOGO_SRC,
        width: 512,
        height: 512,
        alt: "RUHGEN Generative AI Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RUHGEN — AI Image & Video Generation Platform",
    description:
      "Transform prompts and ideas into ultra-high-definition images and cinematic video clips.",
    images: [BRAND_LOGO_SRC],
  },
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
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "RUHGEN",
    url: siteUrl,
    logo: `${siteUrl}${BRAND_LOGO_SRC}`,
    description: "Professional generative AI studio for image and video synthesis.",
    sameAs: [],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "RUHGEN",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/community?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html
      lang="en"
      className={`${inter.variable} ${interTight.variable} ${jetbrains.variable} ${syne.variable} ${bricolage.variable} ${shootingStar.variable} ${calsans.variable} ${bungeeHairline.variable} ${ningetan.variable} ${signatie.variable} ${quadratGrotesk.variable} ${ticdar.variable} ${rink.variable} ${hypnoticColr.variable} ${hypnoticOutline.variable} ${toqsi.variable} ${nareko.variable} h-full scroll-smooth antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
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
