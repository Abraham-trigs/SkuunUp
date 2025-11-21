// prisma/seed.ts
import {
  PrismaClient,
  Role,
  FinanceType,
  FeeType,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Helpers
const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const randPick = <T>(arr: T[]) => arr[randInt(0, arr.length - 1)];
const randomPastDate = () =>
  new Date(Date.now() - randInt(0, 365) * 24 * 60 * 60 * 1000);

// Ghana School Classes
const GHANA_CLASSES = [
   { name: "Nursery 1", grade: "N1" },
  { name: "Nursery 2", grade: "N2" },

  // KG
  { name: "KG 1", grade: "KG1" },
  { name: "KG 2", grade: "KG2" },

  // Primary (Basic School)
  { name: "Basic 1", grade: "B1" },
  { name: "Basic 2", grade: "B2" },
  { name: "Basic 3", grade: "B3" },
  { name: "Basic 4", grade: "B4" },
  { name: "Basic 5", grade: "B5" },
  { name: "Basic 6", grade: "B6" },

  // JHS
  { name: "JHS 1", grade: "JHS1" },
  { name: "JHS 2", grade: "JHS2" },
  { name: "JHS 3", grade: "JHS3" },

  // SHS
  { name: "SHS 1", grade: "SHS1" },
  { name: "SHS 2", grade: "SHS2" },
  { name: "SHS 3", grade: "SHS3" },
];

async function main() {
  // ---------- SCHOOLS ----------
  const schoolsData = [
    {
      name: "Ford School Limited",
      domain: "fordschool.com",
      email: "fordschoolltd@fordschool.com",
      address: "123 Ford Rd",
    },
    {
      name: "Sunrise Academy",
      domain: "sunriseacademy.com",
      email: "info@sunriseacademy.com",
      address: "1 Sunrise Ave",
    },
    {
      name: "Greenfield High",
      domain: "greenfieldhigh.com",
      email: "contact@greenfieldhigh.com",
      address: "42 Greenfield St",
    },
  ];

  const schools = [];
  for (const s of schoolsData) {
    const school = await prisma.school.upsert({
      where: { name: s.name },
      update: {},
      create: s,
    });
    schools.push(school);
  }

  // ---------- ADMIN / PRINCIPAL ----------
  for (const school of schools) {
    const adminUsers = [
      { name: "Super Admin", email: `admin@${school.domain}`, role: Role.ADMIN },
      { name: "Principal", email: `principal@${school.domain}`, role: Role.PRINCIPAL },
    ];

    for (const a of adminUsers) {
      const password = await bcrypt.hash("admin123", 10);
      await prisma.user.upsert({
        where: { email: a.email },
        update: {},
        create: {
          ...a,
          password,
          schoolId: school.id,
        },
      });
    }
  }

  // ---------- SUBJECTS ----------
  const subjectsData = [
    { name: "Mathematics", code: "MATH101" },
    { name: "English", code: "ENG101" },
    { name: "Science", code: "SCI101" },
    { name: "History", code: "HIS101" },
    { name: "Geography", code: "GEO101" },
  ];

  const subjects = [];
  for (const s of subjectsData) {
    const sub = await prisma.subject.upsert({
      where: { name: s.name },
      update: {},
      create: s,
    });
    subjects.push(sub);
  }

  // ---------- PER SCHOOL SEEDING ----------
  for (const school of schools) {
    // ---------- CLASSES ----------
    const classes = [];

    for (const cls of GHANA_CLASSES) {
      const created = await prisma.class.upsert({
        where: {
          name_schoolId: { name: cls.name, schoolId: school.id },
        },
        update: {},
        create: {
          name: cls.name,
          grade: cls.grade,
          schoolId: school.id,
        },
      });
      classes.push(created);

      // Attach subjects
      await prisma.class.update({
        where: { id: created.id },
        data: {
          subjects: { connect: subjects.map((s) => ({ id: s.id })) },
        },
      });
    }

    // ---------- STAFF ----------
    const staffUsers = [];

    for (let i = 1; i <= 5; i++) {
      const password = await bcrypt.hash("teacher123", 10);
      const email = `teacher${i}@${school.domain}`;

      const teacherUser = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          name: `Teacher ${i} ${school.name}`,
          email,
          password,
          role: Role.TEACHER,
          schoolId: school.id,
        },
      });

      staffUsers.push(teacherUser);
    }

    for (const user of staffUsers) {
      const cls = randPick(classes);
      const sub = randPick(subjects);

      await prisma.staff.upsert({
        where: { userId: user.id },
        update: {
          classId: cls.id,
          hireDate: randomPastDate(),
          salary: randInt(2000, 5000),
          subjects: { connect: [{ id: sub.id }] },
        },
        create: {
          userId: user.id,
          classId: cls.id,
          position: "Teacher",
          hireDate: randomPastDate(),
          salary: randInt(2000, 5000),
          subjects: { connect: [{ id: sub.id }] },
        },
      });
    }

    // ---------- STUDENTS & PARENTS ----------
    const students = [];

    for (let i = 1; i <= 20; i++) {
      const email = `student${i}@${school.domain}`;
      const password = await bcrypt.hash("student123", 10);

      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          name: `Student ${i} ${school.name}`,
          email,
          password,
          role: Role.STUDENT,
          schoolId: school.id,
        },
      });

      const cls = randPick(classes);

      // ✅ Fix: provide `user` and `school` relations for student
      const student = await prisma.student.upsert({
        where: { userId: user.id },
        update: {
          classId: cls.id,
          enrolledAt: randomPastDate(),
          user: { connect: { id: user.id } },
          school: { connect: { id: school.id } },
        },
        create: {
          user: { connect: { id: user.id } },
          school: { connect: { id: school.id } },
          classId: cls.id,
          enrolledAt: randomPastDate(),
        },
      });

      students.push(student);

      await prisma.parent.upsert({
        where: { email: `parent${i}@${school.domain}` },
        update: {},
        create: {
          name: `Parent ${i} ${school.name}`,
          email: `parent${i}@${school.domain}`,
          phone: `055${randInt(1000000, 9999999)}`,
          studentId: student.id,
        },
      });
    }

    // ---------- FINANCES ----------
    for (const student of students) {
      await prisma.transaction.create({
        data: {
          studentId: student.id,
          type: FinanceType.INCOME,
          feeType: FeeType.TUITION,
          amount: 500 + randInt(0, 500),
          description: "Tuition payment",
          date: randomPastDate(),
        },
      });
    }

    await prisma.finance.create({
      data: {
        schoolId: school.id,
        type: FinanceType.EXPENSE,
        amount: 2000,
        description: "School maintenance",
        date: randomPastDate(),
      },
    });
  }

  console.log("✅ Seed complete with Ghana class system, students, staff, and upserts.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
