// prisma/seed.ts
import { PrismaClient, Role, FinanceType, FeeType, AttendanceStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Helpers
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randPick = <T>(arr: T[]) => arr[randInt(0, arr.length - 1)];
const randomPastDate = () => new Date(Date.now() - randInt(0, 365) * 24 * 60 * 60 * 1000);
const randomScore = (maxScore: number) => Math.floor(Math.random() * (maxScore * 0.5) + maxScore * 0.5);

async function main() {
  // ---------- SCHOOLS ----------
  const schoolsData = [
    { name: "Ford School Limited", domain: "fordschool.com", email: "fordschoolltd@fordschool.com", address: "123 Ford Rd" },
    { name: "Sunrise Academy", domain: "sunriseacademy.com", email: "info@sunriseacademy.com", address: "1 Sunrise Ave" },
    { name: "Greenfield High", domain: "greenfieldhigh.com", email: "contact@greenfieldhigh.com", address: "42 Greenfield St" },
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

  // ---------- ADMIN / PRINCIPAL ACCOUNTS ----------
  for (const school of schools) {
    const admins = [
      { name: "Super Admin", email: `admin@${school.domain}`, role: Role.ADMIN },
      { name: "Principal", email: `principal@${school.domain}`, role: Role.PRINCIPAL },
    ];
    for (const a of admins) {
      const password = await bcrypt.hash("admin123", 10);
      await prisma.user.upsert({
        where: { email: a.email },
        update: {},
        create: { ...a, password, schoolId: school.id },
      });
    }
  }

  // ---------- COMMON SUBJECTS ----------
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

  // ---------- SEED PER SCHOOL ----------
  for (const school of schools) {
    // CLASSES
    const classNames = ["Grade 1", "Grade 2", "Grade 3"];
    const classes = [];
    for (const cname of classNames) {
      const cls = await prisma.class.upsert({
        where: { name_schoolId: { name: cname, schoolId: school.id } },
        update: {},
        create: { name: cname, schoolId: school.id },
      });
      classes.push(cls);

      // Connect subjects
      await prisma.class.update({
        where: { id: cls.id },
        data: { subjects: { connect: subjects.map(s => ({ id: s.id })) } },
      });
    }

    // TEACHERS & STAFF
    const staffUsers = [];
    for (let i = 1; i <= 5; i++) {
      const password = await bcrypt.hash("teacher123", 10);
      const userEmail = `teacher${i}@${school.domain}`;
      const user = await prisma.user.upsert({
        where: { email: userEmail },
        update: {},
        create: {
          name: `Teacher ${i} ${school.name}`,
          email: userEmail,
          password,
          role: Role.TEACHER,
          schoolId: school.id,
        },
      });
      staffUsers.push(user);
    }

    for (const user of staffUsers) {
      const cls = randPick(classes);
      const sub = randPick(subjects);
      await prisma.staff.upsert({
        where: { userId: user.id },
        update: {
          classId: cls.id,
          subjects: { connect: [{ id: sub.id }] },
          position: "Teacher",
          hireDate: randomPastDate(),
          salary: randInt(2000, 5000),
        },
        create: {
          userId: user.id,
          classId: cls.id,
          subjects: { connect: [{ id: sub.id }] },
          position: "Teacher",
          hireDate: randomPastDate(),
          salary: randInt(2000, 5000),
        },
      });
    }

    // STUDENTS & PARENTS
    const students = [];
    for (let i = 1; i <= 20; i++) {
      const password = await bcrypt.hash("student123", 10);
      const studentEmail = `student${i}@${school.domain}`;
      const user = await prisma.user.upsert({
        where: { email: studentEmail },
        update: {},
        create: {
          name: `Student ${i} ${school.name}`,
          email: studentEmail,
          password,
          role: Role.STUDENT,
          schoolId: school.id,
        },
      });

      const cls = randPick(classes);
      const student = await prisma.student.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id, classId: cls.id, enrolledAt: randomPastDate() },
      });

      await prisma.parent.upsert({
        where: { email: `parent${i}@${school.domain}` },
        update: {},
        create: {
          studentId: student.id,
          name: `Parent ${i} ${school.name}`,
          email: `parent${i}@${school.domain}`,
          phone: `555-${randInt(1000, 9999)}`,
        },
      });

      students.push(student);
    }

    // FINANCES
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

    // RESOURCES, PURCHASES, ACTIVITIES, BUSES, LIBRARY, ATTENDANCE, EXAMS
    // ... (similar logic from previous seed but adapted with upserts and school domains)
  }

  console.log("✅ Seed complete with idempotent staff, admin, Ford School included.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
