// app/dashboard/classes/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useClassesStore } from "@/app/store/useClassesStore.ts";

import AddClassModal from "./components/AddClassModal.tsx";
import EditClassModal from "./components/EditClassModal.tsx";
import DeleteClassModal from "./components/DeleteClassModal.tsx";
import StudentsModal from "./components/StudentsModal.tsx";

import { ClassesTable, ClassTableRow } from "./components/ClassesTable.tsx";
import { Pagination } from "@/app/dashboard/classes/components/Pagination.tsx";
import { SearchInput } from "@/app/dashboard/classes/components/SearchInput.tsx";
import { useModal } from "@/app/dashboard/components/common/useModal.ts";

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

  const { isOpen: addOpen, open: openAdd, close: closeAdd } = useModal();
  const { isOpen: editOpen, open: openEdit, close: closeEdit } = useModal();
  const {
    isOpen: deleteOpen,
    open: openDelete,
    close: closeDelete,
  } = useModal();
  const {
    isOpen: studentsOpen,
    open: openStudents,
    close: closeStudents,
  } = useModal();

  const [currentClass, setCurrentClass] = useState<ClassTableRow | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState("");

  // -------------------------
  // Initial fetch
  // -------------------------
  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // -------------------------
  // Search debounce
  // -------------------------
  useEffect(() => {
    const handler = setTimeout(() => setSearch(localSearch), 300);
    return () => clearTimeout(handler);
  }, [localSearch, setSearch]);

  // -------------------------
  // Sorting
  // -------------------------
  const toggleSort = (key: "name" | "studentCount") => {
    const order = sortBy === key && sortOrder === "asc" ? "desc" : "asc";
    setSort(key, order);
  };

  const totalPages = Math.ceil(total / perPage);

  // -------------------------
  // Modal handlers
  // -------------------------
  const handleEdit = async (cls: ClassTableRow) => {
    selectClass(cls);
    setCurrentClass(cls);
    openEdit();
    await fetchClassById(cls.id);
  };

  const handleDelete = (cls: ClassTableRow) => {
    setDeleteTargetId(cls.id);
    selectClass(cls);
    openDelete();
  };

  const handleViewStudents = async (cls: ClassTableRow) => {
    selectClass(cls);
    setCurrentClass(cls);
    openStudents();
    await fetchClassById(cls.id);
  };

  return (
    <div className="p-6 space-y-6 mt-7 ml-5 mr-20">
      {/* Header + Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl text-[#BFCDEF]">
            CLASSES
          </h1>
          <div className="flex items-center gap-2">
            <span
              className="h-1 w-8 rounded-full"
              style={{ backgroundColor: "#6BE8EF" }}
            />
            <p className="text-xs uppercase tracking-[0.2em] opacity-60 font-bold text-[#BFCDEF]">
              Academic Management
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <SearchInput
            value={localSearch}
            onChange={setLocalSearch}
            placeholder="Search directory..."
            className="sm:w-72"
          />
          <button
            onClick={openAdd}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 rounded-xl font-black uppercase text-xs tracking-widest hover:scale-[1.03] active:scale-95 transition-all shadow-lg shadow-[#6BE8EF]/20"
            style={{ backgroundColor: "#6BE8EF", color: "#03102b" }}
          >
            Add Class
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <div className="w-8 h-8 border-4 border-[#6BE8EF] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium animate-pulse text-[#BFCDEF]">
            Synchronizing academic data...
          </p>
        </div>
      ) : (
        <>
          <ClassesTable
            classes={classes}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={toggleSort}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewStudents={handleViewStudents}
          />

          <Pagination
            page={page}
            totalPages={totalPages}
            onPrev={() => fetchClasses(page - 1)}
            onNext={() => fetchClasses(page + 1)}
          />
        </>
      )}

      {/* Modals */}
      {addOpen && (
        <AddClassModal
          isOpen={addOpen}
          onClose={closeAdd}
          onSuccess={() => fetchClasses(page)}
        />
      )}
      {editOpen && selectedClass && (
        <EditClassModal
          isOpen={editOpen}
          onClose={() => {
            closeEdit();
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
            closeDelete();
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
            closeStudents();
            clearSelectedClass?.();
            setCurrentClass(null);
          }}
        />
      )}
    </div>
  );
}
