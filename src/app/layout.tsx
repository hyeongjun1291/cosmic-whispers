import type { Metadata } from "next";
import { ColorSchemeScript, MantineProvider, createTheme } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "./globals.css";

const theme = createTheme({
  primaryColor: 'indigo',
  fontFamily: 'Outfit, sans-serif',
});

export const metadata: Metadata = {
  title: "별의 속삭임 - Whisper of the Stars",
  description: "실제 사주 명리학 엔진 기반 여성향 미연시 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&family=Noto+Serif+KR:wght@300;400;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="starfield" />
        <MantineProvider theme={theme} defaultColorScheme="dark">
          <Notifications position="top-center" zIndex={2000} />
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
