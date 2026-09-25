import { NextResponse } from "next/server";
import { readPurchases } from "@/lib/billing/unlock";

export async function GET() {
  const purchases = await readPurchases();
  return NextResponse.json({ purchases });
}
