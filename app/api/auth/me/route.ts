// app/api/auth/me/route.ts
// Purpose: Return the authenticated user fully aligned with the Prisma User model (authoritative shape)

import { NextResponse } from "next/server";
import { z } from "zod";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
import {
  inferRoleFromPosition,
  inferDepartmentFromPosition,
} from "@/lib/api/constants/roleInference.ts";

// -------------------- Types --------------------
interface School {
  id: string;
  name: string;
  domain: string;
}

interface AuthUser {
  id: string;

  // Prisma-aligned personal info
  surname: string;
  firstName: string;
  otherNames?: string | null;

  email: string;
  role: string;

  schoolId: string;
  school: School;

  // Derived (non-persistent)
  department?: string | null;
}

// -------------------- Zod Schemas --------------------
const schoolSchema = z.object({
  id: z.string(),
  name: z.string(),
  domain: z.string(),
});

const authUserSchema = z.object({
  id: z.string(),
  surname: z.string().min(1),
  firstName: z.string().min(1),
  otherNames: z.string().nullable().optional(),
  email: z.string().email(),
  role: z.string(),
  schoolId: z.string(),
  school: schoolSchema,
  department: z.string().nullable().optional(),
});

// -------------------- Helpers --------------------
function normalizeAuthUser(input: unknown): AuthUser {
  const parsed = authUserSchema.safeParse(input);
  if (!parsed.success) {
    console.error("Auth user validation failed:", parsed.error.format());
    throw new Error("Invalid authenticated user payload");
  }
  return parsed.data;
}

// -------------------- Route --------------------
export async function GET() {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // ---- Role & department inference (derived, never trusted from client) ----
    let role = schoolAccount.role;
    let department: string | null = null;

    if (schoolAccount.staffApplication?.position) {
      role = inferRoleFromPosition(schoolAccount.staffApplication.position);
      department = inferDepartmentFromPosition(
        schoolAccount.staffApplication.position
      );
    }

    // ---- Prisma-aligned response ----
    const user = normalizeAuthUser({
      id: schoolAccount.info.id,
      surname: schoolAccount.info.surname,
      firstName: schoolAccount.info.firstName,
      otherNames: schoolAccount.info.otherNames ?? null,
      email: schoolAccount.info.email,
      role,
      schoolId: schoolAccount.school.id,
      school: schoolAccount.school,
      department,
    });

    return NextResponse.json({ user }, { status: 200 });
  } catch (err) {
    console.error("GET /api/auth/me failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch authenticated user" },
      { status: 500 }
    );
  }
}

// -------------------- Example Usage --------------------
// const res = await fetch("/api/auth/me", { credentials: "include" });
// const { user } = await res.json();

// -------------------- Design reasoning --------------------
// The API now mirrors the Prisma User model exactly, avoiding UI-level abstractions.
// Derived fields (department, inferred role) are explicitly marked as non-persistent.
// Zod validation prevents schema drift from leaking into client state.
// This keeps server authority clear and reduces hidden coupling with the UI.

// -------------------- Structure --------------------
// GET:
//   - Auth check via SchoolAccount
//   - Server-side role/department inference
//   - Prisma-aligned user normalization
// Helpers:
//   - normalizeAuthUser (single validation boundary)

// -------------------- Implementation guidance --------------------
// Use this route as the single source of truth for client auth hydration.
// Client stores should derive display helpers (full name, initials) locally.
// Do not extend this route with relations unless they are required globally.

// -------------------- Scalability insight --------------------
// Permissions, policy flags, or organization roles can be added without breaking clients
// by extending AuthUser and its Zod schema while preserving existing fields.
