import { getAuthOptions } from "@/lib/auth";
import NextAuth from "next-auth";
import type { NextRequest } from "next/server";

function handler(request: NextRequest, context: { params: Promise<{ nextauth: string[] }> }) {
    const options = getAuthOptions();
    if (!options) return Response.json({ error: 'Authentication unavailable' }, { status: 503 });

    return NextAuth(options)(request, context);
}

export { handler as GET, handler as POST };
