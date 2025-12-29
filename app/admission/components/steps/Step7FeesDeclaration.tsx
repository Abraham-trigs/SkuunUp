// app/admission/components/Step7FeesDeclaration.tsx
// Purpose: Step 7 of the admission form — fees acknowledgment, declaration, class & grade selection.

"use client";

import React, { useEffect } from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";
import { useClassesStore } from "@/app/store/useClassesStore.ts";
import LabeledInput from "./LabeledInput.tsx";

export default function StepFeesDeclaration() {
  const { formData, setField, setClass, selectGrade, gradesForSelectedClass } =
    useAdmissionStore();
  const { classes, fetchClasses } = useClassesStore();

  // Fetch classes if not already loaded
  useEffect(() => {
    if (!classes || classes.length === 0) fetchClasses();
  }, [classes, fetchClasses]);

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const classId = e.target.value;
    setClass(classId); // store handles grades automatically
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

      {/* Signature */}
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
          disabled={!formData.classId || gradesForSelectedClass.length === 0}
        >
          <option value="" disabled>
            Select grade
          </option>
          {gradesForSelectedClass.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name} (Enrolled: {g.enrolled}/{g.capacity})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
