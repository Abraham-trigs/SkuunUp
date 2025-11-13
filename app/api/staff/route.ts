// app/api/staff/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookieUser } from "@/lib/cookieUser";

// ------------------------- GET: List Staff -------------------------
export async function GET(req: NextRequest) {
  const authUser = await cookieUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const page = Number(url.searchParams.get("page") || 1);
  const perPage = Number(url.searchParams.get("perPage") || 10);

  try {
    const where: any = {};
    if (search) where.user = { name: { contains: search, mode: "insensitive" } };

    const total = await prisma.staff.count({
      where: { ...where, user: { schoolId: authUser.schoolId } },
    });

    const staffList = await prisma.staff.findMany({
      where: { ...where, user: { schoolId: authUser.schoolId } },
      skip: (page - 1) * perPage,
      take: perPage,
      include: { user: true, class: true, department: true, subjects: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ staffList, total, page });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
