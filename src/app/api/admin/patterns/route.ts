import { NextResponse } from "next/server";
import { readSiteContent } from "@/lib/data/store";

export async function GET() {
  const content = await readSiteContent();
  return NextResponse.json(content);
}
