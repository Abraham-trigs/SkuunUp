"use client";

import React from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { useState, useEffect, useMemo } from "react";
import { useStudentStore, StudentListItem } from "@/app/store/useStudentStore";
import { useRouter } from "next/navigation";

interface StudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  className: string;
}

export default function StudentsModal({
  isOpen,
  onClose,
  classId,
  className,
}: StudentsModalProps) {
  const { fetchStudents, students, loading } = useStudentStore();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const router = useRouter();

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch students when modal opens
  useEffect(() => {
    if (isOpen && classId) fetchStudents({ classId });
  }, [isOpen, classId, fetchStudents]);

  // Normalize strings for search
  const normalize = (str: string) =>
    str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  // Derive full name from user object
  const getStudentFullName = (s: StudentListItem) =>
    [s.user?.firstName, s.user?.otherNames, s.user?.surname]
      .filter(Boolean)
      .join(" ") || "Unnamed Student";

  // Filtered students based on search
  const filteredStudents = useMemo(() => {
    const term = normalize(debouncedSearch.trim());
    if (!term) return students;
    return students.filter((s) =>
      normalize(getStudentFullName(s)).includes(term)
    );
  }, [students, debouncedSearch]);

  // Highlight search matches
  const highlightMatches = (name: string) => {
    const term = normalize(debouncedSearch.trim());
    if (!term) return name;

    const normalizedName = normalize(name);
    const result: React.ReactNode[] = [];
    let lastIndex = 0;
    const regex = new RegExp(term, "gi");
    let match: RegExpExecArray | null;

    while ((match = regex.exec(normalizedName)) !== null) {
      const start = match.index;
      const end = start + match[0].length;

      if (start > lastIndex) {
        result.push(name.slice(lastIndex, start));
      }

      result.push(
        <span key={start} className="bg-yellow-200">
          {name.slice(start, end)}
        </span>
      );

      lastIndex = end;
    }

    if (lastIndex < name.length) {
      result.push(name.slice(lastIndex));
    }

    return result;
  };
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <DialogTitle className="text-xl font-semibold mb-4">
            Students in {className}
          </DialogTitle>

          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-ford-primary"
          />

          {loading ? (
            <p className="text-gray-500 text-center">Loading...</p>
          ) : students.length === 0 ? (
            <p className="text-gray-500 text-center">
              No students enrolled in this class yet.
            </p>
          ) : filteredStudents.length === 0 ? (
            <p className="text-gray-500 text-center">
              No students match your search.
            </p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {filteredStudents.map((s) => (
                <li
                  key={s.id}
                  className="px-2 py-1 border rounded cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    router.push(`/dashboard/students/${s.id}`);
                    onClose();
                  }}
                >
                  {highlightMatches(getStudentFullName(s))}
                </li>
              ))}
            </ul>
          )}

          <button
            onClick={onClose}
            className="mt-6 w-full px-4 py-2 rounded-lg bg-ford-primary text-white hover:bg-ford-secondary transition"
          >
            Close
          </button>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
