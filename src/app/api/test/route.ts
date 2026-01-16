import { NextResponse } from 'next/server';

export async function POST() {
    return NextResponse.json({ message: "Test route works" });
}

export async function GET() {
    return NextResponse.json({ message: "Test route GET works" });
}
