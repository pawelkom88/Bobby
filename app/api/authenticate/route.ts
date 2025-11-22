import { createClient } from "@deepgram/sdk";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // exit early so we don't request 70000000 keys while in devmode
  if (process.env.DEEPGRAM_ENV === "development") {
    return NextResponse.json({
      key: process.env.DEEPGRAM_API_KEY ?? "",
    });
  }

  const deepgram = createClient(process.env.DEEPGRAM_API_KEY ?? "");

  // 1. Create a temporary key with limited scope (usage:write is required for Voice Agent)
  let { result: tokenResult, error: tokenError } =
    await deepgram.auth.grantToken();

  if (tokenError) {
    console.error("Error creating Deepgram token:", tokenError);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }

  if (!tokenResult) {
      return NextResponse.json(
        { error: "Failed to generate token" },
        { status: 500 }
      );
  }

  return NextResponse.json({ ...tokenResult });
}

