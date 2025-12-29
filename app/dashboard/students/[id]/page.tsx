"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useStudentStore, StudentDetail } from "@/app/store/useStudentStore.ts";
import { useClassesStore } from "@/app/store/useClassesStore.ts";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";
import { useExamStore, RichExam } from "@/app/store/examsStore";

// Helper to get color based on percentage
const getProgressColor = (percent: number | null) => {
  if (percent === null) return "bg-gray-300";
  if (percent >= 90) return "bg-green-500";
  if (percent >= 70) return "bg-yellow-400";
  if (percent >= 50) return "bg-orange-400";
  return "bg-red-500";
};

export default function StudentProfilePage() {
  const { classId, studentId } = useParams() as {
    classId?: string;
    studentId?: string;
  };

  const {
    studentDetail,
    fetchStudentDetail,
    loading: studentLoading,
  } = useStudentStore();

  const {
    selectedClass,
    fetchClassById,
    grades: classGrades,
    loading: classLoading,
  } = useClassesStore();

  const {
    formData: admissionData,
    fetchAdmission,
    loading: admissionLoading,
  } = useAdmissionStore();

  const { exams: allExams, fetchExams, loading: examsLoading } = useExamStore();

  // Fetch data
  useEffect(() => {
    if (studentId) fetchStudentDetail(studentId);
    if (classId) fetchClassById(classId);
    if (studentId) fetchAdmission(studentId);
    if (studentId) fetchExams({ studentId });
  }, [
    studentId,
    classId,
    fetchStudentDetail,
    fetchClassById,
    fetchAdmission,
    fetchExams,
  ]);

  const loading =
    studentLoading || classLoading || admissionLoading || examsLoading;

  if (loading || !studentDetail) {
    return (
      <div className="flex items-center justify-center h-full text-[--typo]">
        Loading student profile...
      </div>
    );
  }

  const student: StudentDetail = studentDetail;

  const classInfo = selectedClass ?? {
    name: student.className ?? admissionData.className ?? "—",
  };

  const dobRaw = admissionData.dateOfBirth;
  const dob =
    dobRaw instanceof Date ? dobRaw.toLocaleDateString() : dobRaw ?? "—";

  const parents = student.Parent?.length
    ? student.Parent
    : admissionData.familyMembers ?? [];

  // ------------------ Exams / Grades ------------------
  const groupedExams = (allExams ?? []).map((e: RichExam) => ({
    subjectName: e.subjectName ?? "—",
    score: e.score ?? 0,
    maxScore: e.maxScore ?? 0,
  }));

  // Other arrays
  const transactions = student.Transaction ?? [];
  const borrowings = student.Borrow ?? [];
  const purchases = student.Purchase ?? [];
  const attendance = student.StudentAttendance ?? [];

  return (
    <div
      className="min-h-screen px-6 py-10"
      style={{ backgroundColor: "var(--background)", color: "var(--typo)" }}
    >
      <div
        className="max-w-5xl mx-auto rounded-2xl p-8 shadow-xl"
        style={{ backgroundColor: "var(--ford-card)" }}
      >
        {/* Header */}
        <div className="flex items-center gap-6 mb-10">
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold shadow-lg"
            style={{ backgroundColor: "var(--neutral-dark)" }}
          >
            {student.user?.firstName?.[0] ?? student.user?.surname?.[0] ?? "S"}
          </div>
          <div>
            <h1 className="text-3xl font-semibold">
              {student.user?.firstName ?? "—"} {student.user?.surname ?? "—"}
            </h1>
            <p className="opacity-80">{student.user?.email ?? "—"}</p>
            <p className="opacity-80 mt-1">
              Class: <span className="font-medium">{classInfo.name}</span>
            </p>
            <p className="opacity-80 mt-1">
              DOB: <span className="font-medium">{dob}</span>
            </p>
            <p className="opacity-80 mt-1">
              Gender:{" "}
              <span className="font-medium">{admissionData.sex ?? "—"}</span>
            </p>
          </div>
        </div>

        {/* Parents / Guardians */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-3">Parents / Guardians</h2>
          {parents.length > 0 ? (
            <ul className="list-disc list-inside text-gray-700">
              {parents.map((p, idx) => (
                <li key={idx}>
                  {p.name ?? "—"} {p.phone ? `— ${p.phone}` : ""}{" "}
                  {p.email ? `— ${p.email}` : ""}
                </li>
              ))}
            </ul>
          ) : (
            <p className="opacity-70">No parents recorded.</p>
          )}
        </div>

        {/* Attendance */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-3">Attendance Summary</h2>
          {attendance.length > 0 ? (
            <ul className="list-disc list-inside text-gray-700">
              {attendance.map((a, idx) => (
                <li key={idx}>
                  {a.date ?? "—"}: {a.status ?? "—"}
                </li>
              ))}
            </ul>
          ) : (
            <p className="opacity-70">No attendance records.</p>
          )}
        </div>

        {/* Exams / Grades */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-3">Exams / Grades</h2>
          {groupedExams.length > 0 ? (
            <ul className="list-disc list-inside text-gray-700">
              {groupedExams.map((e, idx) => (
                <li key={idx}>
                  {e.subjectName ?? "—"}: {e.score ?? "—"}/{e.maxScore ?? "—"}
                </li>
              ))}
            </ul>
          ) : (
            <p className="opacity-70">No exams recorded.</p>
          )}
        </div>

        {/* Transactions */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-3">Transactions</h2>
          {transactions.length > 0 ? (
            <ul className="list-disc list-inside text-gray-700">
              {transactions.map((t, idx) => (
                <li key={idx}>
                  {t.type ?? "—"} — {t.amount ?? "—"} — {t.description ?? "-"} —{" "}
                  {t.date ? new Date(t.date).toLocaleDateString() : "—"}
                </li>
              ))}
            </ul>
          ) : (
            <p className="opacity-70">No transactions recorded.</p>
          )}
        </div>

        {/* Borrowings */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-3">Borrowed Items</h2>
          {borrowings.length > 0 ? (
            <ul className="list-disc list-inside text-gray-700">
              {borrowings.map((b, idx) => (
                <li key={idx}>
                  {b.item ?? "—"} — {b.dateBorrowed ?? "—"}{" "}
                  {b.dateReturned ? `— Returned: ${b.dateReturned}` : ""}
                </li>
              ))}
            </ul>
          ) : (
            <p className="opacity-70">No borrowed items.</p>
          )}
        </div>

        {/* Purchases */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-3">Purchases</h2>
          {purchases.length > 0 ? (
            <ul className="list-disc list-inside text-gray-700">
              {purchases.map((p, idx) => (
                <li key={idx}>
                  {p.item ?? "—"} — {p.amount ?? "—"} — {p.date ?? "—"}
                </li>
              ))}
            </ul>
          ) : (
            <p className="opacity-70">No purchases recorded.</p>
          )}
        </div>
      </div>
    </div>
  );
}
