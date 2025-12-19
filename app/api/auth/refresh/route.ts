import { NextRequest, NextResponse } from "next/server";
import { signJwt } from "@/lib/jwt.ts";
import { COOKIE_NAME, COOKIE_OPTIONS } from "@/lib/cookies.ts";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
import { inferRoleFromPosition } from "@/lib/api/constants/roleInference.ts";

export async function POST(_req: NextRequest) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Infer role from staff position if present
    let role = schoolAccount.role;
    if (schoolAccount.staffApplication?.position) {
      role = inferRoleFromPosition(schoolAccount.staffApplication.position);
    }

    // Sign JWT using authoritative info
    const newToken = signJwt({
      id: schoolAccount.info.id,
      role,
      schoolId: schoolAccount.school.id, // align with client store
    });

    const res = NextResponse.json({ message: "Token refreshed" });
    res.cookies.set(COOKIE_NAME, newToken, COOKIE_OPTIONS);

    return res;
  } catch (err: any) {
    console.error("POST /api/auth/refresh error:", err);
    return NextResponse.json({ error: "Failed to refresh token" }, { status: 500 });
  }
}
