// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { SchoolAccount } from "@/lib/schoolAccount";

export async function GET() {
  try {
    // Correct way to initialize based on your class definition
    const account = await SchoolAccount.init();

    if (!account) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userPayload = {
      id: account.info.id,
      surname: account.info.surname,
      firstName: account.info.firstName,
      otherNames: account.info.otherNames,
      email: account.info.email,
      role: account.role,
      schoolId: account.schoolId,
      school: {
        id: account.school.id,
        name: account.school.name,
        domain: account.schoolDomain,
      },
    };

    return NextResponse.json({ user: userPayload }, { status: 200 });
  } catch (err) {
    console.error("GET /api/auth/me failed:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
