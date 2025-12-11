// app/(dashboard)/students/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import AddStudentModal from "./components/AddStudentModal";
import {
  useStudentStore,
  StudentListItem,
} from "@/app/store/useStudentStore.ts";

export default function StudentsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const {
    students,
    studentDetail,
    loading,
    errors,
    pagination,
    filters,
    fetchStudents,
    setFilters,
  } = useStudentStore();

  // Debounced fetch
  const loadStudents = useCallback(() => {
    fetchStudents({
      page: pagination.page,
      perPage: pagination.perPage,
      search: filters.search,
    });
  }, [fetchStudents, pagination.page, pagination.perPage, filters.search]);

  // Initial fetch
  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // Handle search input
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    setFilters({ search: value, page: 1 }); // reset to page 1
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full py-10">
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
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Students</h1>
        <AddStudentModal />
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search students..."
          value={search}
          onChange={handleSearch}
          className="border px-3 py-2 rounded w-full sm:w-64"
        />
      </div>

      <table className="min-w-full border-collapse border border-gray-200">
        <thead>
          <tr>
            <th
              className="border px-4 py-2 cursor-pointer"
              onClick={() =>
                setFilters({
                  sortBy: "name",
                  sortOrder: filters.sortOrder === "asc" ? "desc" : "asc",
                })
              }
            >
              Name{" "}
              {filters.sortBy === "name"
                ? filters.sortOrder === "asc"
                  ? "▲"
                  : "▼"
                : ""}
            </th>
            <th
              className="border px-4 py-2 cursor-pointer"
              onClick={() =>
                setFilters({
                  sortBy: "email",
                  sortOrder: filters.sortOrder === "asc" ? "desc" : "asc",
                })
              }
            >
              Email{" "}
              {filters.sortBy === "email"
                ? filters.sortOrder === "asc"
                  ? "▲"
                  : "▼"
                : ""}
            </th>
            <th
              className="border px-4 py-2 cursor-pointer"
              onClick={() =>
                setFilters({
                  sortBy: "className",
                  sortOrder: filters.sortOrder === "asc" ? "desc" : "asc",
                })
              }
            >
              Class{" "}
              {filters.sortBy === "className"
                ? filters.sortOrder === "asc"
                  ? "▲"
                  : "▼"
                : ""}
            </th>
            <th
              className="border px-4 py-2 cursor-pointer"
              onClick={() =>
                setFilters({
                  sortBy: "gradeName",
                  sortOrder: filters.sortOrder === "asc" ? "desc" : "asc",
                })
              }
            >
              Grade{" "}
              {filters.sortBy === "gradeName"
                ? filters.sortOrder === "asc"
                  ? "▲"
                  : "▼"
                : ""}
            </th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 && (
            <tr>
              <td colSpan={4} className="border px-4 py-2 text-center">
                No students found.
              </td>
            </tr>
          )}
          {students.map((student: StudentListItem) => {
            const fullName = student.name || "Unknown";
            return (
              <tr
                key={student.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/students/${student.id}`)}
              >
                <td className="border px-4 py-2">{fullName}</td>
                <td className="border px-4 py-2">{student.email || "-"}</td>
                <td className="border px-4 py-2">{student.className || "-"}</td>
                <td className="border px-4 py-2">{student.gradeName || "-"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => (
            <button
              key={i}
              className={`px-3 py-1 border rounded ${
                pagination.page === i + 1
                  ? "bg-blue-500 text-white"
                  : "bg-white"
              }`}
              onClick={() => setFilters({ page: i + 1 })}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
