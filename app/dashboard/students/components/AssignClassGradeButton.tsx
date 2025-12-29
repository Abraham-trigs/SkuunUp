"use client";

import { useState, useEffect } from "react";
import { useClassesStore } from "@/app/store/useClassesStore.ts";
import { useAdmissionStore, GradeOption } from "@/app/store/admissionStore.ts";
import { useStudentStore } from "@/app/store/useStudentStore.ts";

interface AssignClassGradeButtonProps {
  studentId: string;
  currentClassId?: string | null;
  currentGradeId?: string | null;
  onAssigned?: () => void;
}

export default function AssignClassGradeButton({
  studentId,
  currentClassId,
  currentGradeId,
  onAssigned,
}: AssignClassGradeButtonProps) {
  const { classes, fetchClasses } = useClassesStore();
  const { setClass, selectGrade, gradesForSelectedClass } = useAdmissionStore();
  const { updateStudent } = useStudentStore();

  const [selectedClassId, setSelectedClassId] = useState(currentClassId ?? "");
  const [selectedGradeId, setSelectedGradeId] = useState(currentGradeId ?? "");
  const [open, setOpen] = useState(false);

  // Load classes if not already loaded
  useEffect(() => {
    if (!classes.length) fetchClasses();
  }, [classes.length, fetchClasses]);

  // Auto-select first available grade when class changes
  useEffect(() => {
    if (!selectedClassId) {
      setSelectedGradeId("");
      return;
    }

    const availableGrade = gradesForSelectedClass.find(
      (g) => g.enrolled < g.capacity
    );
    setSelectedGradeId(availableGrade?.id ?? "");
  }, [selectedClassId, gradesForSelectedClass]);

  const handleAssign = async () => {
    if (!selectedClassId || !selectedGradeId) return;

    const cls = classes.find((c) => c.id === selectedClassId);
    if (!cls) return;

    try {
      // Persist to student store (backend)
      await updateStudent(studentId, {
        classId: selectedClassId,
        gradeId: selectedGradeId,
      });

      // Update local admission store for UI
      setClass(cls.id, cls.grades as any);
      selectGrade(selectedGradeId, cls.grades as any);

      if (onAssigned) await onAssigned();
      setOpen(false);
    } catch (err) {
      console.error("Failed to assign class/grade:", err);
    }
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Assign Class & Grade</h2>

            {/* Class Selection */}
            <div className="mb-4">
              <label className="block mb-1 font-medium">Class</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full border px-2 py-1 rounded"
              >
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Grade Selection */}
            <div className="mb-4">
              <label className="block mb-1 font-medium">Grade</label>
              <select
                value={selectedGradeId}
                onChange={(e) => setSelectedGradeId(e.target.value)}
                className="w-full border px-2 py-1 rounded"
                disabled={!selectedClassId}
              >
                <option value="">Select Grade</option>
                {gradesForSelectedClass.map((g: GradeOption) => (
                  <option key={g.id} value={g.id}>
                    {g.name} (Enrolled: {g.enrolled}/{g.capacity})
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
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
                disabled={!selectedClassId || !selectedGradeId}
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
