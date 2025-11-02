// app/api/auth/me/route.ts
// Purpose: Return authenticated user with role, school, and optional staff/student details.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookieUser } from "@/lib/cookieUser";

export async function GET() {
  try {
    const user = await cookieUser();
    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    // 🔍 Refresh from DB to include role, school, and extended profile
    const freshUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        schoolId: true,
        school: {
          select: { id: true, name: true },
        },
        staff: {
          select: {
            id: true,
            position: true,
            department: { select: { id: true, name: true } },
            class: { select: { id: true, name: true } },
          },
        },
        student: {
          select: {
            id: true,
            class: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!freshUser) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(freshUser, { status: 200 });
  } catch (err) {
    console.error("GET /api/auth/me error:", err);
    return NextResponse.json(
      { message: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
