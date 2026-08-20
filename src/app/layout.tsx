import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers/providers";
import { JsonLd } from "./json-ld";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mehravayebalout.ir"),
  title: {
    default: "مهر آوای بلوط | آموزشگاه موسیقی تهران - دوره‌ها و کارگاه‌های حرفه‌ای",
    template: "%s | مهر آوای بلوط",
  },
  description: "مؤسسه موسیقی مهر آوای بلوط - مرکز تخصصی آموزش موسیقی، کارگاه‌های حرفه‌ای و مسترکلاس در تهران. آموزش پیانو، ویولن، گیتار، آواز، سه‌تار و سازهای ایرانی با بهترین اساتید. ثبت‌نام آنلاین.",
  keywords: [
    // Persian keywords - primary (music education)
    "آموزشگاه موسیقی", "آموزش موسیقی", "کلاس موسیقی", "مدرسه موسیقی",
    "مهر آوای بلوط", "آموزشگاه موسیقی تهران", "کارگاه موسیقی", "مسترکلاس موسیقی",
    // Persian keywords - instruments
    "آموزش پیانو", "آموزش ویولن", "آموزش گیتار", "آموزش آواز",
    "آموزش سه‌تار", "آموزش تار", "آموزش کمانچه", "آموزش سنتور",
    "آموزش درامز", "آموزش فلوت", "آموزش کلارینت", "آموزش قانون",
    // Persian keywords - music types
    "موسیقی ایرانی", "موسیقی سنتی", "موسیقی کلاسیک", "موسیقی پاپ",
    "تئوری موسیقی", "سلفژ", "هارمونی", "بداهه‌نوازی",
    // Persian keywords - levels & registration
    "دوره موسیقی مبتدی", "دوره موسیقی حرفه‌ای", "ثبت نام موسیقی",
    "کلاس موسیقی کودکان", "آموزش موسیقی کودکان",
    // Persian keywords - locations
    "آموزشگاه موسیقی بلوار معلم", "آموزشگاه موسیقی یافت‌آباد",
    "آموزشگاه موسیقی الغدیر",
    // Persian keywords - indirect/long-tail
    "فواید یادگیری موسیقی", "موسیقی و مغز", "آموزش ساز برای مبتدیان",
    "بهترین آموزشگاه موسیقی تهران", "قیمت کلاس موسیقی",
    "دستگاه موسیقی ایرانی", "ردیف موسیقی", "آموزش سلفژ",
    // English keywords
    "Mehr Avaye Balout", "Music Academy Tehran", "Music School Iran",
    "Piano Lessons Tehran", "Violin Lessons", "Guitar Lessons",
    "Traditional Iranian Music", "Music Workshop", "Masterclass Music",
    "Music Theory Course", "Solfeggio", "Music Education",
    "Dastgah Iranian Music", "Radif Music", "Setar Lessons",
    "Music Classes for Kids", "Best Music School Tehran",
  ],
  authors: [{ name: "Mehr Avaye Balout", url: "https://mehravayebalout.ir" }],
  creator: "Mehr Avaye Balout",
  publisher: "Mehr Avaye Balout",
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
  icons: {
    icon: "/logo-icon.png",
    apple: "/logo-icon-256.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "fa_IR",
    alternateLocale: "en_US",
    url: "https://mehravayebalout.ir",
    siteName: "مهر آوای بلوط",
    title: "مهر آوای بلوط | آموزشگاه موسیقی تهران",
    description: "مرکز تخصصی آموزش موسیقی و برگزاری کارگاه‌های حرفه‌ای در تهران با بهترین اساتید ایران",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "مهر آوای بلوط - آموزشگاه موسیقی تهران",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "مهر آوای بلوط | آموزشگاه موسیقی تهران",
    description: "مرکز تخصصی آموزش موسیقی و کارگاه‌های حرفه‌ای در تهران",
    images: ["/og-image.jpg"],
  },
  alternates: {
    canonical: "https://mehravayebalout.ir",
  },
  category: "Music Education",
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#8B2252" },
    { media: "(prefers-color-scheme: dark)", color: "#C2487A" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-xl">
          رفتن به محتوا
        </a>
        <JsonLd />
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
