// app/_test/__tests__/check.route.test.ts
// Purpose: Unit tests for /api/check route
// This test file ensures all check types, validation, authorization, and error handling
// work as expected without hitting the real database or Redis, using Jest mocks.

import { POST } from "@/app/api/check/route.ts";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db.ts";
import bcrypt from "bcryptjs";

// ------------------ Mock Prisma ------------------
// Mock all Prisma client methods used by the route to prevent real DB calls
jest.mock("@/lib/db", () => ({
  prisma: {
    user: { findFirst: jest.fn() },
    staff: { findFirst: jest.fn() },
    student: { findFirst: jest.fn() },
    parent: { findFirst: jest.fn() },
    application: { findFirst: jest.fn() },
    transaction: { findMany: jest.fn() },
    exam: { findMany: jest.fn() },
    resource: { findFirst: jest.fn() },
  },
}));

// ------------------ Mock Redis ------------------
// Mock Upstash Redis client to avoid real cache calls
jest.mock("@upstash/redis", () => {
  return {
    Redis: jest.fn().mockImplementation(() => ({
      get: jest.fn(),
      set: jest.fn(),
    })),
  };
});

// ------------------ Mock SchoolAccount ------------------
// Mock authentication/authorization to simulate a valid school context
jest.mock("@/lib/schoolAccount", () => ({
  SchoolAccount: {
    init: jest.fn().mockResolvedValue({ schoolId: "school-1" }),
  },
}));

// ------------------ Test Suite ------------------
describe("POST /api/check", () => {
  // Clear mocks before each test to avoid interference
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ------------------ Full Batch Success ------------------
  it("should handle all check types successfully", async () => {
    // ------------------ Mock Prisma Responses ------------------
    (prisma.user.findFirst as jest.Mock).mockResolvedValue({
      email: "user@test.com",
      password: await bcrypt.hash("password", 10),
    });

    (prisma.staff.findFirst as jest.Mock).mockResolvedValue({
      user: { password: await bcrypt.hash("password", 10) },
    });

    (prisma.student.findFirst as jest.Mock).mockResolvedValue({
      classId: "class-1",
      gradeId: "grade-1",
    });

    (prisma.parent.findFirst as jest.Mock).mockResolvedValue({});

    (prisma.application.findFirst as jest.Mock).mockResolvedValue({
      status: "pending",
      progress: 50,
    });

    (prisma.transaction.findMany as jest.Mock).mockResolvedValue([
      { type: "fee", feeType: "tuition", amount: 100, date: new Date() },
    ]);

    (prisma.exam.findMany as jest.Mock).mockResolvedValue([
      { title: "Math", score: 80, maxScore: 100, date: new Date() },
    ]);

    (prisma.resource.findFirst as jest.Mock).mockResolvedValue({
      name: "Laptop",
      quantity: 10,
      available: 5,
    });

    // ------------------ Fake Request ------------------
    // Mimics a request payload with all check types
    const req = {
      json: async () => [
        { type: "USER_PASSWORD", payload: { email: "user@test.com", password: "password" } },
        { type: "STAFF_PASSWORD", payload: { email: "staff@test.com", password: "password" } },
        { type: "USER_EMAIL", payload: { email: "user@test.com" } },
        { type: "STAFF_EMAIL", payload: { email: "staff@test.com" } },
        { type: "STUDENT_ENROLLMENT", payload: { studentId: "student-1" } },
        { type: "PARENT_EMAIL", payload: { email: "parent@test.com" } },
        { type: "APPLICATION_STATUS", payload: { applicationId: "app-1" } },
        { type: "TRANSACTION_STATUS", payload: { studentId: "student-1" } },
        { type: "EXAM_SCORES", payload: { studentId: "student-1" } },
        { type: "RESOURCE_AVAILABILITY", payload: { resourceId: "res-1" } },
      ],
    } as Partial<NextRequest>;

    const res = await POST(req as NextRequest);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.results.length).toBe(10);

    // Verify key results for sanity
    expect(json.results[0].data.valid).toBe(true);   // user password
    expect(json.results[1].data.valid).toBe(true);   // staff password
    expect(json.results[2].data.exists).toBe(true);  // user email
    expect(json.results[4].data.classId).toBe("class-1"); // student enrollment
    expect(json.results[9].data.resource.name).toBe("Laptop"); // resource
  });

  // ------------------ Invalid Payload ------------------
  it("should return 400 on invalid payload", async () => {
    const req = {
      json: async () => [{ type: "INVALID_TYPE", payload: {} }],
    } as Partial<NextRequest>;

    const res = await POST(req as NextRequest);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe("Invalid request payload");
  });

  // ------------------ Unauthorized ------------------
  it("should return 401 if SchoolAccount not found", async () => {
    const { SchoolAccount } = require("@/lib/schoolAccount");
    (SchoolAccount.init as jest.Mock).mockResolvedValue(null);

    const req = { json: async () => [] } as Partial<NextRequest>;
    const res = await POST(req as NextRequest);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  // ------------------ Server Error ------------------
  it("should handle server errors gracefully", async () => {
    const req = { json: async () => { throw new Error("Boom"); } } as Partial<NextRequest>;
    const res = await POST(req as NextRequest);
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.error).toBe("Server error");
  });
});
