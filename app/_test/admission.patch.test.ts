// app/_test/admission.patch.test.ts
import { PATCH } from "@/app/api/admissions/[id]/route.ts";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { SchoolAccount } from "@/lib/schoolAccount.ts";

// ------------------ Mocking Helpers ------------------
jest.mock("@/lib/db", () => ({
  prisma: {
    $transaction: jest.fn(),
    application: { update: jest.fn(), findUnique: jest.fn() },
    previousSchool: { deleteMany: jest.fn(), createMany: jest.fn() },
    familyMember: { deleteMany: jest.fn(), createMany: jest.fn() },
  },
}));

jest.mock("@/lib/schoolAccount", () => ({
  SchoolAccount: { init: jest.fn() },
}));

function mockRequest(body: any): NextRequest {
  return { json: async () => body, headers: new Map() } as any;
}

describe("PATCH /api/admission/[id]", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 400 if application id is missing", async () => {
    const res = await PATCH(mockRequest({ step: 0 }), { params: { id: "" } });
    expect(res.status).toBe(400);
  });

  it("returns 400 if step index is invalid", async () => {
    const res = await PATCH(mockRequest({ step: 999 }), { params: { id: "abc" } });
    expect(res.status).toBe(400);
  });

  it("returns 400 if Zod validation fails (step 0)", async () => {
    (SchoolAccount.init as jest.Mock).mockResolvedValue({ id: "school-1" });
    const res = await PATCH(
      mockRequest({
        step: 0,
        surname: "",
        firstName: "",
        email: "invalid-email",
        password: "",
      }),
      { params: { id: "app-1" } }
    );

    const json = await res.json();
    expect(res.status).toBe(400);
    expect(Array.isArray(json.error)).toBe(true);
    expect(json.error.length).toBeGreaterThan(0);
  });

  it("returns 500 if unauthorized", async () => {
    (SchoolAccount.init as jest.Mock).mockResolvedValue(null);
    const res = await PATCH(mockRequest({ step: 0, surname: "A", firstName: "B", email: "a@b.com", password: "123" }), { params: { id: "app-1" } });
    const json = await res.json();
    expect(res.status).toBe(500);
    expect(json.error).toBe("Unauthorized");
  });

  it("updates application successfully (step 1)", async () => {
    (SchoolAccount.init as jest.Mock).mockResolvedValue({ id: "school-1" });
    (prisma.$transaction as jest.Mock).mockImplementation(async (cb) =>
      cb({
        application: { update: jest.fn().mockResolvedValue({ id: "app-1" }), findUnique: jest.fn().mockResolvedValue({}) },
        previousSchool: { deleteMany: jest.fn(), createMany: jest.fn() },
        familyMember: { deleteMany: jest.fn(), createMany: jest.fn() },
      })
    );

    const res = await PATCH(
      mockRequest({ step: 1, dateOfBirth: "2000-01-01", nationality: "Test", sex: "M" }),
      { params: { id: "app-1" } }
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it("syncs nested arrays correctly (step 6)", async () => {
    (SchoolAccount.init as jest.Mock).mockResolvedValue({ id: "school-1" });

    const prevSchools = [{ name: "PS1", location: "Loc1", startDate: "2010-01-01", endDate: "2012-01-01" }];
    const familyMembers = [{ relation: "Father", name: "John", postalAddress: "Addr", residentialAddress: "Addr" }];

    const txMock = {
      application: { update: jest.fn().mockResolvedValue({ id: "app-1" }), findUnique: jest.fn().mockResolvedValue({}) },
      previousSchool: { deleteMany: jest.fn(), createMany: jest.fn() },
      familyMember: { deleteMany: jest.fn(), createMany: jest.fn() },
    };

    (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => cb(txMock));

    const res = await PATCH(
      mockRequest({ step: 6, previousSchools: prevSchools, familyMembers }),
      { params: { id: "app-1" } }
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);

    // Convert strings to Date objects as the route does
    const prevSchoolsWithDate = prevSchools.map((s) => ({
      ...s,
      startDate: new Date(s.startDate),
      endDate: new Date(s.endDate),
      applicationId: "app-1",
    }));

    expect(txMock.previousSchool.deleteMany).toHaveBeenCalled();
    expect(txMock.previousSchool.createMany).toHaveBeenCalledWith({ data: prevSchoolsWithDate });
    expect(txMock.familyMember.deleteMany).toHaveBeenCalled();
    expect(txMock.familyMember.createMany).toHaveBeenCalledWith({
      data: familyMembers.map((f) => ({ ...f, applicationId: "app-1" })),
    });
  });
});
