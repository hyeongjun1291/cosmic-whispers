import type { Metadata } from "next";
import { ColorSchemeScript, MantineProvider, createTheme } from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "@fontsource-variable/outfit";
import "@fontsource-variable/noto-serif-kr";
import "./globals.css";

const theme = createTheme({
  primaryColor: 'indigo',
  fontFamily: 'var(--font-sans)',
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
      </head>
      <body>
        <div className="starfield" />
        <MantineProvider theme={theme} defaultColorScheme="dark">
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
