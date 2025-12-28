// app/api/library/staff/route.ts
// Purpose: List and create LibraryStaff scoped to authenticated school with validation and role assignment

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { z } from "zod";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
import bcrypt from "bcryptjs";

// -------------------- Schemas --------------------
const libraryStaffSchema = z.object({
  surname: z.string().min(1, "Surname is required"),
  firstName: z.string().min(1, "First name is required"),
  otherNames: z.string().optional(),
  email: z.string().email("Invalid email address"),
  position: z.string().optional().nullable(),
  // FIXED: Required string to match the Prisma model (LibraryStaff.departmentId)
  departmentId: z.string().min(1, "Department is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// -------------------- Helpers --------------------
function buildUserNameFilter(search: string) {
  return {
    OR: [
      { user: { firstName: { contains: search, mode: "insensitive" } } },
      { user: { surname: { contains: search, mode: "insensitive" } } },
      { user: { otherNames: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ],
  };
}

// -------------------- GET / --------------------
export async function GET(req: NextRequest) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.trim() || "";
    const page = Math.max(Number(url.searchParams.get("page") || 1), 1);
    const perPage = Math.min(Math.max(Number(url.searchParams.get("perPage") || 10), 1), 50);

    const where: any = { schoolId: schoolAccount.schoolId };
    if (search) Object.assign(where, buildUserNameFilter(search));

    const [staffList, total] = await prisma.$transaction([
      prisma.libraryStaff.findMany({
        where,
        include: { user: true, department: true },
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: "desc" },
      }),
      prisma.libraryStaff.count({ where }),
    ]);

    return NextResponse.json({ staffList, total, page, perPage });
  } catch (err: any) {
    console.error("GET /library/staff error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

// -------------------- POST / --------------------
export async function POST(req: NextRequest) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = libraryStaffSchema.parse(body);
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newStaff = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({ where: { email: data.email } });
      if (existingUser) throw new Error("Email exists");

      // FIX: Mapping fields to the correct authoritative name fields in User model
      const newUser = await tx.user.create({
        data: {
          surname: data.surname,
          firstName: data.firstName,
          otherNames: data.otherNames ?? undefined,
          email: data.email,
          password: hashedPassword,
          role: "LIBRARIAN",
          schoolId: schoolAccount.schoolId,
        },
      });

      const newLibraryStaff = await tx.libraryStaff.create({
        data: {
          userId: newUser.id,
          position: data.position ?? "Librarian",
          // FIXED: Zod validation guarantees this is a string, satisfying the model's required field
          departmentId: data.departmentId, 
        },
        include: { user: true, department: true },
      });

      return newLibraryStaff;
    });

    return NextResponse.json(newStaff, { status: 201 });
  } catch (err: any) {
    console.error("POST /library/staff error:", err);
    
    if (err instanceof z.ZodError) {
      // FIXED: Used .issues for 2025 Next.js build compatibility
      return NextResponse.json({ 
        error: { message: "Validation failed", details: err.issues } 
      }, { status: 400 });
    }
    
    const status = err.message === "Email exists" ? 400 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
