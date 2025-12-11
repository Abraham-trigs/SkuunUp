// app/_test/students.api.test.ts
import { GET } from "@/app/api/students/route";
import { prisma } from "@/lib/db";
import { SchoolAccount } from "@/lib/schoolAccount";

// Mock SchoolAccount
jest.mock("@/lib/schoolAccount", () => ({
  SchoolAccount: {
    init: jest.fn().mockResolvedValue({ schoolId: "school-1" }),
  },
}));

// Mock Prisma
jest.mock("@/lib/db", () => ({
  prisma: {
    student: {
      count: jest.fn().mockResolvedValue(2),
      findMany: jest.fn().mockResolvedValue([
        {
          id: "s1",
          userId: "u1",
          user: { firstName: "John", surname: "Doe", otherNames: null, email: "john@example.com" },
          Class: { id: "c1", name: "Class 1" },
          Grade: { id: "g1", name: "Grade A" },
          application: null,
        },
        {
          id: "s2",
          userId: "u2",
          user: { firstName: "Jane", surname: "Smith", otherNames: null, email: "jane@example.com" },
          Class: { id: "c2", name: "Class 2" },
          Grade: { id: "g2", name: "Grade B" },
          application: null,
        },
      ]),
    },
  },
}));

// Mock NextRequest shape
const mockReq = {
  nextUrl: {
    searchParams: new URLSearchParams({ page: "1", perPage: "20" }),
  },
} as any;

describe("GET /api/students", () => {
  it("returns a list of students", async () => {
    const res = await GET(mockReq);
    const json = await res.json();
    expect(json.students.length).toBe(2);
    expect(json.students[0].name).toBe("John Doe");
  });
});
