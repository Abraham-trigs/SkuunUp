// app/students/page.tsx
// Purpose: Students listing page with search, sorting, pagination, and class/grade assignment modal.

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import AssignClassGradeButton from "./components/AssignClassGradeButton.tsx";
import QueueAwareLoaderButton from "@/app/components/QueueAwareLoaderButton.tsx";
import {
  useStudentStore,
  StudentListItem,
} from "@/app/store/useStudentStore.ts";
import { useClassesStore } from "@/app/store/useClassesStore.ts";
import AdmissionFormModal from "./components/AdmissionFormModal.tsx";

export default function StudentsPage() {
  const router = useRouter();

  const [search, setSearch] = useState("");

  const {
    students,
    loading,
    errors,
    pagination,
    filters,
    fetchStudents,
    fetchStudentDetail,
    fetchStudentAdmission,
    setFilters,
  } = useStudentStore();

  const { classes, fetchClasses } = useClassesStore();

  const loadStudents = useCallback(() => {
    fetchStudents({
      page: filters.page,
      search: filters.search,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      classId: filters.classId,
      gradeId: filters.gradeId,
    });
  }, [
    fetchStudents,
    filters.page,
    filters.search,
    filters.sortBy,
    filters.sortOrder,
    filters.classId,
    filters.gradeId,
  ]);

  useEffect(() => {
    loadStudents();
    fetchClasses();
  }, [loadStudents, fetchClasses]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    setFilters({ search: value, page: 1 });
  };

  const handleRowClick = async (student: StudentListItem) => {
    await fetchStudentDetail(student.id);
    if (student.admissionId) await fetchStudentAdmission(student.admissionId);
    router.push(`/students/${student.id}`);
  };

  const handleSort = (key: keyof StudentListItem) => {
    const sortOrder =
      filters.sortBy === key && filters.sortOrder === "asc" ? "desc" : "asc";
    setFilters({ sortBy: key, sortOrder, page: 1 });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (Object.keys(errors).length > 0) {
    return (
      <div className="text-red-600 p-4">
        {Object.values(errors)
          .flat()
          .map((err, idx) => (
            <p key={idx}>{err}</p>
          ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 mt-7">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Students</h1>
        <AdmissionFormModal onStudentAdded={loadStudents} />
      </div>

      <div className="relative w-full sm:w-64">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {/* Search Icon using Light Blue */}
          <svg
            className="h-4 w-4"
            style={{ color: "#BFCDEF", opacity: 0.6 }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search students..."
          value={search}
          onChange={handleSearch}
          style={{
            backgroundColor: "#1c376e", // Deep Blue
            borderColor: "#BFCDEF33", // Light Blue with opacity for subtle border
            color: "#BFCDEF", // Light Blue text
          }}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#6BE8EF] focus:border-transparent transition-all placeholder:text-[#BFCDEF]/30 text-sm"
        />
      </div>

      <div className="flex justify-between items-center mt-6 mb-4 px-2 border-b border-[#1c376e] pb-3">
        <div className="flex items-center gap-3">
          {/* Branded Accent Pillar */}
          <div
            className="w-1 h-6 rounded-full"
            style={{ backgroundColor: "#6BE8EF" }}
          />
          <h2
            style={{ color: "#BFCDEF" }}
            className="text-lg font-black uppercase tracking-widest"
          >
            Class & Grade Assignment
          </h2>
        </div>

        {/* Optional: Status indicator or total count badge */}
        <span
          style={{ backgroundColor: "#1c376e", color: "#6BE8EF" }}
          className="text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter border border-[#6BE8EF]/20"
        >
          Active Roster
        </span>
      </div>

      <div
        style={{ backgroundColor: "#03102b", borderColor: "#1c376e" }}
        className="border rounded-xl overflow-hidden shadow-2xl mt-4"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr
                style={{ backgroundColor: "#1c376e" }}
                className="text-[#BFCDEF] uppercase text-xs tracking-wider"
              >
                {["name", "email"].map((key) => (
                  <th
                    key={key}
                    className="px-6 py-3 cursor-pointer group hover:bg-white/5 transition-colors"
                    onClick={() => handleSort(key as keyof StudentListItem)}
                  >
                    <div className="flex items-center gap-2">
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                      <span className="opacity-40 group-hover:opacity-100 transition-opacity">
                        {filters.sortBy === key
                          ? filters.sortOrder === "asc"
                            ? "▲"
                            : "▼"
                          : "↕"}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="px-6 py-3 text-right">Assign Class & Grade</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5 text-white">
              {students.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center opacity-60">
                    No students found matching your criteria.
                  </td>
                </tr>
              )}

              {students.map((s) => (
                <tr
                  key={s.id}
                  className="group hover:bg-white/5 transition-colors"
                >
                  <td
                    className="px-6 py-4 font-medium text-[#6BE8EF] cursor-pointer"
                    onClick={() => handleRowClick(s)}
                  >
                    {s.name ?? "Unknown"}
                  </td>
                  <td
                    className="px-6 py-4 opacity-80 cursor-pointer"
                    onClick={() => handleRowClick(s)}
                  >
                    {s.email ?? "-"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {/* Sleek, branded Assign Button */}
                    <QueueAwareLoaderButton
                      action={() =>
                        AssignClassGradeButton({
                          studentId: s.id,
                          currentClassId: s.classId,
                          currentGradeId: s.gradeId,
                          onAssigned: loadStudents,
                        })
                      }
                      buttonText="Assign"
                      className="px-4 py-1.5 rounded-lg text-sm font-bold shadow-md hover:scale-105 transition-transform"
                      style={{
                        backgroundColor: "#6BE8EF", // Cyan
                        color: "#03102b", // Navy
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center gap-2">
          {/* Page Numbers Container */}
          <div
            style={{ backgroundColor: "#1c376e33" }}
            className="flex items-center gap-1.5 p-1.5 rounded-2xl border border-[#1c376e]"
          >
            {Array.from({ length: pagination.totalPages }, (_, i) => {
              const isActive = pagination.page === i + 1;
              return (
                <button
                  key={i}
                  onClick={() => setFilters({ page: i + 1 })}
                  style={{
                    backgroundColor: isActive ? "#6BE8EF" : "transparent",
                    color: isActive ? "#03102b" : "#BFCDEF",
                    borderColor: isActive ? "#6BE8EF" : "transparent",
                  }}
                  className={`
              min-w-[40px] h-10 rounded-xl text-sm font-black transition-all duration-200
              ${
                isActive
                  ? "shadow-lg shadow-[#6BE8EF]/20 scale-105"
                  : "hover:bg-white/5 hover:text-white"
              }
            `}
                >
                  {String(i + 1).padStart(2, "0")}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/*
Design reasoning:
- Added QueueAwareLoaderButton for async class/grade assignment.
- No other logic or layout changes were made.

Structure:
- Same table, headers, pagination, and modals.
- Only assignment button is now queue-aware.

Implementation guidance:
- Wrap this page in AsyncActionQueueProvider at root/layout level.
- QueueAwareLoaderButton handles loader, debounce, and notifications automatically.

Scalability insight:
- This pattern supports multiple simultaneous assignments without UI conflict.
- Minimal code change ensures maintainability.
*/
