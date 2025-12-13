"use client";

import { useState, useEffect, useRef } from "react";
import { useStudentStore } from "@/app/store/useStudentStore.ts";
import { useAdmissionStore, GradeOption } from "@/app/store/admissionStore.ts";

interface AssignClassGradeButtonProps {
  studentId: string;
  currentClassId?: string;
  currentGradeId?: string;
  grades: GradeOption[];
  classes: { id: string; name: string }[];
}

export default function AssignClassGradeButton({
  studentId,
  currentClassId,
  currentGradeId,
  grades,
  classes,
}: AssignClassGradeButtonProps) {
  const [open, setOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(currentClassId || "");
  const [selectedGrade, setSelectedGrade] = useState(currentGradeId || "");

  const { updateStudent } = useStudentStore();
  const { selectGrade } = useAdmissionStore();

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedClass(currentClassId || "");
    setSelectedGrade(currentGradeId || "");
  }, [currentClassId, currentGradeId]);

  // Focus first input when modal opens
  useEffect(() => {
    if (open && modalRef.current) {
      const firstInput =
        modalRef.current.querySelector<HTMLSelectElement>("select");
      firstInput?.focus();
    }
  }, [open]);

  // Handle Escape key and Tab focus trap
  useEffect(() => {
    if (!open || !modalRef.current) return;

    const focusableSelectors =
      'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex="0"]';
    const focusableElements = Array.from(
      modalRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
    );

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      } else if (e.key === "Tab") {
        if (focusableElements.length === 0) return;

        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const handleAssign = async () => {
    if (!studentId) return;

    if (!selectedGrade && selectedClass) {
      const available = grades.find((g) => g.enrolled < g.capacity);
      setSelectedGrade(available?.id || "");
    }

    await updateStudent(studentId, {
      classId: selectedClass || undefined,
      gradeId: selectedGrade || undefined,
    });

    setOpen(false);
  };

  return (
    <>
      <button
        className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        onClick={() => setOpen(true)}
      >
        Assign Class & Grade
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            ref={modalRef}
            className="bg-white p-6 rounded shadow-md w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-lg font-semibold mb-4">Assign Class & Grade</h2>

            <div className="mb-4">
              <label className="block mb-1 font-medium">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full border px-2 py-1 rounded"
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-medium">Grade</label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full border px-2 py-1 rounded"
              >
                <option value="">Select Grade</option>
                {grades
                  .filter(
                    (g) =>
                      !selectedClass ||
                      g.id === selectedGrade ||
                      g.enrolled < g.capacity
                  )
                  .map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name} ({grade.enrolled}/{grade.capacity})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-3 py-1 border rounded hover:bg-gray-100"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={handleAssign}
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
