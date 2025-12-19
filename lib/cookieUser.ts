// lib/cookieUser.ts

import { cookies } from "next/headers";
import { prisma } from "@/lib/db.ts";
import { Role } from "@prisma/client";
import { verifyJwt } from "@/lib/jwt.ts";
import { COOKIE_NAME } from "@/lib/cookies.ts";

/** TypeScript interface updated for the new User model */
export interface CookieUser {
  id: string;
  surname: string;      // Added
  firstName: string;    // Added
  otherNames: string | null; // Added
  email: string;
  role: Role;
  school: {
    id: string;
    name: string;
    domain: string;
  };
  Application?: any;
  staffApplication?: any;
}

const userCache = new Map<string, { user: CookieUser; timestamp: number }>();
const CACHE_TTL = 5000;

export async function cookieUser(): Promise<CookieUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifyJwt(token);
    if (!payload?.id) return null;

    const cached = userCache.get(payload.id);
    const now = Date.now();
    if (cached && now - cached.timestamp < CACHE_TTL) return cached.user;

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: {
        school: true,
      },
    });
    
    if (!user) return null;

    let Application = null;
    let staffApplication = null;

    if (user.role === Role.STUDENT) {
      Application = await prisma.application.findFirst({
        where: { userId: payload.id, schoolId: user.school.id }, // Updated relation name to userId if mapped in Prisma
        include: { previousSchools: true, familyMembers: true },
      });
    }

    const staffRoles: Role[] = [
      Role.ADMIN, Role.MODERATOR, Role.PRINCIPAL, Role.VICE_PRINCIPAL,
      Role.TEACHER, Role.ASSISTANT_TEACHER, Role.COUNSELOR, Role.LIBRARIAN,
      Role.EXAM_OFFICER, Role.FINANCE, Role.HR, Role.RECEPTIONIST,
      Role.IT_SUPPORT, Role.TRANSPORT, Role.NURSE, Role.COOK, Role.CLEANER,
      Role.SECURITY, Role.MAINTENANCE,
    ];

    if (staffRoles.includes(user.role)) {
      staffApplication = await prisma.staffApplication.findFirst({
        where: { staffId: payload.id, schoolId: user.school.id },
        include: { previousJobs: true, subjects: true },
      });
    }

    const consolidatedUser: CookieUser = {
      id: user.id,
      surname: user.surname,       // Mapped from Prisma
      firstName: user.firstName,   // Mapped from Prisma
      otherNames: user.otherNames, // Mapped from Prisma
      email: user.email,
      role: user.role,
      school: {
        id: user.school.id,
        name: user.school.name,
        domain: user.school.domain,
      },
      Application,
      staffApplication,
    };

    userCache.set(payload.id, { user: consolidatedUser, timestamp: now });

    return consolidatedUser;
  } catch (err) {
    console.error("cookieUser() error:", err);
    return null;
  }
}
