import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobPilot Agent | همراه هوشمند کاریابی",
  description: "ایجنت هوشمند کاریابی برای مسیر Junior Frontend — پیدا کردن فرصت مناسب و ساخت رزومه",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="antialiased"
        style={{
          fontFamily: "'Vazirmatn', Tahoma, 'Segoe UI', system-ui, sans-serif",
          direction: "rtl",
          textAlign: "right",
        }}
      >
        {children}
      </body>
    </html>
  );
}
