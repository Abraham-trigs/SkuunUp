// app/api/auth/logout/route.ts
// Purpose: Clear authentication cookie and log out the user

import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/cookies.ts";

export async function POST() {
  const res = NextResponse.json({ message: "Logged out successfully" });
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    path: "/",
  });
  return res;
}

/* Example usage:
POST /api/auth/logout
Clears JWT cookie and returns success message
*/
