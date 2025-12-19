// app/api/auth/login/route.ts
// Purpose: Authenticate user, set auth cookie, and return Prisma-aligned user payload

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db.ts";
import { signJwt } from "@/lib/jwt.ts";
import { COOKIE_NAME, COOKIE_OPTIONS } from "@/lib/cookies.ts";
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
  surname: string;
  firstName: string;
  otherNames?: string | null;
  email: string;
  role: string;
  schoolId: string;
  school: School;
  department?: string | null;
}

// -------------------- Zod Schemas --------------------
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const authUserSchema = z.object({
  id: z.string(),
  surname: z.string().min(1),
  firstName: z.string().min(1),
  otherNames: z.string().nullable().optional(),
  email: z.string().email(),
  role: z.string(),
  schoolId: z.string(),
  school: z.object({
    id: z.string(),
    name: z.string(),
    domain: z.string(),
  }),
  department: z.string().nullable().optional(),
});

// -------------------- Helpers --------------------
function normalizeAuthUser(input: unknown): AuthUser {
  const parsed = authUserSchema.safeParse(input);
  if (!parsed.success) {
    console.error("Login user validation failed:", parsed.error.format());
    throw new Error("Invalid login user payload");
  }
  return parsed.data;
}

// -------------------- Route --------------------
export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const { email, password } = loginSchema.parse(raw);

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        staff: true,
        school: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // ---- Role & department inference (server authority) ----
    let role = user.role;
    let department: string | null = null;

    if (user.staff?.position) {
      role = inferRoleFromPosition(user.staff.position);
      department = inferDepartmentFromPosition(user.staff.position);
    }

    // ---- JWT ----
    const token = signJwt({
      id: user.id,
      role,
      schoolId: user.schoolId,
    });

    // ---- Prisma-aligned payload ----
    const authUser = normalizeAuthUser({
      id: user.id,
      surname: user.surname,
      firstName: user.firstName,
      otherNames: user.otherNames ?? null,
      email: user.email,
      role,
      schoolId: user.schoolId,
      school: {
        id: user.school.id,
        name: user.school.name,
        domain: user.school.domain,
      },
      department,
    });

    const res = NextResponse.json(
      {
        user: authUser,
        message: "Login successful",
      },
      { status: 200 }
    );

    res.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
    return res;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    console.error("POST /api/auth/login failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// -------------------- Example Usage --------------------
// const res = await fetch("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
// const { user } = await res.json();

// -------------------- Design reasoning --------------------
// Login and session hydration must return the same user contract as /auth/me.
// Prisma is treated as the source of truth; UI-friendly fields are derived later.
// Zod enforces a hard boundary to prevent schema drift into client state.
// JWT payload is minimal and non-sensitive.

// -------------------- Structure --------------------
// POST:
//   - Validate credentials
//   - Authenticate password
//   - Infer role/department
//   - Issue JWT + cookie
//   - Return normalized user
// Helpers:
//   - normalizeAuthUser

// -------------------- Implementation guidance --------------------
// The client can trust login + /auth/me interchangeably.
// Do not add relations here unless they are globally required.
// Any new user fields must be added here AND /auth/me together.

// -------------------- Scalability insight --------------------
// Centralizing user normalization makes multi-client (web/mobile)
// auth behavior consistent and safe as the schema evolves.
