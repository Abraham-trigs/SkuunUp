// app/admission/components/Step7FeesDeclaration.tsx
// Purpose: Step 7 of the admission form — captures fees acknowledgment, declaration, and allows selection of class & grade.

"use client";

import React, { useEffect, useState } from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";
import { useClassesStore } from "@/app/store/useClassesStore.ts";
import LabeledInput from "./LabeledInput.tsx";
import { Class } from "@prisma/client";

// Extend Class type to include grades
interface ClassWithGrades extends Class {
  grades: { id: string; name: string; capacity: number; enrolled: number }[];
}

export default function StepFeesDeclaration() {
  const { formData, setField, setClass, selectGrade } = useAdmissionStore();
  const { classes, fetchClasses } = useClassesStore();

  const [gradesForClass, setGradesForClass] = useState<
    ClassWithGrades["grades"]
  >([]);

  // Fetch classes on mount if not already loaded
  useEffect(() => {
    if (!classes || classes.length === 0) fetchClasses();
  }, [classes, fetchClasses]);

  // Update grades dropdown when class changes
  useEffect(() => {
    if (!formData.classId) {
      setGradesForClass([]);
      return;
    }
    const selectedClass = classes.find(
      (c) => c.id === formData.classId
    ) as ClassWithGrades;
    setGradesForClass(selectedClass?.grades || []);
  }, [formData.classId, classes]);

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const classId = e.target.value;
    setClass(classId, []); // pass empty array instead of undefined
  };

  const handleGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const gradeId = e.target.value;
    selectGrade(gradeId);
  };

  return (
    <div className="space-y-4">
      {/* Fees & Declaration */}
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={formData.feesAcknowledged || false}
          onChange={(e) => setField("feesAcknowledged", e.target.checked)}
        />
        <span>Fees Acknowledged</span>
      </label>

      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={formData.declarationSigned || false}
          onChange={(e) => setField("declarationSigned", e.target.checked)}
        />
        <span>Declaration Signed</span>
      </label>

      {/* Signature Input */}
      <LabeledInput
        label="Signature"
        value={formData.signature || ""}
        onChangeValue={(v) => setField("signature", v)}
        placeholder="Enter signature"
      />

      {/* Class Dropdown */}
      <div>
        <label className="block mb-1 font-medium">Class</label>
        <select
          value={formData.classId || ""}
          onChange={handleClassChange}
          className="border px-3 py-2 rounded w-full sm:w-64"
        >
          <option value="" disabled>
            Select class
          </option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Grade Dropdown */}
      <div>
        <label className="block mb-1 font-medium">Grade</label>
        <select
          value={formData.gradeId || ""}
          onChange={handleGradeChange}
          className="border px-3 py-2 rounded w-full sm:w-64"
          disabled={!formData.classId || gradesForClass.length === 0}
        >
          <option value="" disabled>
            Select grade
          </option>
          {gradesForClass.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name} (Enrolled: {g.enrolled}/{g.capacity})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
