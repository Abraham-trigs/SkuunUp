// lib/helpers/admission.ts
// Purpose: Zod schemas for multi-step student admission

import { z } from "zod";

// -------------------- Step 0: User creation --------------------
export const StepSchemas = [
  z.object({
    // ---- Personal Information (authoritative) ----
    firstName: z.string().min(1, "First name is required"),
    surname: z.string().min(1, "Surname is required"),
    otherNames: z.string().optional(),

    // ---- Auth ----
    email: z.string().email("Valid email is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),

    // ---- Step metadata ----
    step: z.literal(0).optional(), // optional because normalized server-side

    // ---- Optional: class selection or other fields for Step 0 ----
    classId: z.string().optional(),
  }),
  // Step 1, Step 2, ... can be added here
] as const;

/*
Design reasoning:
- Step 0 schema now fully matches the Prisma User model
- Optional fields like otherNames and classId allow flexible input
- step property is optional because server normalizes it
- Ensures TypeScript + Prisma type-safety in POST /admissions

Implementation guidance:
- Import StepSchemas in admissions route
- Use StepSchemas[0].parse(body) for validation
- Guarantees all required fields are present for Prisma create()

Scalability insight:
- Adding Step 1+ is as simple as pushing a new Zod schema into the array
- Type-safe, prevents missing required fields
- Optional fields provide backward compatibility with partial forms
*/
