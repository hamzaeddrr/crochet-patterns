import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  checkAdminPassword,
  createAdminSessionToken,
} from "@/lib/admin/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const password = String(body.password || "");
  if (!(await checkAdminPassword(password))) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }
  const token = createAdminSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return res;
}
