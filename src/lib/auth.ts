import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export function getAuthOptions(): NextAuthOptions | null {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_SECRET } = process.env;
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !NEXTAUTH_SECRET || NEXTAUTH_SECRET.length < 32) {
        return null;
    }

    return {
        providers: [
            GoogleProvider({
                clientId: GOOGLE_CLIENT_ID,
                clientSecret: GOOGLE_CLIENT_SECRET,
            }),
        ],
        callbacks: {
            async session({ session, token }) {
                if (session.user) {
                    Object.assign(session.user, { id: token.sub });
                }
                return session;
            },
        },
        session: { strategy: "jwt" },
        secret: NEXTAUTH_SECRET,
    };
}
