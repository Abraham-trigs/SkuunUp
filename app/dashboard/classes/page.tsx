// app/classes/ClassesPage.tsx
// Purpose: Production-ready Classes page with table, modals, charts, pagination, search, and fully integrated CRUD with store and UX-safe modals.

"use client";

import React, { useEffect, useState } from "react";
import { useClassesStore } from "@/app/store/useClassesStore.ts";
import AddClassModal from "./components/AddClassModal.tsx";
import EditClassModal from "./components/EditClassModal.tsx";
import DeleteClassModal from "./components/DeleteClassModal.tsx";
import StudentsModal from "./components/StudentsModal.tsx";
import StudentsPerClassChart from "./components/StudentsPerClassChart.tsx";
import SkuunAiChat from "../SkuunAi/components/SkuunAiChat.tsx";

// -------------------------
// Types
// -------------------------
interface ClassTableRow {
  id: string;
  name: string;
  students?: any[];
}

// -------------------------
// Component
// -------------------------
export default function ClassesPage() {
  const {
    classes,
    loading,
    total,
    page,
    perPage,
    fetchClasses,
    selectedClass,
    setSort,
    sortBy,
    sortOrder,
    setSearch,
    fetchClassById,
    selectClass,
    clearSelectedClass,
  } = useClassesStore();

  // -------------------------
  // Local UI States
  // -------------------------
  const [localSearch, setLocalSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [studentsOpen, setStudentsOpen] = useState(false);
  const [currentClass, setCurrentClass] = useState<ClassTableRow | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // -------------------------
  // Fetch initial data on mount
  // -------------------------
  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // -------------------------
  // Debounced search
  // -------------------------
  useEffect(() => {
    const handler = setTimeout(() => setSearch(localSearch), 300);
    return () => clearTimeout(handler);
  }, [localSearch, setSearch]);

  // -------------------------
  // Toggle sorting
  // -------------------------
  const toggleSort = (key: "name" | "studentCount") => {
    const order = sortBy === key && sortOrder === "asc" ? "desc" : "asc";
    setSort(key, order);
  };

  const totalPages = Math.ceil(total / perPage);

  // -------------------------
  // Modal handlers
  // -------------------------
  const openEditModal = async (cls: ClassTableRow) => {
    selectClass(cls); // populate store immediately
    setEditOpen(true); // open modal
    await fetchClassById(cls.id); // refresh relational data for modal
  };

  const openDeleteModal = (cls: ClassTableRow) => {
    setDeleteTargetId(cls.id);
    selectClass(cls);
    setDeleteOpen(true);
  };

  const openStudentsModal = async (cls: ClassTableRow) => {
    selectClass(cls);
    setCurrentClass(cls);
    setStudentsOpen(true);
    await fetchClassById(cls.id);
  };

  // -------------------------
  // Table row render
  // -------------------------
  const renderRows = () =>
    classes.map((cls) => (
      <tr key={cls.id} className="border-b hover:bg-gray-50">
        <td className="px-4 py-2">{cls.name}</td>
        <td className="px-4 py-2">{cls.students?.length || 0}</td>
        <td className="px-4 py-2 flex gap-2">
          <button
            onClick={() => openEditModal(cls)}
            className="px-2 py-1 rounded bg-yellow-400 text-white hover:bg-yellow-500"
          >
            Edit
          </button>
          <button
            onClick={() => openDeleteModal(cls)}
            className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
          >
            Delete
          </button>
          <button
            onClick={() => openStudentsModal(cls)}
            className="px-3 py-1 bg-ford-primary text-white rounded hover:bg-ford-secondary"
          >
            Students
          </button>
        </td>
      </tr>
    ));

  return (
    <div className="p-6 space-y-6 mt-7 ml-5 mr-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-2">
        {/* Left Side: Title & Context */}
        <div className="space-y-1">
          <h1
            style={{ color: "#BFCDEF" }}
            className="text-3xl font-black tracking-tight sm:text-4xl"
          >
            CLASSES
          </h1>
          <div className="flex items-center gap-2">
            <span
              className="h-1 w-8 rounded-full"
              style={{ backgroundColor: "#6BE8EF" }}
            />
            <p
              style={{ color: "#BFCDEF" }}
              className="text-xs uppercase tracking-[0.2em] opacity-60 font-bold"
            >
              Academic Management
            </p>
          </div>
        </div>

        {/* Right Side: Search & Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {/* Sleek Search Input */}
          <div className="relative w-full sm:w-72 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-4 w-4 transition-colors group-focus-within:text-[#6BE8EF]"
                style={{ color: "#BFCDEF", opacity: 0.5 }}
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
              placeholder="Search directory..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              style={{
                backgroundColor: "#1c376e",
                borderColor: "#BFCDEF33",
                color: "#BFCDEF",
              }}
              className="block w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#6BE8EF] focus:border-transparent transition-all placeholder:text-[#BFCDEF]/30 text-sm"
            />
          </div>

          {/* Primary Action Button */}
          <button
            onClick={() => setAddOpen(true)}
            style={{
              backgroundColor: "#6BE8EF",
              color: "#03102b",
            }}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 rounded-xl font-black uppercase text-xs tracking-widest hover:scale-[1.03] active:scale-95 transition-all shadow-lg shadow-[#6BE8EF]/20"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Class
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <div className="w-8 h-8 border-4 border-[#6BE8EF] border-t-transparent rounded-full animate-spin" />
          <p
            style={{ color: "#BFCDEF" }}
            className="text-sm font-medium animate-pulse"
          >
            Synchronizing academic data...
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Sleek Table Container */}
          <div
            style={{ backgroundColor: "#03102b", borderColor: "#1c376e" }}
            className="border rounded-2xl overflow-hidden shadow-2xl transition-all"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ backgroundColor: "#1c376e" }}>
                    <th
                      className="px-6 py-4 cursor-pointer group"
                      onClick={() => toggleSort("name")}
                    >
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#BFCDEF]">
                        Class Name
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#6BE8EF]">
                          {sortBy === "name"
                            ? sortOrder === "asc"
                              ? "↑"
                              : "↓"
                            : "↕"}
                        </span>
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 cursor-pointer group"
                      onClick={() => toggleSort("studentCount")}
                    >
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#BFCDEF]">
                        Students
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#6BE8EF]">
                          {sortBy === "studentCount"
                            ? sortOrder === "asc"
                              ? "↑"
                              : "↓"
                            : "↕"}
                        </span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-[#BFCDEF]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {renderRows()}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modern Pagination Bar */}
          <div className="flex items-center justify-between px-2">
            <p
              style={{ color: "#BFCDEF" }}
              className="text-xs font-medium opacity-50"
            >
              Showing {classes.length} of {total} results
            </p>

            <div className="flex items-center gap-1 bg-[#1c376e]/50 p-1 rounded-xl border border-[#BFCDEF]/10">
              <button
                disabled={page === 1}
                onClick={() => fetchClasses(page - 1)}
                className="p-2 rounded-lg hover:bg-[#6BE8EF] hover:text-[#03102b] disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-inherit transition-all"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <div
                style={{ backgroundColor: "#03102b", color: "#6BE8EF" }}
                className="px-4 py-1.5 rounded-lg text-sm font-bold border border-[#6BE8EF]/20"
              >
                {page} <span className="opacity-40 px-1 text-white">/</span>{" "}
                {totalPages}
              </div>

              <button
                disabled={page === totalPages || totalPages === 0}
                onClick={() => fetchClasses(page + 1)}
                className="p-2 rounded-lg hover:bg-[#6BE8EF] hover:text-[#03102b] disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-inherit transition-all"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {addOpen && (
        <AddClassModal
          isOpen={addOpen}
          onClose={() => setAddOpen(false)}
          onSuccess={() => fetchClasses(page)}
        />
      )}
      {editOpen && selectedClass && (
        <EditClassModal
          isOpen={editOpen}
          onClose={() => {
            setEditOpen(false);
            clearSelectedClass?.();
          }}
          onSuccess={() => fetchClasses(page)}
        />
      )}
      {deleteOpen && deleteTargetId && selectedClass && (
        <DeleteClassModal
          id={deleteTargetId}
          isOpen={deleteOpen}
          onClose={() => {
            setDeleteOpen(false);
            clearSelectedClass?.();
            setDeleteTargetId(null);
          }}
          onSuccess={() => fetchClasses(page)}
        />
      )}
      {studentsOpen && currentClass && selectedClass && (
        <StudentsModal
          classId={currentClass.id}
          className={currentClass.name}
          isOpen={studentsOpen}
          onClose={() => {
            setStudentsOpen(false);
            clearSelectedClass?.();
            setCurrentClass(null);
          }}
        />
      )}

      {/* Chart */}
      {/* <StudentsPerClassChart
        data={classes.map((c) => ({
          id: c.id,
          className: c.name,
          count: c.students?.length || 0,
        }))}
        onBarClick={async (cls) => {
          selectClass(cls);
          setCurrentClass(cls);
          setStudentsOpen(true);
          await fetchClassById(cls.id);
        }}
      /> */}
    </div>
  );
}
