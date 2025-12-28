// app/api/users/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
import { z } from "zod";
// FIXED: Import the authoritative Role enum from Prisma
import { Role } from "@prisma/client";

// -------------------- Zod schema for PUT --------------------
const userUpdateSchema = z.object({
  // Use surname and firstName to match your model
  surname: z.string().optional(),
  firstName: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  // FIXED: Use nativeEnum to ensure the type matches Prisma's Role exactly
  role: z.nativeEnum(Role).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const schoolAcc = await SchoolAccount.init();
    if (!schoolAcc) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = params.id;
    const body = await req.json();
    const parsed = userUpdateSchema.parse(body);

    // Perform update restricted to the authenticated school
    await prisma.user.updateMany({
      where: { id, schoolId: schoolAcc.schoolId }, 
      data: parsed,
    });

    const user = await prisma.user.findUnique({    
      where: { id },
      select: { id: true, surname: true, firstName: true, email: true, role: true }
    });

    return NextResponse.json(user);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      // Standardize error handling as done in previous routes
      return NextResponse.json({ error: { message: "Validation failed", details: err.issues } }, { status: 400 });
    }
    return NextResponse.json({ error: { message: err.message || "Internal Server Error" } }, { status: 500 });
  }
}
